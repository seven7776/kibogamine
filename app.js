/* ============================================================
 * 希望之峰 · 主程序
 * 状态(localStorage) + hash路由 + 积分(黑白熊奖章) + 萌宠逻辑
 * ============================================================ */
(function () {
  'use strict';

  var D = window.KBG_DATA;
  var LS_KEY = 'kibogamine-v1';

  /* ================= 状态 ================= */
  function defaultState() {
    return {
      points: 30,
      sound: true,
      theme: 'dark',
      streak: 0,
      lastActiveDay: null,
      createdAt: Date.now(),
      lastTick: Date.now(),
      pet: {
        name: '黑白熊', skin: 'classic', owned: ['classic'],
        hunger: 80, thirst: 80, mood: 80, energy: 80,
        xp: 0, sleeping: false
      },
      study: {},          // lessonId -> {tasks:{}, finished, finishedAt}
      checkins: { items: D.DEFAULT_CHECKINS.slice(), log: {} }, // log: date -> {itemId:1}
      schedule: { grid: JSON.parse(JSON.stringify(D.DEFAULT_SCHEDULE)), extra: [] },
      badges: {},         // badgeId -> date
      counters: { guitarDays: 0, lessonsDone: 0, feeds: 0 }
    };
  }

  var S;
  try {
    S = JSON.parse(localStorage.getItem(LS_KEY)) || defaultState();
  } catch (e) { S = defaultState(); }
  if (!S.pet || !S.schedule) S = defaultState();

  function save() { localStorage.setItem(LS_KEY, JSON.stringify(S)); }

  /* ================= 工具 ================= */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
  function dkey(offset) {
    var d = new Date();
    if (offset) d = new Date(d.getTime() + offset * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function todayDow() { var d = new Date().getDay(); return d === 0 ? 7 : d; } // 1=一 .. 7=日
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ================= 音效（WebAudio 合成，无需音频文件，离线可用） ================= */
  var AC = null;
  function audioCtx() {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      return AC;
    } catch (e) { return null; }
  }
  function tone(freq, dur, delay, type, vol) {
    if (S.sound === false) return;
    var ac = audioCtx(); if (!ac) return;
    var t0 = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function sfx(name) {
    if (S.sound === false) return;
    switch (name) {
      case 'tap': tone(520, .08, 0, 'triangle', .09); break;
      case 'check': tone(660, .09, 0, 'sine', .14); tone(880, .1, .07, 'sine', .14); break;
      case 'earn': [523, 659, 784].forEach(function (f, i) { tone(f, .12, i * .08, 'triangle', .13); }); break;
      case 'done': [523, 659, 784, 1047].forEach(function (f, i) { tone(f, .16, i * .1, 'triangle', .15); }); tone(1568, .28, .44, 'sine', .09); break;
      case 'buy': tone(392, .1, 0, 'square', .06); tone(523, .14, .09, 'square', .06); break;
      case 'levelup': [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, .14, i * .09, 'triangle', .14); }); break;
      case 'sad': sweep(300, 180, .3, 0, 'sawtooth', .05); tone(150, .3, .3, 'sawtooth', .05); break;
      /* ---- 萌宠玩法专属音效 ---- */
      case 'feed': noise(.08, 0, .22, 1000); noise(.08, .17, .22, 750); noise(.11, .36, .24, 520); sweep(320, 120, .3, .55, 'sine', .2); break; /* 吧唧吧唧+吞咽 */
      case 'drink': sweep(560, 170, .2, 0, 'sine', .22); sweep(640, 190, .22, .3, 'sine', .22); tone(880, .05, .56, 'sine', .12); break; /* 咕咚咕咚+哈~ */
      case 'snack': tone(988, .08, 0, 'triangle', .15); tone(1319, .09, .09, 'triangle', .15); tone(1760, .18, .2, 'sine', .1); tone(659, .1, .2, 'triangle', .1); break; /* 甜脆叮咚 */
      case 'tickle': for (var i = 0; i < 7; i++) tone(i % 2 ? 940 : 700, .04, i * .05, 'triangle', .12); break; /* 痒痒颤音 */
      case 'roll': sweep(760, 180, .55, 0, 'triangle', .16); tone(85, .16, .58, 'sine', .24); break; /* 滚落+落地砰 */
      case 'sleep': [523, 392, 330, 262].forEach(function (f, i) { tone(f, .3, i * .3, 'sine', .1); }); break; /* 摇篮曲下行 */
      case 'wake': [330, 415, 523, 659].forEach(function (f, i) { tone(f, .12, i * .1, 'triangle', .13); }); break; /* 起床号上行 */
      case 'bear': bearVoice(); break; /* 唔噗噗！ */
      case 'pop': tone(1046, .05, 0, 'sine', .12); tone(784, .07, .04, 'sine', .1); break; /* 弹窗弹出 */
      case 'good': tone(784, .1, 0, 'triangle', .13); tone(1046, .14, .1, 'triangle', .13); break; /* 答对了 */
      case 'wrong': tone(233, .18, 0, 'square', .06); tone(196, .25, .16, 'square', .06); break; /* 答错了 */
    }
  }
  function sweep(f1, f2, dur, delay, type, vol) {
    var ac = audioCtx(); if (!ac) return;
    var t0 = ac.currentTime + (delay || 0);
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f1, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || .15, t0 + .02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + .05);
  }
  function noise(dur, delay, vol, freq) {
    var ac = audioCtx(); if (!ac) return;
    var n = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, n, ac.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.4);
    var src = ac.createBufferSource(); src.buffer = buf;
    var f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 900; f.Q.value = .8;
    var g = ac.createGain(); g.gain.value = vol || .2;
    src.connect(f); f.connect(g); g.connect(ac.destination);
    src.start(ac.currentTime + (delay || 0));
  }
  /* 黑白熊招牌"唔噗噗"——两声闷憨的熊叫 */
  function bearVoice() {
    sweep(340, 230, .1, 0, 'square', .12);      /* 唔 */
    sweep(300, 200, .12, .13, 'square', .12);   /* 噗 */
    noise(.06, .12, .05, 400);                  /* 鼻息 */
    sweep(260, 190, .09, .27, 'square', .09);   /* 噗~ */
  }

  /* ================= 英语点读（系统TTS优先，华为WebView无引擎时走有道在线朗读） ================= */
  var voicesCache = null, ttsVerdict = null, curAudio = null;
  function enVoice() {
    try {
      if (!voicesCache) {
        var vs = speechSynthesis.getVoices() || [];
        voicesCache = vs.filter(function (v) { return /^en(-|_)/i.test(v.lang); });
      }
      return voicesCache[0] || null;
    } catch (e) { return null; }
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = function () { voicesCache = null; };
  }
  function stopSpeak() {
    try { speechSynthesis.cancel(); } catch (e) { }
    if (curAudio) { try { curAudio.pause(); } catch (e) { } curAudio = null; }
  }
  function sysTtsReady(cb) {
    if (ttsVerdict) return cb(ttsVerdict === 'sys');
    try { ttsVerdict = localStorage.getItem('kbpg-tts'); } catch (e) { }
    if (ttsVerdict) return cb(ttsVerdict === 'sys');
    if (!('speechSynthesis' in window)) { ttsVerdict = 'web'; try { localStorage.setItem('kbpg-tts', 'web'); } catch (e) { } return cb(false); }
    var vs = speechSynthesis.getVoices();
    var ok = vs.some(function (v) { return /^en(-|_)/i.test(v.lang); });
    if (vs.length) { ttsVerdict = ok ? 'sys' : 'web'; try { localStorage.setItem('kbpg-tts', ttsVerdict); } catch (e) { } return cb(ok); }
    var n = 0, iv = setInterval(function () { // voices 异步加载，最多等2秒
      var v2 = speechSynthesis.getVoices();
      if (v2.length || ++n > 8) {
        clearInterval(iv);
        var ok2 = v2.some(function (v) { return /^en(-|_)/i.test(v.lang); });
        ttsVerdict = ok2 ? 'sys' : 'web';
        try { localStorage.setItem('kbpg-tts', ttsVerdict); } catch (e) { }
        cb(ok2);
      }
    }, 250);
  }
  function speakSys(text) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; var v = enVoice(); if (v) u.voice = v;
    u.rate = 0.85; u.pitch = 1.05;
    speechSynthesis.speak(u);
  }
  function speakWeb(text) {
    var a = new Audio('https://dict.youdao.com/dictvoice?type=0&audio=' + encodeURIComponent(text));
    curAudio = a;
    a.play().catch(function () { toast('在线朗读需要联网'); });
  }
  function speakEn(text, keep) {
    if (!keep) stopSpeak();
    sysTtsReady(function (ok) { ok ? speakSys(text) : speakWeb(text); });
  }
  function speakSeq(arr) {
    stopSpeak();
    sysTtsReady(function (ok) {
      if (ok) { arr.forEach(function (t, i) { setTimeout(function () { speakSys(t); }, i * 1700); }); return; }
      (function webSeq(i) {
        if (i >= arr.length) return;
        var a = new Audio('https://dict.youdao.com/dictvoice?type=0&audio=' + encodeURIComponent(arr[i]));
        curAudio = a;
        a.onended = function () { setTimeout(function () { webSeq(i + 1); }, 400); };
        a.onerror = function () { webSeq(i + 1); };
        a.play().catch(function () { toast('在线朗读需要联网'); webSeq(i + 1); });
      })(0);
    });
  }

  /* ================= 本地课本库（IndexedDB，照片只存本机不上网） ================= */
  var BOOK_DB = null;
  function bookDb(fn) {
    if (BOOK_DB) { fn(BOOK_DB); return; }
    var rq = indexedDB.open('kibogamine-books', 1);
    rq.onupgradeneeded = function () { rq.result.createObjectStore('pages', { keyPath: 'lid' }); };
    rq.onsuccess = function () { BOOK_DB = rq.result; fn(BOOK_DB); };
    rq.onerror = function () { toast('本地课本库打不开（浏览器存储被关了？）'); };
  }
  function bookGet(lid, cb) {
    bookDb(function (db) {
      var r = db.transaction('pages').objectStore('pages').get(lid);
      r.onsuccess = function () { cb(r.result || null); };
    });
  }
  function bookPut(rec, cb) {
    bookDb(function (db) {
      var r = db.transaction('pages', 'readwrite').objectStore('pages').put(rec);
      r.onsuccess = function () { cb && cb(); };
    });
  }
  function bookDel(lid, cb) {
    bookDb(function (db) {
      var r = db.transaction('pages', 'readwrite').objectStore('pages').delete(lid);
      r.onsuccess = function () { cb && cb(); };
    });
  }
  function bookAllKeys(cb) {
    bookDb(function (db) {
      var r = db.transaction('pages').objectStore('pages').getAllKeys();
      r.onsuccess = function () { cb(r.result || []); };
    });
  }
  function compressImg(file, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 1600, w = img.width, h = img.height;
      if (Math.max(w, h) > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } }
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      cb(cv.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = function () { toast('这张图读不出来，换一张试试'); };
    img.src = url;
  }
  /* 从电脑批量导入整本书（图存在电脑，通过家庭Wi-Fi拉进平板） */
  function importBook(ab, pages, addr, btn) {
    btn.disabled = true;
    btn.textContent = '⏳ ' + ab + ' 准备中…';
    sfx('check');
    function next(n) {
      if (n > pages) {
        btn.textContent = '✅ ' + ab + ' 已导入（' + pages + '页）';
        sfx('done'); toast('导入完成！点开每课直接看课本页');
        return;
      }
      var key = ab + ':' + String(n).padStart(3, '0');
      bookGet(key, function (rec) {
        if (rec && rec.imgs && rec.imgs[0]) { next(n + 1); return; } // 已导入的页跳过
        fetch('http://' + addr + '/img/' + ab + '/' + String(n).padStart(3, '0') + '.jpg')
          .then(function (r) { if (!r.ok) throw 0; return r.blob(); })
          .then(function (bl) {
            var fr = new FileReader();
            fr.onload = function () {
              bookPut({ lid: key, imgs: [fr.result], at: Date.now() }, function () {
                if (n % 10 === 0 || n === pages) btn.textContent = '⏳ ' + ab + ' 导入中 ' + n + '/' + pages;
                next(n + 1);
              });
            };
            fr.readAsDataURL(bl);
          })
          .catch(function () { next(n + 1); }); // 单页失败跳过继续
      });
    }
    next(1);
  }

  function toast(msg) {
    var wrap = $('#toast-wrap');
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 1700);
    setTimeout(function () { t.remove(); }, 2100);
  }

  function floatPts(x, y, text) {
    var el = document.createElement('div');
    el.className = 'float-pts'; el.textContent = text;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 1000);
  }

  function modal(title, bodyHtml, onOk, okText) {
    var mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.innerHTML = '<div class="modal"><h3>' + esc(title) + '</h3>' + bodyHtml +
      '<div class="btn-row"><button class="btn ghost" id="m-cancel">取消</button>' +
      '<button class="btn" id="m-ok">' + esc(okText || '确定') + '</button></div></div>';
    document.body.appendChild(mask);
    $('#m-cancel', mask).onclick = function () { mask.remove(); };
    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
    $('#m-ok', mask).onclick = function () {
      if (onOk && onOk(mask) === false) return;
      mask.remove();
    };
    return mask;
  }

  /* ================= 积分 ================= */
  function earn(n, why, ev) {
    S.points += n;
    sfx('earn');
    // 连续天数
    var t = dkey(), y = dkey(-1);
    if (S.lastActiveDay !== t) {
      S.streak = (S.lastActiveDay === y) ? S.streak + 1 : 1;
      S.lastActiveDay = t;
    }
    save();
    if (ev) floatPts(ev.clientX || innerWidth / 2, (ev.clientY || 200) - 10, '+' + n);
    toast('+' + n + ' 奖章' + (why ? ' · ' + why : ''));
    updateMedalPill();
    checkBadges();
  }
  function spend(n) {
    if (S.points < n) { toast('奖章不够啦，先去学习打卡挣奖章！'); return false; }
    S.points -= n; save(); updateMedalPill(); sfx('buy');
    return true;
  }
  function updateMedalPill() {
    var el = $('#medal-count');
    if (el) el.textContent = S.points;
  }

  /* ================= 黑白熊台词 ================= */
  var QUOTES = {
    feed: ['唔噗噗，这还差不多。', '吧唧吧唧……再来一碗！', '校长的午餐时间！', '好吃到想开班级审判！', '能量补满，绝望退散！', '这顿算你孝顺校长的。'],
    drink: ['咕咚咕咚……噗哈！', '水是希望之源哦。', '干杯~以超高校级校长的名义！', '咕噜咕噜……喉咙得救了。'],
    snack: ['零食！！唔噗噗噗~', '这个归校长我了！', '藏起来……才不给你。', '甜品是绝望里唯一的希望！', '唔哦哦，是高热量的幸福！'],
    tickle: ['唔噗噗噗~住手啦好痒！', '哈哈哈……你完啦你完啦', '再挠就把你关禁闭！', '肚、肚子……好痒哈哈哈！'],
    roll: ['翻个身~别看我屁股。', '哼，给你个背影。', '本校长今日不营业。', '背对你也是一种关爱。'],
    sleep: ['晚安……明天也要充满希望地绝望哦。', '呼……呼……', 'zzZ……梦见超大熊饼干……', '别吵，校长充电中……'],
    wake: ['唔……再睡五分钟……', '早啊，今天也要给校长挣奖章！', '哈啊~睡饱了，超高校级的一天！', '醒了醒了……早饭呢？'],
    angry: ['你再不管我，就开班级审判了哦！', '饿扁了……这就是绝望的味道吗？', '喂——有人吗——', '本校长要闹了！奖章呢！饭呢！', '绝望……扑面而来的被冷落的绝望……'],
    tap: ['干嘛？', '唔噗噗！', '找校长有事？', '戳我戳我，奖章拿来~', '再戳就要收按摩费了哦！', '手感如何？本校长可是超高校级的柔软。', '别把熊毛戳掉了！'],
    levelup: ['升级啦！我们的羁绊加深了哦！', '唔哦哦，力量涌上来了！', '离超高校级校长又近一步！'],
    studyDone: ['又完成一课！不愧是看中的人才！', '唔噗噗，奖章没白发吧？', '这种学习速度……超高校级的！', '距离毕业又近一天，可喜可贺！', '课本都被你征服了，本校长很满意。'],
    checkin: ['打卡成功！坚持就是希望！', '今天的任务，消灭！', '唔噗噗，又向绝望势力前进一格！', '连续作战，校长看好你哦。']
  };
  function quote(type) {
    var arr = QUOTES[type] || QUOTES.tap;
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function greetLine() {
    var h = new Date().getHours();
    if (h < 6) return '这么早？！你是超高校级的早起冠军吗……';
    if (h < 9) return '早上好！今天是充满希望的一天！';
    if (h < 12) return '上午好，学习使校长快乐~';
    if (h < 14) return '午饭时间！吃饱了才有力气绝望……啊不，学习！';
    if (h < 18) return '下午好，奖章在手，天下我有！';
    if (h < 22) return '晚上好~今日份的作业消灭了吗？';
    return '这么晚还不睡？黑白熊校长要查寝了哦！';
  }

  /* ================= 萌宠数值 ================= */
  var LEVELS = ['刚认识', '有点熟', '同桌', '搭档', '好朋友', '死党', '希望伙伴', '超高校级的朋友'];
  function petLevel() { return Math.min(8, Math.floor(S.pet.xp / 60) + 1); }
  function petLevelName() { return LEVELS[petLevel() - 1]; }

  function addXp(n) {
    var old = petLevel();
    S.pet.xp += n;
    if (petLevel() > old) {
      say(quote('levelup'));
      sfx('levelup');
      toast('羁绊升级！Lv.' + petLevel() + ' ' + petLevelName());
    }
    save();
  }

  function decayTick() {
    var now = Date.now();
    var hours = (now - (S.lastTick || now)) / 3600000;
    if (hours <= 0) return;
    S.lastTick = now;
    var p = S.pet;
    if (p.sleeping) {
      p.energy = Math.min(100, p.energy + 20 * hours);
    } else {
      p.hunger = Math.max(0, p.hunger - 4 * hours);
      p.thirst = Math.max(0, p.thirst - 5 * hours);
      p.mood = Math.max(0, p.mood - 3 * hours);
      p.energy = Math.max(0, p.energy - 2 * hours);
    }
    save();
  }

  function petGrumpy() {
    var p = S.pet;
    return p.hunger < 30 || p.thirst < 30 || p.mood < 30 || p.energy < 20;
  }

  /* 气泡台词（萌宠页舞台） */
  var sayTimer = null;
  function say(text) {
    var b = $('#pet-bubble');
    if (!b) return;
    b.textContent = text;
    b.style.display = 'block';
    if (sayTimer) clearTimeout(sayTimer);
    sayTimer = setTimeout(function () { b.style.display = 'none'; }, 2600);
  }

  /* ================= 徽章 ================= */
  var BADGES = {
    first_lesson: { name: '希望的曙光', desc: '完成第一课' },
    streak7: { name: '坚持的一周', desc: '连续活跃7天' },
    first_skin: { name: '换装达人', desc: '拥有第一款皮肤' },
    guitar7: { name: '摇滚新星', desc: '吉他打卡满7天（解锁草裙吉他皮肤）' },
    lv5: { name: '羁绊之力', desc: '羁绊达到Lv.5' }
  };
  function grantBadge(id) {
    if (S.badges[id]) return;
    S.badges[id] = dkey();
    save();
    toast('获得徽章：' + BADGES[id].name + '！');
  }
  function checkBadges() {
    if (S.streak >= 7) grantBadge('streak7');
    if (petLevel() >= 5) grantBadge('lv5');
    if (S.counters.guitarDays >= 7) grantBadge('guitar7');
  }
  function ownsSkin(id) { return S.pet.owned.indexOf(id) >= 0; }
  function skinAvailable(id) { // 解锁条件
    if (id === 'hula') return S.counters.guitarDays >= 7 || ownsSkin(id);
    return true;
  }

  /* ================= 今日任务 ================= */
  function todayTasks() {
    var tasks = [];
    var t = dkey();
    // 学习
    var learnedToday = Object.keys(S.study).some(function (lid) {
      var r = S.study[lid];
      return r && r.finishedAt && r.finishedAt.slice(0, 10) === t;
    });
    tasks.push({ id: '_study', subj: '学习', color: 'var(--pink)', text: '完成任意一课跟课学习', pts: 20, done: learnedToday, go: '#/study' });
    // 打卡项
    var log = S.checkins.log[t] || {};
    S.checkins.items.forEach(function (it) {
      tasks.push({ id: it.id, subj: '打卡', color: 'var(--green)', text: it.name, pts: it.points, done: !!log[it.id], go: '#/checkin' });
    });
    // 萌宠
    tasks.push({ id: '_pet', subj: '萌宠', color: 'var(--gold)', text: '照顾黑白熊（喂食/互动）', pts: 0, done: S.counters.feeds > 0 && S._feedDay === t, go: '#/pet' });
    return tasks;
  }

  /* ================= 视图 ================= */
  var view = $('#view');

  function subjOfCourse(name) { // 课程名 → 学科key
    if (/语|作文|书法/.test(name)) return 'chinese';
    if (/数/.test(name)) return 'math';
    if (/英/.test(name)) return 'english';
    return null;
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    var dow = todayDow();
    var courses = (dow <= 5 && S.schedule.grid[dow]) ? S.schedule.grid[dow] : [];
    var tasks = todayTasks();
    var done = tasks.filter(function (t) { return t.done; }).length;
    var pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    var r = 34, c = 2 * Math.PI * r, off = c * (1 - pct / 100);

    var h = '';
    h += '<div class="hero"><div class="hero-info">' +
      '<div class="hi">' + (dow <= 5 ? '今天周' + '一二三四五'[dow - 1] : '今天是周末') + ' · ' + S.pet.name + '在等你</div>' +
      '<h2>你好，<span style="color:var(--gold)">五年级</span>的同学</h2>' +
      '<div class="streak">🔥 连续学习 ' + S.streak + ' 天</div>' +
      '</div><div class="ring-wrap"><svg width="84" height="84">' +
      '<circle cx="42" cy="42" r="' + r + '" stroke="#2A2E38" stroke-width="8" fill="none"/>' +
      '<circle cx="42" cy="42" r="' + r + '" stroke="#FFD24D" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '"/>' +
      '</svg><div class="ring-num"><b>' + pct + '%</b><i>今日进度</i></div></div></div>';

    // 今日课程
    h += '<div class="section-title">今日课程<span class="sub">点卡片去学</span></div>';
    if (courses.length) {
      h += '<div class="course-grid">';
      var seen = {};
      courses.forEach(function (name) {
        var sk = subjOfCourse(name);
        if (seen[name]) return; seen[name] = 1;
        var color = sk ? D.CURRICULUM[sk].color : 'var(--dim)';
        h += '<div class="course-card" data-go="' + (sk ? '#/study' : '#/schedule') + '">' +
          '<div class="subj"><span class="dot" style="background:' + color + '"></span>' + esc(name) + '</div>' +
          '<div class="name">' + (sk ? '去跟课学习' : '副科/活动') + '</div>' +
          '<button class="go">' + (sk ? '去学习' : '看课表') + '</button></div>';
      });
      h += '</div>';
    } else {
      h += '<div class="card"><div class="empty-tip">今天没有学校课程，去打卡或陪' + esc(S.pet.name) + '玩吧</div></div>';
    }

    // 今日任务
    h += '<div class="section-title">今日任务<span class="sub">' + done + '/' + tasks.length + '</span></div>';
    tasks.forEach(function (t) {
      h += '<div class="task-row' + (t.done ? ' done' : '') + '" data-go="' + t.go + '">' +
        '<div class="chk">✓</div>' +
        '<span class="badge-subj" style="background:rgba(255,255,255,.06);color:' + t.color + '">' + t.subj + '</span>' +
        '<span class="txt">' + esc(t.text) + '</span>' +
        (t.pts ? '<span class="pts">+' + t.pts + '</span>' : '') + '</div>';
    });

    // 数据
    var weekLearned = Object.keys(S.study).filter(function (lid) {
      var r = S.study[lid];
      if (!r || !r.finishedAt) return false;
      return (Date.now() - new Date(r.finishedAt).getTime()) < 7 * 86400000;
    }).length;
    h += '<div class="stat-row" style="margin-top:14px">' +
      '<div class="stat-cell"><b>' + weekLearned + '</b><span>本周学完(课)</span></div>' +
      '<div class="stat-cell gold"><b>' + S.points + '</b><span>黑白熊奖章</span></div>' +
      '<div class="stat-cell"><b>Lv.' + petLevel() + '</b><span>羁绊等级</span></div></div>';

    // 徽章墙
    var owned = Object.keys(S.badges);
    if (owned.length) {
      h += '<div class="section-title">徽章墙</div><div class="card"><div class="word-chips">';
      owned.forEach(function (id) {
        h += '<span class="chip" style="border-color:var(--gold-dim);color:var(--gold)">🏅 ' + BADGES[id].name + '</span>';
      });
      h += '</div></div>';
    }
    return h;
  }

  /* ---------- 学习·学科列表 ---------- */
  function renderStudy() {
    var h = '<div class="section-title">跟课学习<span class="sub">江苏南通·五年级上册</span></div>';
    Object.keys(D.CURRICULUM).forEach(function (key) {
      var s = D.CURRICULUM[key];
      var total = 0, done = 0;
      s.units.forEach(function (u) {
        u.lessons.forEach(function (l) {
          if (l.skeleton) return;
          total++;
          if (S.study[l.id] && S.study[l.id].finished) done++;
        });
      });
      h += '<div class="subj-card" data-go="#/subject/' + key + '">' +
        '<div class="subj-icon" style="background:' + s.color + '22;color:' + s.color + ';border:1px solid ' + s.color + '55">' + s.icon + '</div>' +
        '<div class="meta"><b>' + s.name + '</b><div>' + s.version + ' · 已完成 ' + done + '/' + total + ' 课</div></div>' +
        '<span class="arrow">›</span></div>';
    });
    h += '<div class="hint">九科齐了：语数英内容全量；科学/道法目录+课本页就绪，知识点练习本周补；音乐/美术/信息科技/劳动等开学核对版本后建。</div>';
    return h;
  }

  /* ---------- 学科·单元课文 ---------- */
  function renderSubject(key) {
    var s = D.CURRICULUM[key];
    if (!s) return '<div class="empty-tip">学科不存在</div>';
    var h = '<div class="back-row"><button data-go="#/study">‹ 返回学科</button></div>';
    if (!s.units || !s.units.length) {
      return h + '<div class="lesson-hero"><div class="crumb">' + s.version + '</div><h2 style="color:' + s.color + '">' + s.name + '</h2></div>' +
        '<div class="card"><div class="hint">这门课等开学拿到课本后补目录和内容（版本先按学校实际用书核对）。现在它已经能出现在课表里、可以加入打卡。</div></div>' +
        '<div class="card"><div class="hint">先用起来的办法：把这一科的作业/练习拍照存进「每日打卡」自定义项目。</div></div>';
    }
    h += '<div class="lesson-hero"><div class="crumb">' + s.version + '</div><h2 style="color:' + s.color + '">' + s.name + '</h2>' +
      '<div class="focus">点单元展开课文，点课文开始学习</div></div>';
    if (s.ebook) h += '<a class="btn" style="display:block;width:100%;text-decoration:none;margin-top:8px" href="' + s.ebook + '" target="_blank" rel="noopener">📖 看电子课本（原版课本页）</a>';
    s.units.forEach(function (u, ui) {
      h += '<div class="unit-block' + (ui === 0 ? ' open' : '') + '" data-unit>' +
        '<div class="unit-head"><span style="color:' + s.color + '">▸</span><div>' + esc(u.title) +
        '<span class="ufocus">' + esc(u.focus) + '</span></div><span class="caret">›</span></div>' +
        '<div class="unit-lessons">';
      u.lessons.forEach(function (l) {
        var st = S.study[l.id];
        h += '<div class="lesson-row" data-go="' + (l.skeleton ? '' : '#/lesson/' + key + '/' + l.id) + '" data-skel="' + (l.skeleton ? 1 : '') + '">' +
          '<span class="done-mark">' + (st && st.finished ? '🏅' : '·') + '</span>' +
          '<span>' + esc(l.title) + '</span>' +
          (D.PAGES && D.PAGES[l.id] ? '<a class="book-btn" style="margin-left:auto;text-decoration:none;font-size:19px;line-height:1" href="' + D.PAGES[l.id] + '" target="_blank" rel="noopener" title="看课本原文">📖</a>' : '') +
          (l.skeleton ? '<span class="skel">填充中</span>' : '') + '</div>';
      });
      h += '</div></div>';
    });
    return h;
  }

  /* ---------- 课文详情 ---------- */
  function findLesson(key, lid) {
    var s = D.CURRICULUM[key];
    for (var i = 0; i < s.units.length; i++) {
      var ls = s.units[i].lessons;
      for (var j = 0; j < ls.length; j++) if (ls[j].id === lid) return { subject: s, unit: s.units[i], lesson: ls[j] };
    }
    return null;
  }

  function renderLesson(key, lid) {
    var found = findLesson(key, lid);
    if (!found) return '<div class="empty-tip">课文不存在</div>';
    var s = found.subject, u = found.unit, l = found.lesson;
    var st = S.study[l.id] || { tasks: {}, finished: false };
    var typeName = { read: '朗读', write: '书写', listen: '听力', speak: '开口', quiz: '练习', observe: '观察' };

    var h = '<div class="back-row"><button data-go="#/subject/' + key + '">‹ 返回' + s.name + '</button></div>';
    h += '<div class="lesson-hero"><div class="crumb">' + esc(u.title) + (l.author ? ' · ' + esc(l.author) : '') + '</div>' +
      '<h2 style="color:' + s.color + '">' + esc(l.title) + '</h2>' +
      '<div class="focus">学习重点：' + esc(l.focus) + '</div></div>';

    // 整本书离线页（导入后课文页直接显示课本图）
    h += '<div id="book-embed"></div>';

    // 课文全文（公版课文）
    if (l.fullText && l.fullText.length) {
      h += '<div class="section-title">课文全文<span class="sub">公版课文 · 可直接背诵</span></div><div class="card">';
      l.fullText.forEach(function (p) {
        h += '<p style="margin:0 0 10px;text-indent:2em;font-size:15px;line-height:1.9">' + esc(p) + '</p>';
      });
      h += '</div>';
    }

    // 课本原文（电子课本页）
    if (D.PAGES && D.PAGES[l.id]) {
      h += '<a class="btn" style="display:block;width:100%;text-decoration:none" href="' + D.PAGES[l.id] + '" target="_blank" rel="noopener">📖 课本原文（点开翻页读全文）</a>';
    }

    // 本地课本照片（拍照导入，只存本机）
    h += '<div style="display:flex;gap:8px;margin-top:8px">' +
      '<button class="btn ghost" style="flex:1" id="photo-import">📷 拍照/选图存课本页</button>' +
      '<button class="btn ghost" style="flex:1;display:none" id="photo-view">📚 本地课本</button></div>' +
      '<input type="file" id="photo-file" accept="image/*" multiple style="display:none">' +
      '<div class="hint" style="margin-top:6px">拍下的课本页只存在这台平板里，不上网，没网也能翻。</div>';

    // 预习任务
    if (l.preview && l.preview.length) {
      h += '<div class="section-title">预习任务<span class="sub">完成一项 +5 奖章</span></div>';
      l.preview.forEach(function (t, i) {
        var done = st.tasks['p' + i];
        h += '<div class="task-row' + (done ? ' done' : '') + '" data-task="p' + i + '" data-lesson="' + l.id + '">' +
          '<div class="chk">✓</div>' +
          '<span class="badge-subj" style="background:rgba(255,255,255,.06);color:' + s.color + '">' + (typeName[t.type] || '任务') + '</span>' +
          '<span class="txt">' + esc(t.text) + '</span><span class="pts">+5</span></div>';
      });
    }

    // 词语/单词
    if (l.words) {
      var isEn = key === 'english';
      h += '<div class="section-title">' + (isEn ? '单词短语<span class="sub">点单词🔊听读+看卡片</span>' : '词语积累') + '</div><div class="card"><div class="word-chips">';
      if (l.words.list) l.words.list.forEach(function (w) { h += isEn
        ? '<span class="chip eng speak" data-say="' + esc(w) + '" style="cursor:pointer">🔊 ' + esc(w) + '</span>'
        : '<span class="chip">' + esc(w) + '</span>'; });
      if (l.words.phrases) l.words.phrases.forEach(function (w) { h += '<span class="chip eng speak" data-say="' + esc(w) + '" style="border-color:var(--gold-dim);cursor:pointer">🔊 ' + esc(w) + '</span>'; });
      if (l.words.write) l.words.write.forEach(function (w) { h += '<span class="chip zi-chip" data-zi="' + esc(w) + '" style="border-color:' + s.color + '55;cursor:pointer">' + esc(w) + '</span>'; });
      h += '</div>';
      if (isEn) h += '<button class="btn ghost" style="width:100%;margin-top:10px" id="speak-all">🔊 顺序读一遍全部单词</button>';
      if (l.words.write) h += '<div class="hint">带色框的是会写字，<b>点一下字看出卡片</b>（拼音·释义·组词·例句）；每个写两遍，明天听写。</div>';
      h += '</div>';
    }

    // 知识点
    if (l.points && l.points.length) {
      h += '<div class="section-title">知识点</div>';
      l.points.forEach(function (p) {
        h += '<div class="card"><b style="color:' + s.color + '">' + esc(p.title) + '</b><div style="font-size:14px;margin-top:4px">' + esc(p.text) + '</div></div>';
      });
    }

    // 练习
    if (l.exercises && l.exercises.length) {
      h += '<div class="section-title">练习<span class="sub">先自己答，再点开对答案</span></div>';
      l.exercises.forEach(function (e2, i) {
        h += '<div class="ex-q" data-ex><div class="q">' + esc(e2.q) + '</div>' +
          '<span class="toggle">查看答案 ▾</span><div class="a">' + esc(e2.a) + '</div></div>';
      });
    }

    // 随机小闯关
    if (key === 'chinese' && l.words && l.words.write && l.words.write.length)
      h += '<button class="btn ghost" style="width:100%;margin-top:8px" id="rnd-zi">🎲 随机抽生字认一认</button>';
    if (key === 'math')
      h += '<button class="btn ghost" style="width:100%;margin-top:8px" id="rnd-math">🎯 随机练一题（答对 +2 奖章）</button>';
    if (key === 'english' && l.words && l.words.list && l.words.list.length)
      h += '<button class="btn ghost" style="width:100%;margin-top:8px" id="rnd-word">🎲 随机考单词</button>';

    // 完成按钮
    var allDone = l.preview && l.preview.every(function (t, i) { return st.tasks['p' + i]; });
    h += '<button class="btn" style="width:100%;margin-top:6px" id="finish-lesson" data-lesson="' + l.id + '"' +
      (st.finished ? ' disabled style="opacity:.5;width:100%;margin-top:6px"' : '') + '>' +
      (st.finished ? '本课已完成 🏅' : (allDone ? '完成本课 · +20 奖章' : '先完成上面的预习任务')) + '</button>';
    if (!l.preview || !l.preview.length) {
      // 无预习任务的课直接可完成 — 目前所有正式课都有预习任务，保底逻辑
    }
    return h;
  }

  /* ---------- 课表 ---------- */
  var DOW_NAME = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  function renderSchedule() {
    var dow = todayDow();
    var h = '<div class="section-title">我的课表<span class="sub">点格子可改</span></div>';
    h += '<div class="card"><div class="sched-table"><div class="hd"></div>';
    for (var d = 1; d <= 5; d++) h += '<div class="hd"' + (d === dow ? ' style="text-shadow:0 0 8px var(--gold)"' : '') + '>' + DOW_NAME[d] + '</div>';
    for (var p = 0; p < 6; p++) {
      h += '<div class="period">第' + (p + 1) + '节</div>';
      for (var dd = 1; dd <= 5; dd++) {
        var name = (S.schedule.grid[dd] && S.schedule.grid[dd][p]) || '';
        h += '<div class="sched-cell' + (dd === dow ? ' today-col' : '') + '" data-edit-cell="' + dd + ',' + p + '">' + esc(name) + '</div>';
      }
    }
    h += '</div><div class="sched-hint">开学拿到五年级新课表后，点格子直接改。高亮列是今天。</div></div>';

    // 课外班
    h += '<div class="section-title">课外班<span class="sub">钢琴/吉他/别的班都记这</span></div>';
    if (S.schedule.extra.length) {
      S.schedule.extra.forEach(function (x, i) {
        h += '<div class="extra-item"><b>' + esc(x.name) + '</b><span class="time">' + DOW_NAME[x.dow] + ' ' + esc(x.start) + '-' + esc(x.end) + '</span>' +
          '<button class="del" data-del-extra="' + i + '">✕</button></div>';
      });
    } else {
      h += '<div class="card"><div class="empty-tip">还没加课外班，点下面按钮加一个</div></div>';
    }
    h += '<button class="btn" style="width:100%" id="add-extra">+ 添加课外班</button>';
    return h;
  }

  /* ---------- 打卡 ---------- */
  function weekLog(itemId) { // 本周一到今天
    var res = [];
    var dow = todayDow();
    for (var i = 1; i <= 7; i++) {
      var offset = i - dow;
      var log = S.checkins.log[dkey(offset)] || {};
      res.push(!!log[itemId]);
    }
    return res;
  }
  function streakOf(itemId) {
    var n = 0;
    for (var o = 0; o > -60; o--) {
      var log = S.checkins.log[dkey(o)] || {};
      if (log[itemId]) n++; else if (o < 0) break; else break;
    }
    return n;
  }
  function renderCheckin() {
    var t = dkey();
    var log = S.checkins.log[t] || {};
    var h = '<div class="section-title">每日打卡<span class="sub">打卡一次 +' + (S.checkins.items[0] ? S.checkins.items[0].points : 10) + ' 奖章</span></div>';
    h += '<div class="checkin-grid">';
    S.checkins.items.forEach(function (it) {
      var done = !!log[it.id];
      var week = weekLog(it.id);
      h += '<div class="checkin-card' + (done ? ' done-today' : '') + '">' +
        '<div class="ic">' + it.icon + '</div><b>' + esc(it.name) + '</b>' +
        '<div class="streak">连续 ' + streakOf(it.id) + ' 天</div>' +
        '<div class="week">' + week.map(function (on) { return '<i class="' + (on ? 'on' : '') + '"></i>'; }).join('') + '</div>' +
        '<button class="big-btn" data-checkin="' + it.id + '"' + (done ? ' disabled' : '') + '>' + (done ? '今日已打卡 ✓' : '打卡 +' + it.points) + '</button></div>';
    });
    h += '</div>';
    h += '<button class="btn ghost" style="width:100%;margin-top:10px" id="add-checkin">+ 添加打卡项目</button>';
    if (S.checkins.items.length > 5) {
      h += '<div class="hint">想删自定义项目：长按它的卡片。</div>';
    }
    return h;
  }

  /* ---------- 萌宠房间 ---------- */
  function renderPet() {
    var p = S.pet;
    var h = '<div class="pet-name-row"><b>' + esc(p.name) + '</b>' +
      '<span class="lv">Lv.' + petLevel() + ' ' + petLevelName() + '</span>' +
      '<button class="rename" id="rename-pet">改名</button></div>';
    h += '<div class="pet-stage"><div class="bubble" id="pet-bubble" style="display:none"></div><canvas id="pet-canvas" data-scale="7"></canvas></div>';

    h += '<div class="stat-bars">' +
      statBar('饱腹', p.hunger, 'hunger') +
      statBar('口渴', p.thirst, 'thirst') +
      statBar('心情', p.mood, 'mood') +
      statBar('精力', p.energy, 'energy') + '</div>';

    var acts = [
      { id: 'feed', ic: '🍚', name: '喂饭', cost: 5 },
      { id: 'drink', ic: '🥤', name: '喂水', cost: 3 },
      { id: 'snack', ic: '🍬', name: '零食', cost: 10 },
      { id: 'tickle', ic: '🤏', name: '挠痒痒', cost: 5 },
      { id: 'roll', ic: '🔄', name: '翻身', cost: 5 },
      { id: 'sleep', ic: '😴', name: p.sleeping ? '叫醒' : '哄睡觉', cost: p.sleeping ? 0 : 8 },
      { id: 'play', ic: '🎮', name: '陪玩', cost: 0 },
      { id: 'skin', ic: '🎨', name: '换皮肤', cost: 0 }
    ];
    h += '<div class="section-title">互动<span class="sub">花奖章，长羁绊</span></div><div class="act-grid">';
    acts.forEach(function (a) {
      var dis = (a.cost > 0 && S.points < a.cost) ? ' disabled' : '';
      h += '<button class="act-btn" data-act="' + a.id + '"' + dis + '><span class="ic">' + a.ic + '</span><b>' + a.name + '</b>' +
        '<span class="cost">' + (a.cost ? '-' + a.cost + '奖章' : '免费') + '</span></button>';
    });
    h += '</div>';

    // 皮肤图鉴
    h += '<div class="section-title">皮肤图鉴<span class="sub">点皮肤穿上/解锁</span></div><div class="skin-grid">';
    Object.keys(window.MonokumaPet.SKINS).forEach(function (id) {
      var sk = window.MonokumaPet.SKINS[id];
      var owned = ownsSkin(id);
      var avail = skinAvailable(id);
      h += '<div class="skin-cell' + (owned ? ' owned' : '') + (p.skin === id ? ' active' : '') + '" data-skin="' + id + '">' +
        '<canvas data-scale="3" data-skin-canvas="' + id + '"></canvas>' +
        '<div>' + sk.name + '</div>' +
        (owned ? '<div style="color:var(--green)">已拥有</div>'
          : avail ? '<div class="cost">' + sk.cost + '奖章解锁</div>'
            : '<div class="cost">🔒' + sk.unlock + '</div>') + '</div>';
    });
    h += '</div>';
    h += '<div class="hint">状态会随时间下降，太低黑白熊会生气耍脾气。哄睡时精力会回升。</div>';
    return h;
  }
  function statBar(name, val, cls) {
    return '<div class="stat-bar"><div class="lb"><span>' + name + '</span><span>' + Math.round(val) + '/100</span></div>' +
      '<div class="bar ' + cls + '"><i style="width:' + Math.round(val) + '%"></i></div></div>';
  }

  /* ---------- 生字/单词卡片弹窗 ---------- */
  function ziCard(c) {
    var e = window.KBG_DICT && window.KBG_DICT.han && window.KBG_DICT.han[c];
    sfx('pop');
    var body;
    if (!e) body = '<div class="hint">这个字的卡片还没做好，先问爸爸妈妈吧。</div>';
    else body =
      '<div style="font-size:54px;font-weight:800;text-align:center;line-height:1.15;margin:4px 0">' + c + '</div>' +
      '<div style="text-align:center;color:var(--dim);font-size:16px;margin-bottom:8px">' + esc(e.p) + '</div>' +
      '<div class="card"><b>释义</b><div style="font-size:14px;margin-top:3px">' + esc(e.d) + '</div></div>' +
      '<div class="card"><b>组词</b><div style="font-size:14px;margin-top:3px">' + e.z.map(esc).join(' · ') + '</div></div>' +
      '<div class="card"><b>例句</b><div style="font-size:14px;margin-top:3px">' + esc(e.l) + '</div></div>';
    modal('生字卡片', body, null, '知道了');
  }
  function enCard(w) {
    var e = window.KBG_DICT && window.KBG_DICT.en && window.KBG_DICT.en[String(w).toLowerCase()];
    sfx('pop');
    var body;
    if (!e) body = '<div class="hint">这个词的卡片还没做好。</div>';
    else body =
      '<div style="font-size:32px;font-weight:800;text-align:center;line-height:1.2;margin:4px 0">' + esc(w) + '</div>' +
      '<div style="text-align:center;color:var(--dim);font-size:15px;margin-bottom:6px">' + esc(e.ip) + '　' + esc(e.cn) + '</div>' +
      '<div class="card"><b>常用词组</b><div style="font-size:14px;margin-top:3px">' + esc(e.ph) + '</div></div>' +
      '<div class="card"><b>例句</b><div style="font-size:14px;margin-top:3px">' + esc(e.ex) + '</div></div>' +
      '<button class="btn" style="width:100%;margin-top:8px" id="wd-say">🔊 再读一遍</button>';
    var mask = modal('单词卡片', body, null, '关闭');
    speakEn(w);
    var b = $('#wd-say', mask);
    if (b) b.onclick = function () { speakEn(w); };
  }

  /* ---------- 数学随机出题器 ---------- */
  function rnd(n, m) { return n + Math.floor(Math.random() * (m - n + 1)); }
  function mathGen(lid) {
    var t = rnd(2, 9), b1, b2, h, v, u;
    if (lid.indexOf('sx1') === 0) { v = rnd(2, 30); var down = Math.random() < .5; return { q: (down ? '零下' : '零上') + v + '℃ 记作（　）℃（零下要加负号）', a: down ? -v : v }; }
    if (lid.indexOf('sx2-1') === 0) { b1 = rnd(2, 20); h = rnd(2, 15); return { q: '平行四边形底 ' + b1 + ' 米、高 ' + h + ' 米，面积是多少平方米？', a: b1 * h }; }
    if (lid.indexOf('sx2-2') === 0) { b1 = rnd(2, 20); h = rnd(2, 15); return { q: '三角形底 ' + b1 * 2 + ' 厘米、高 ' + h + ' 厘米，面积是多少平方厘米？', a: b1 * h }; }
    if (lid.indexOf('sx2-3') === 0) { b1 = rnd(1, 9); b2 = rnd(10, 20); h = rnd(1, 9) * 2; return { q: '梯形上底 ' + b1 + ' 米、下底 ' + b2 + ' 米、高 ' + h + ' 米，面积是多少平方米？', a: (b1 + b2) * h / 2 }; }
    if (lid.indexOf('sx2-4') === 0) { u = [['公顷', '平方米', 10000], ['平方千米', '公顷', 100], ['平方千米', '平方米', 1000000]][rnd(0, 2)]; v = rnd(2, 50); return { q: v + ' ' + u[0] + ' = （　）' + u[1], a: v * u[2] }; }
    if (lid.indexOf('sx2') === 0) { b1 = rnd(2, 15); h = rnd(2, 12); return { q: '在长 ' + b1 + ' 米、宽 ' + h + ' 米的长方形里剪一个最大的平行四边形，面积是多少平方米？', a: b1 * h }; }
    if (lid.indexOf('sx3') === 0) { v = rnd(1050, 99950); return { q: '把 ' + v + ' 改写成用"万"作单位的数是（　）。（如 3.45 表示 3.45 万）', a: v / 10000 }; }
    if (lid.indexOf('sx4') === 0) { b1 = rnd(11, 99) / 10; b2 = rnd(11, 99) / 10; return Math.random() < .5 ? { q: b1.toFixed(1) + ' + ' + b2.toFixed(1) + ' = （　）', a: b1 + b2 } : { q: (b1 + b2).toFixed(1) + ' − ' + b1.toFixed(1) + ' = （　）', a: b2 }; }
    if (lid.indexOf('sx5-1') === 0) { v = rnd(11, 99) / 100; var m = [10, 100, 1000][rnd(0, 2)]; return { q: v.toFixed(2) + ' × ' + m + ' = （　）', a: v * m }; }
    if (lid.indexOf('sx5-2') === 0 || lid.indexOf('sx5-4') === 0) { v = rnd(11, 9999) / 100; var m2 = [10, 100, 1000][rnd(0, 2)]; return Math.random() < .5 ? { q: v.toFixed(2) + ' × ' + m2 + ' = （　）', a: v * m2 } : { q: (v * m2).toFixed(2) + ' ÷ ' + m2 + ' = （　）', a: v }; }
    if (lid.indexOf('sx5-3') === 0) { b1 = rnd(2, 99); t = rnd(2, 9); return { q: b1 + ' ÷ ' + t + ' = （　）（除不尽时商是循环小数，写保留两位的结果）', a: Math.round(b1 / t * 100) / 100 }; }
    if (lid.indexOf('sx5-5') === 0) { b1 = rnd(11, 99) / 10; b2 = rnd(11, 99) / 10; return { q: b1.toFixed(1) + ' × ' + b2.toFixed(1) + ' = （　）', a: b1 * b2 }; }
    if (lid.indexOf('sx5-6') === 0) { v = rnd(11, 99) / 10; t = rnd(2, 9); return { q: v.toFixed(1) + ' ÷ ' + t + ' = （　）', a: Math.round(v / t * 100) / 100 }; }
    if (lid.indexOf('sx5') === 0) { b1 = rnd(11, 99) / 10; t = rnd(2, 9); return { q: v0(b1) + ' × ' + t + ' = （　）', a: b1 * t }; }
    if (lid.indexOf('sx7') === 0) { var d1 = rnd(1, 9), d2 = rnd(1, 9); if (d2 === d1) d2 = (d1 + 1) % 10; var d3 = (d1 + 3) % 10; if (d3 === d1 || d3 === d2) d3 = (d1 + 5) % 10; return { q: '用 ' + d1 + '、' + d2 + '、' + d3 + ' 三个数字组成没有重复数字的两位数，一共能组成（　）个', a: 6 }; }
    if (lid.indexOf('sx8') === 0) { b1 = rnd(2, 12); return Math.random() < .5 ? { q: '正方形边长 a = ' + b1 + ' 米，周长 C =（　）米', a: 4 * b1 } : { q: '正方形边长 a = ' + b1 + ' 米，面积 S =（　）平方米', a: b1 * b1 }; }
    b1 = rnd(2, 12); t = rnd(2, 12); var extra = rnd(1, 20);
    return { q: b1 + ' × ' + t + ' + ' + extra + ' = （　）', a: b1 * t + extra };
    function v0(x) { return x.toFixed(1); }
  }

  /* ---------- 本地课本查看页 ---------- */
  function findLessonAny(lid) {
    for (var k in D.CURRICULUM) {
      var f = findLesson(k, lid);
      if (f) { f.subjectKey = k; return f; }
    }
    return null;
  }
  function renderBookView(lid) {
    var f = findLessonAny(lid);
    var title = f ? f.lesson.title : '本地课本';
    return '<div class="back-row"><button data-go="#/lesson/' + (f ? f.subjectKey : '') + '/' + lid + '">‹ 返回课文</button></div>' +
      '<div class="lesson-hero"><div class="crumb">本地课本 · 不上网也能看</div><h2>📚 ' + esc(title) + '</h2></div>' +
      '<div id="book-pages"><div class="card"><div class="hint">读取中…</div></div></div>' +
      '<button class="btn" style="width:100%;margin-top:8px" id="photo-import">📷 再补拍几页</button>' +
      '<button class="btn ghost" style="width:100%;margin-top:8px" id="photo-clear">🗑 清空这课的本地照片</button>' +
      '<input type="file" id="photo-file" accept="image/*" multiple style="display:none">';
  }

  /* ---------- 设置 ---------- */
  function renderSettings() {
    return '<div class="section-title">设置</div>' +
      '<div class="card">' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="update-btn">🔄 检查更新</button>' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="theme-btn">' + (S.theme === 'dark' ? '🌙 主题：深夜黑（点换纸张白）' : '🌞 主题：纸张白（点换深夜黑）') + '</button>' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="book-import-btn">📥 从电脑导入整本课本（离线看）</button>' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="sound-btn">' + (S.sound === false ? '🔇 音效：关（点我开启）' : '🔊 音效：开（点我关闭）') + '</button>' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="export-btn">导出备份（JSON）</button>' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="import-btn">导入备份</button>' +
      '<input type="file" id="import-file" accept=".json" style="display:none">' +
      '<button class="btn ghost" style="width:100%;color:var(--pink)" id="reset-btn">清空重来</button>' +
      '<div class="hint">数据只存在这台设备的浏览器里。换手机/清浏览器前，先导出备份发给家长微信存好。</div></div>' +
      '<div class="card"><div class="hint">希望之峰 v1.5 · 给源远 · 黑白熊形象出自《弹丸论破》<br>教材：部编语文 / 苏教数学 / 译林英语 五年级上册</div></div>';
  }

  /* ================= 萌宠互动逻辑 ================= */
  var petPlayer = null;
  function petAct(id, ev) {
    var p = S.pet;
    function after(anim, q, ms) {
      if (petPlayer) petPlayer.play(anim);
      say(q);
      setTimeout(function () {
        if (petPlayer && !S.pet.sleeping) petPlayer.play(petGrumpy() ? 'angry' : 'idle');
      }, ms || 2400);
    }
    switch (id) {
      case 'feed':
        if (!spend(5)) return;
        p.hunger = Math.min(100, p.hunger + 25); p.mood = Math.min(100, p.mood + 3);
        addXp(5); S.counters.feeds++; S._feedDay = dkey();
        sfx('feed'); after('eat', quote('feed')); break;
      case 'drink':
        if (!spend(3)) return;
        p.thirst = Math.min(100, p.thirst + 25);
        addXp(3); S.counters.feeds++; S._feedDay = dkey();
        sfx('drink'); after('eat', quote('drink')); break;
      case 'snack':
        if (!spend(10)) return;
        p.hunger = Math.min(100, p.hunger + 10); p.mood = Math.min(100, p.mood + 10);
        addXp(6);
        sfx('snack'); after('happy', quote('snack')); break;
      case 'tickle':
        if (!spend(5)) return;
        p.mood = Math.min(100, p.mood + 20);
        addXp(5);
        sfx('tickle'); after('giggle', quote('tickle')); break;
      case 'roll':
        if (!spend(5)) return;
        p.mood = Math.min(100, p.mood + 8);
        addXp(4);
        sfx('roll'); after('back', quote('roll')); break;
      case 'sleep':
        if (p.sleeping) {
          p.sleeping = false;
          sfx('wake'); after('idle', quote('wake'), 800);
        } else {
          if (!spend(8)) return;
          p.sleeping = true;
          addXp(4);
          sfx('sleep'); after('sleep', quote('sleep'), 60000);
        }
        break;
      case 'play':
        p.mood = Math.min(100, p.mood + 6);
        addXp(2);
        sfx('bear'); after('happy', quote('tap'), 1800);
        break;
      case 'skin':
        document.querySelector('.skin-grid').scrollIntoView({ behavior: 'smooth' });
        return;
    }
    save();
    render();
  }

  function trySkin(id, ev) {
    var sk = window.MonokumaPet.SKINS[id];
    if (ownsSkin(id)) {
      S.pet.skin = id; save(); render();
      toast('换上「' + sk.name + '」！');
      return;
    }
    if (!skinAvailable(id)) { toast('还没解锁：' + sk.unlock); return; }
    if (S.points < sk.cost) { toast('奖章不够，需要 ' + sk.cost + ' 枚'); return; }
    spend(sk.cost);
    S.pet.owned.push(id);
    S.pet.skin = id;
    grantBadge('first_skin');
    save(); render();
    toast('解锁皮肤「' + sk.name + '」！');
  }

  /* ================= 全局溜达熊 ================= */
  var roamerPlayer = null, roamerBusy = false;
  function initRoamer() {
    var el = $('#roamer');
    var cv = $('#roamer-canvas');
    roamerPlayer = window.MonokumaPet.createPlayer(cv, function () { return S.pet.skin; });
    roamerPlayer.play('idle');
    setInterval(roamerThink, 5000);
    el.addEventListener('click', function (e) {
      var p = S.pet;
      p.mood = Math.min(100, p.mood + 2);
      sfx('bear');
      addXp(1); save();
      roamerPlayer.play(petGrumpy() ? 'angry' : 'giggle');
      toast(petGrumpy() ? quote('angry') : quote('tap'));
      setTimeout(function () { if (roamerPlayer) roamerPlayer.play('idle'); }, 1600);
    });
  }
  function roamerThink() {
    if (roamerBusy || !roamerPlayer) return;
    var el = $('#roamer');
    if (!el || document.hidden) return;
    var p = S.pet;
    if (p.sleeping) { roamerPlayer.play('sleep'); return; }
    if (petGrumpy() && Math.random() < 0.5) { roamerPlayer.play('angry'); setTimeout(function(){roamerPlayer&&roamerPlayer.play('idle');}, 2000); return; }
    var roll = Math.random();
    if (roll < 0.45) { // 溜达
      roamerBusy = true;
      var cur = parseInt(el.style.right || '10', 10);
      var max = Math.max(60, Math.min(innerWidth - 90, 320));
      var target = Math.max(6, Math.min(max, cur + (Math.random() < 0.5 ? -1 : 1) * (50 + Math.random() * 120)));
      el.style.transition = 'right 1.4s linear';
      el.style.right = target + 'px';
      roamerPlayer.play('walk');
      setTimeout(function () {
        if (roamerPlayer) roamerPlayer.play('idle');
        roamerBusy = false;
      }, 1450);
    } else if (roll < 0.6) {
      roamerPlayer.play('sit');
      setTimeout(function () { if (roamerPlayer) roamerPlayer.play('idle'); }, 3000);
    } else if (roll < 0.75) {
      roamerPlayer.play('blink');
      setTimeout(function () { if (roamerPlayer) roamerPlayer.play('idle'); }, 700);
    }
  }

  /* ================= 路由 ================= */
  var TABS = [
    { hash: '#/home', icon: '🏠', name: '首页' },
    { hash: '#/study', icon: '📚', name: '学习' },
    { hash: '#/schedule', icon: '📅', name: '课表' },
    { hash: '#/checkin', icon: '⭐', name: '打卡' },
    { hash: '#/pet', icon: '🐻', name: '黑白熊' },
    { hash: '#/settings', icon: '⚙️', name: '设置' }
  ];
  function renderTabbar(route) {
    var bar = $('#tabbar');
    bar.innerHTML = TABS.map(function (t) {
      var on = route.indexOf(t.hash) === 0 || (t.hash === '#/study' && (route.indexOf('#/lesson') === 0 || route.indexOf('#/subject') === 0 || route.indexOf('#/bookview') === 0));
      return '<a href="' + t.hash + '" class="' + (on ? 'on' : '') + '"><span class="ti">' + t.icon + '</span>' + t.name + '</a>';
    }).join('');
  }

  function render() {
    var route = location.hash || '#/home';
    renderTabbar(route);
    var html;
    if (route.indexOf('#/lesson/') === 0) {
      var parts = route.split('/');
      html = renderLesson(parts[2], parts[3]);
    } else if (route.indexOf('#/bookview/') === 0) {
      html = renderBookView(route.split('/')[2]);
    } else if (route.indexOf('#/subject/') === 0) {
      html = renderSubject(route.split('/')[2]);
    } else if (route === '#/study') html = renderStudy();
    else if (route === '#/schedule') html = renderSchedule();
    else if (route === '#/checkin') html = renderCheckin();
    else if (route === '#/pet') html = renderPet();
    else if (route === '#/settings') html = renderSettings();
    else html = renderHome();

    view.innerHTML = html;
    bindViewEvents(route);
    window.scrollTo(0, 0);
  }

  function bindViewEvents(route) {
    // 跳转
    $$('[data-go]', view).forEach(function (el) {
      el.addEventListener('click', function () {
        if (el.getAttribute('data-skel') === '1') { toast('这篇正在填充，敬请期待！'); return; }
        var go = el.getAttribute('data-go');
        if (go) location.hash = go;
      });
    });
    // 课行里的📖按钮：直接开书，不进入课文页
    $$('.book-btn', view).forEach(function (el) {
      el.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    // 英语点读：点单词=读+弹卡片
    $$('.speak', view).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        enCard(el.getAttribute('data-say'));
      });
    });
    // 语文生字卡片
    $$('.zi-chip', view).forEach(function (el) {
      el.addEventListener('click', function () { ziCard(el.getAttribute('data-zi')); });
    });
    // 随机抽生字
    var rz = $('#rnd-zi', view);
    if (rz) rz.addEventListener('click', function () {
      var f = findLessonAny(pageLid());
      var ws = f && f.lesson.words && f.lesson.words.write;
      if (!ws || !ws.length) return;
      ziCard(ws[Math.floor(Math.random() * ws.length)]);
    });
    // 数学随机练一题
    var rm = $('#rnd-math', view);
    if (rm) rm.addEventListener('click', function () {
      var g = mathGen(pageLid());
      sfx('pop');
      modal('🎯 随机练一题', '<div class="card" style="font-size:16px;margin-bottom:10px">' + esc(g.q) + '</div>' +
        '<input id="quiz-in" inputmode="decimal" placeholder="在这里写答案" style="width:100%;padding:10px;font-size:18px;border-radius:10px;border:1px solid #555;background:var(--surface3);color:var(--text)">' +
        '<div id="quiz-fb" style="color:var(--pink);font-size:13px;margin-top:6px;min-height:18px"></div>',
        function (mk) {
          var v = parseFloat($('#quiz-in', mk).value);
          if (isNaN(v)) { $('#quiz-fb', mk).textContent = '先写个数字再交卷哦'; return false; }
          if (Math.abs(v - g.a) < 0.005) { sfx('good'); earn(2, '答对随机题'); }
          else {
            sfx('wrong');
            $('#quiz-fb', mk).textContent = g.tried ? ('答案：' + g.a) : '再想想～';
            g.tried = true;
            return false;
          }
        });
      setTimeout(function () { var i2 = $('#quiz-in'); if (i2) i2.focus(); }, 80);
    });
    // 英语随机考单词
    var rwd = $('#rnd-word', view);
    if (rwd) rwd.addEventListener('click', function () {
      var f = findLessonAny(pageLid());
      var ws = f && f.lesson.words && f.lesson.words.list;
      if (!ws || !ws.length) return;
      var w = ws[Math.floor(Math.random() * ws.length)];
      var e = window.KBG_DICT && window.KBG_DICT.en && window.KBG_DICT.en[w.toLowerCase()];
      var mask = modal('🎲 考单词', '<div style="text-align:center;font-size:30px;font-weight:800;margin:6px 0">' + esc(w) + '</div>' +
        '<button class="btn" style="width:100%;margin:6px 0" id="qz-say">🔊 读一读</button>' +
        '<div id="qz-ans" style="text-align:center;font-size:15px;color:var(--dim);line-height:1.7">心里想好中文意思，再点"揭晓"</div>',
        function (mk) {
          var a = $('#qz-ans', mk);
          if (!a.dataset.show) {
            a.dataset.show = 1;
            a.innerHTML = '<b style="color:#fff">' + esc(w) + '</b><br>' + (e ? esc(e.ip) + '　' + esc(e.cn) + '<br>' + esc(e.ph) + '<br>' + esc(e.ex) : '这个词的卡片还没做好');
            return false;
          }
        }, '揭晓');
      speakEn(w);
      var qs = $('#qz-say', mask);
      if (qs) qs.onclick = function () { speakEn(w); };
    });
    var sa = $('#speak-all', view);
    if (sa) sa.addEventListener('click', function () {
      speakSeq($$('.speak', view).map(function (x) { return x.getAttribute('data-say'); }));
    });
    // 本地课本照片（拍照导入，只存本机）
    function pageLid() {
      var r = location.hash;
      if (r.indexOf('#/bookview/') === 0) return r.split('/')[2];
      if (r.indexOf('#/lesson/') === 0) return r.split('/')[3];
      return null;
    }
    function paintBookPages(rec) {
      var box = $('#book-pages', view);
      if (!box) return;
      if (!rec || !rec.imgs || !rec.imgs.length) {
        box.innerHTML = '<div class="card"><div class="hint">这课还没有本地照片。点下面的📷按钮，对着课本拍几页就行。</div></div>';
        return;
      }
      box.innerHTML = rec.imgs.map(function (d) {
        return '<img src="' + d + '" style="width:100%;display:block;margin:0 0 12px;border-radius:10px;background:#fff">';
      }).join('');
    }
    var lid0 = pageLid();
    // 整本书离线页：课文页内嵌课本图+翻页
    var emb = $('#book-embed', view);
    if (emb && lid0 && route.indexOf('#/lesson/') === 0) {
      var anch = {};
      try { anch = JSON.parse(localStorage.getItem('kbpg-anchors') || '{}'); } catch (e) { }
      var abk = lid0.slice(0, 2);
      var pg0 = anch[lid0];
      var bookTotal = { yw: 133, sx: 124, yy: 106 }[abk] || 999;
      if (pg0) {
        (function drawEmbed(p) {
          if (p < 1 || p > bookTotal) { toast('到头啦'); return; }
          emb.dataset.pg = p;
          bookGet(abk + ':' + String(p).padStart(3, '0'), function (rec) {
            if (!(rec && rec.imgs && rec.imgs[0])) { emb.innerHTML = ''; return; }
            emb.innerHTML = '<div class="section-title">课本原文<span class="sub">第' + p + '页 · 已离线</span></div>' +
              '<img src="' + rec.imgs[0] + '" style="width:100%;display:block;border-radius:10px;background:#fff" alt="课本第' + p + '页">' +
              '<div style="display:flex;gap:8px;margin-top:8px">' +
              '<button class="btn ghost" style="flex:1" id="pg-prev">◀ 上一页</button>' +
              '<button class="btn ghost" style="flex:1" id="pg-next">下一页 ▶</button></div>';
            var pv = $('#pg-prev', emb), nx = $('#pg-next', emb);
            if (pv) pv.onclick = function () { sfx('tap'); drawEmbed(p - 1); };
            if (nx) nx.onclick = function () { sfx('tap'); drawEmbed(p + 1); };
          });
        })(pg0);
      }
    }
    var pv = $('#photo-view', view);
    if (lid0 && pv) bookGet(lid0, function (rec) {
      if (rec && rec.imgs && rec.imgs.length) { pv.style.display = 'block'; pv.textContent = '📚 本地课本 · ' + rec.imgs.length + '页'; }
    });
    if (lid0 && view.querySelector('#book-pages')) bookGet(lid0, paintBookPages);
    if (pv) pv.addEventListener('click', function () { location.hash = '#/bookview/' + pageLid(); });
    var pi = $('#photo-import', view);
    if (pi) pi.addEventListener('click', function () { $('#photo-file', view).click(); });
    var pfl = $('#photo-file', view);
    if (pfl) pfl.addEventListener('change', function () {
      var files = Array.prototype.slice.call(pfl.files || []);
      if (!files.length) return;
      var lid = pageLid(); if (!lid) return;
      var total = files.length, done = 0;
      bookGet(lid, function (rec) {
        rec = rec || { lid: lid, imgs: [], at: Date.now() };
        files.forEach(function (f) {
          compressImg(f, function (data) {
            rec.imgs.push(data);
            if (++done === total) bookPut(rec, function () {
              sfx('check');
              toast('已存 ' + total + ' 页到本机（不上网）');
              pfl.value = '';
              if (view.querySelector('#book-pages')) paintBookPages(rec);
              var pv2 = $('#photo-view', view);
              if (pv2) { pv2.style.display = 'block'; pv2.textContent = '📚 本地课本 · ' + rec.imgs.length + '页'; }
            });
          });
        });
      });
    });
    var pcl = $('#photo-clear', view);
    if (pcl) pcl.addEventListener('click', function () {
      var lid = pageLid();
      modal('清空本地照片', '<div style="font-size:14px;margin-bottom:8px">只删这一课存在本机的课本照片，确定？</div>', function () {
        bookDel(lid, function () { toast('已清空'); render(); });
      });
    });
    // 学科列表：给有本地照片的课打📚标
    if (route.indexOf('#/subject/') === 0) bookAllKeys(function (keys) {
      if (!keys || !keys.length) return;
      $$('.lesson-row', view).forEach(function (row) {
        var go = row.getAttribute('data-go') || '';
        var m = go.match(/#\/lesson\/\w+\/(\S+)/);
        if (m && keys.indexOf(m[1]) > -1) {
          var sp = document.createElement('span');
          sp.textContent = '📚';
          sp.title = '这课有本地课本照片';
          row.appendChild(sp);
        }
      });
    });
    // 单元折叠
    $$('[data-unit] .unit-head', view).forEach(function (el) {
      el.addEventListener('click', function () { el.parentElement.classList.toggle('open'); });
    });
    // 预习任务勾选
    $$('[data-task]', view).forEach(function (el) {
      el.addEventListener('click', function (e) {
        var lid = el.getAttribute('data-lesson');
        var tid = el.getAttribute('data-task');
        var st = S.study[lid] || (S.study[lid] = { tasks: {}, finished: false });
        if (st.tasks[tid]) return;
        st.tasks[tid] = true;
        sfx('check');
        earn(5, '预习任务', e);
        render();
      });
    });
    // 练习展开
    $$('[data-ex]', view).forEach(function (el) {
      el.addEventListener('click', function () { el.classList.toggle('open'); });
    });
    // 完成本课
    var fl = $('#finish-lesson', view);
    if (fl) fl.addEventListener('click', function (e) {
      var lid = fl.getAttribute('data-lesson');
      var st = S.study[lid] || (S.study[lid] = { tasks: {}, finished: false });
      // 校验预习全完成
      var keys = $$('[data-task]', view).map(function (x) { return x.getAttribute('data-task'); });
      var all = keys.every(function (k) { return st.tasks[k]; });
      if (!all) { toast('先把预习任务都勾掉哦'); return; }
      if (st.finished) return;
      st.finished = true;
      st.finishedAt = new Date().toISOString();
      S.counters.lessonsDone++;
      if (S.counters.lessonsDone === 1) grantBadge('first_lesson');
      earn(20, '完成一课', e);
      setTimeout(function () { sfx('done'); toast('🐻 ' + quote('studyDone')); }, 350);
      render();
    });
    // 课表编辑
    $$('[data-edit-cell]', view).forEach(function (el) {
      el.addEventListener('click', function () {
        var parts = el.getAttribute('data-edit-cell').split(',');
        var d = +parts[0], p = +parts[1];
        modal('修改 ' + DOW_NAME[d] + ' 第' + (p + 1) + '节',
          '<input id="cell-input" value="' + esc(S.schedule.grid[d][p] || '') + '" placeholder="留空=没课">',
          function (mask) {
            S.schedule.grid[d][p] = $('#cell-input', mask).value.trim();
            save(); render();
          });
        setTimeout(function () { var i = $('#cell-input'); if (i) i.focus(); }, 50);
      });
    });
    // 课外班
    var ae = $('#add-extra', view);
    if (ae) ae.addEventListener('click', function () {
      modal('添加课外班',
        '<input id="ex-name" placeholder="名称，如：钢琴课">' +
        '<select id="ex-dow">' + [1, 2, 3, 4, 5, 6, 7].map(function (d) { return '<option value="' + d + '">' + DOW_NAME[d] + '</option>'; }).join('') + '</select>' +
        '<input id="ex-start" placeholder="开始时间，如 16:30">' +
        '<input id="ex-end" placeholder="结束时间，如 17:30">',
        function (mask) {
          var name = $('#ex-name', mask).value.trim();
          if (!name) { toast('名称不能为空'); return false; }
          S.schedule.extra.push({
            name: name,
            dow: +$('#ex-dow', mask).value,
            start: $('#ex-start', mask).value.trim() || '待定',
            end: $('#ex-end', mask).value.trim() || ''
          });
          save(); render();
        });
    });
    $$('[data-del-extra]', view).forEach(function (el) {
      el.addEventListener('click', function () {
        S.schedule.extra.splice(+el.getAttribute('data-del-extra'), 1);
        save(); render();
      });
    });
    // 打卡
    $$('[data-checkin]', view).forEach(function (el) {
      el.addEventListener('click', function (e) {
        var id = el.getAttribute('data-checkin');
        var t = dkey();
        if (!S.checkins.log[t]) S.checkins.log[t] = {};
        if (S.checkins.log[t][id]) return;
        S.checkins.log[t][id] = true;
        var item = S.checkins.items.filter(function (x) { return x.id === id; })[0];
        if (id === 'guitar') { S.counters.guitarDays++; checkBadges(); }
        earn(item.points, item.name, e);
      setTimeout(function () { toast('🐻 ' + quote('checkin')); }, 300);
        render();
      });
    });
    var ac = $('#add-checkin', view);
    if (ac) ac.addEventListener('click', function () {
      modal('添加打卡项目',
        '<input id="ci-name" placeholder="名称，如：练字 / 跳绳">' +
        '<select id="ci-icon">' + ['🎹', '🎸', '📖', '🧹', '🏃', '🏀', '🎤', '🎨', '✍️', '🧮', '🏊', '🚴'].map(function (i) { return '<option>' + i + '</option>'; }).join('') + '</select>',
        function (mask) {
          var name = $('#ci-name', mask).value.trim();
          if (!name) { toast('名称不能为空'); return false; }
          S.checkins.items.push({ id: 'c' + Date.now(), name: name, icon: $('#ci-icon', mask).value, points: 10 });
          save(); render();
        });
    });
    // 长按删自定义打卡
    $$('.checkin-card', view).forEach(function (el, idx) {
      var timer;
      el.addEventListener('touchstart', function () {
        timer = setTimeout(function () {
          var item = S.checkins.items[idx];
          if (['piano', 'guitar', 'reading', 'chores', 'sports'].indexOf(item.id) >= 0) { toast('默认项目不能删'); return; }
          modal('删除打卡项目', '<div style="font-size:14px;margin-bottom:8px">确定删掉「' + esc(item.name) + '」吗？</div>', function () {
            S.checkins.items.splice(idx, 1); save(); render();
          });
        }, 700);
      });
      el.addEventListener('touchend', function () { clearTimeout(timer); });
      el.addEventListener('touchmove', function () { clearTimeout(timer); });
    });
    // 萌宠
    if (route === '#/pet') {
      var cv = $('#pet-canvas', view);
      petPlayer = window.MonokumaPet.createPlayer(cv, function () { return S.pet.skin; });
      petPlayer.play(S.pet.sleeping ? 'sleep' : (petGrumpy() ? 'angry' : 'idle'));
      setTimeout(function () { say(petGrumpy() ? quote('angry') : greetLine()); }, 500);
      // 待机眨眼
      if (window._petBlink) clearInterval(window._petBlink);
      window._petBlink = setInterval(function () {
        if (!petPlayer || S.pet.sleeping) return;
        if (petPlayer.current() === 'idle') petPlayer.play('blink');
        setTimeout(function () {
          if (petPlayer && petPlayer.current() === 'blink') petPlayer.play(petGrumpy() ? 'angry' : 'idle');
        }, 600);
      }, 5000);
      // 皮肤小图
      $$('[data-skin-canvas]', view).forEach(function (c) {
        window.MonokumaPet.draw(c, { frame: 'stand', skin: c.getAttribute('data-skin-canvas'), scale: 3 });
      });
      $$('[data-act]', view).forEach(function (el) {
        el.addEventListener('click', function (e) { petAct(el.getAttribute('data-act'), e); });
      });
      $$('[data-skin]', view).forEach(function (el) {
        el.addEventListener('click', function (e) { trySkin(el.getAttribute('data-skin'), e); });
      });
      var rn = $('#rename-pet', view);
      if (rn) rn.addEventListener('click', function () {
        modal('给黑白熊改名', '<input id="pet-name-input" value="' + esc(S.pet.name) + '" maxlength="8">', function (mask) {
          var n = $('#pet-name-input', mask).value.trim();
          if (n) { S.pet.name = n; save(); render(); }
        });
      });
    } else {
      petPlayer = null;
    }
    // 设置
    var tb2 = $('#theme-btn', view);
    if (tb2) tb2.addEventListener('click', function () {
      S.theme = (S.theme === 'light') ? 'dark' : 'light';
      save(); applyTheme(S.theme); render();
      toast(S.theme === 'light' ? '换上纸张白 🌞' : '换回深夜黑 🌙');
    });
    var bi2 = $('#book-import-btn', view);
    if (bi2) bi2.addEventListener('click', function () {
      var mask = modal('📥 从电脑导入整本课本',
        '<div class="hint" style="margin-bottom:8px">电脑和这台平板要连<b>同一个Wi-Fi</b>，电脑上的课本服务器要开着（妈妈会保证）。下面填电脑地址。</div>' +
        '<input id="pc-addr" placeholder="例如 192.168.5.4:8899" style="width:100%;padding:10px;font-size:16px;border-radius:10px;border:1px solid #555;background:var(--surface3);color:var(--text)">' +
        '<button class="btn" id="pc-connect" style="width:100%;margin-top:8px">连接电脑</button>' +
        '<div id="pc-status" style="font-size:13px;margin-top:8px;min-height:20px;color:var(--dim)">填好地址后点"连接电脑"。</div>' +
        '<div id="pc-books"></div>',
        null, '关闭');
      var conn = $('#pc-connect', mask);
      if (conn) conn.onclick = function () {
        var addr = ($('#pc-addr', mask).value || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
        if (!addr) { $('#pc-status', mask).textContent = '先填电脑地址哦'; return; }
        $('#pc-status', mask).textContent = '连接中…';
        fetch('http://' + addr + '/manifest.json')
          .then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (man) {
            try { localStorage.setItem('kbpg-anchors', JSON.stringify(man.anchors || {})); } catch (e) { }
            var box = $('#pc-books', mask);
            box.innerHTML = '';
            Object.keys(man.subjects).forEach(function (ab) {
              var s2 = man.subjects[ab];
              var b = document.createElement('button');
              b.className = 'btn';
              b.style.cssText = 'width:100%;margin-top:8px';
              b.textContent = '📥 ' + s2.name + '（' + s2.pages + '页）';
              b.onclick = function () { importBook(ab, s2.pages, addr, b); };
              box.appendChild(b);
            });
            $('#pc-status', mask).textContent = '连上了！点要导入的书（一本约2-5分钟，中途别锁屏）：';
          })
          .catch(function () {
            $('#pc-status', mask).textContent = '连不上：看看是不是同一个Wi-Fi、地址对不对、电脑服务器开没开';
          });
      };
    });
    var ub = $('#update-btn', view);
    if (ub) ub.addEventListener('click', function () {
      if (!('serviceWorker' in navigator)) { toast('这台设备不支持自动更新'); return; }
      toast('正在检查更新…');
      navigator.serviceWorker.getRegistration().then(function (reg) {
        if (!reg) { toast('本地没有缓存，关掉重开就是最新版'); return; }
        reg.update().then(function () {
          setTimeout(function () {
            if (!reg.installing && !reg.waiting) toast('已经是最新版啦');
          }, 1500);
        }).catch(function () { toast('检查失败，看看网络连没连'); });
      });
    });
    var sb = $('#sound-btn', view);
    if (sb) sb.addEventListener('click', function () {
      S.sound = (S.sound === false);
      save(); render();
      toast(S.sound ? '音效已开 🔊' : '音效已关 🔇');
      if (S.sound) sfx('check');
    });
    var ex = $('#export-btn', view);
    if (ex) ex.addEventListener('click', function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '希望之峰备份-' + dkey() + '.json';
      a.click();
      toast('备份已下载');
    });
    var im = $('#import-btn', view);
    if (im) im.addEventListener('click', function () { $('#import-file', view).click(); });
    var imf = $('#import-file', view);
    if (imf) imf.addEventListener('change', function () {
      var f = imf.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var data = JSON.parse(r.result);
          if (!data.pet) throw 0;
          S = data; save(); render();
          toast('导入成功！');
        } catch (e) { toast('备份文件不对'); }
      };
      r.readAsText(f);
    });
    var rs = $('#reset-btn', view);
    if (rs) rs.addEventListener('click', function () {
      modal('清空重来', '<div style="font-size:14px;color:var(--pink);margin-bottom:8px">奖章、打卡、课表、羁绊全都会删掉，确定吗？建议先导出备份。</div>', function () {
        S = defaultState(); save(); render();
        toast('已清空，重新开始');
      });
    });
  }

  /* ================= 顶栏 ================= */
  function renderTopbar() {
    var logoCv = $('#logo-canvas');
    window.MonokumaPet.draw(logoCv, { frame: 'stand', skin: S.pet.skin, scale: 2 });
    updateMedalPill();
  }

  /* ================= 启动 ================= */
  function applyTheme(t) {
    document.body.classList.toggle('theme-light', t === 'light');
  }
  (function () { // 主题尽早应用（2026-08-24起默认纸张白，老用户未设置过的也迁移为浅色）
    var t = null;
    try { t = new URLSearchParams(location.search).get('theme'); } catch (e) { }
    if (t !== 'light' && t !== 'dark') {
      try { t = (JSON.parse(localStorage.getItem(LS_KEY)) || {}).theme; } catch (e) { }
    }
    if (t !== 'light' && t !== 'dark') t = 'light';
    document.addEventListener('DOMContentLoaded', function () { applyTheme(t); });
  })();
  function boot() {
    decayTick();
    renderTopbar();
    render();
    initRoamer();
    setInterval(function () {
      decayTick();
      renderTopbar();
      if ((location.hash || '#/home') === '#/pet') render();
    }, 60000);
    window.addEventListener('hashchange', render);
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        // 自动更新：启动即主动检查（不依赖页面导航），有新版自动换血并刷新一次
        var refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () {
          if (refreshing) return; refreshing = true;
          location.reload();
        });
        function watch() {
          reg.addEventListener('updatefound', function () {
            var nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', function () {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) nw.postMessage('SKIP_WAITING');
            });
          });
        }
        watch();
        // 每小时再查一次（App 挂后台一天也能追上）
        setInterval(function () { reg.update().catch(function () { }); }, 3600000);
        reg.update().catch(function () { });
      }).catch(function () { });
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
