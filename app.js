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
    S.points -= n; save(); updateMedalPill();
    return true;
  }
  function updateMedalPill() {
    var el = $('#medal-count');
    if (el) el.textContent = S.points;
  }

  /* ================= 黑白熊台词 ================= */
  var QUOTES = {
    feed: ['唔噗噗，这还差不多。', '吧唧吧唧……再来一碗！', '校长的午餐时间！'],
    drink: ['咕咚咕咚……噗哈！', '水是希望之源哦。'],
    snack: ['零食！！唔噗噗噗~', '这个归校长我了！'],
    tickle: ['唔噗噗噗~住手啦好痒！', '哈哈哈……你完啦你完啦'],
    roll: ['翻个身~别看我屁股。', '哼，给你个背影。'],
    sleep: ['晚安……明天也要充满希望地绝望哦。', '呼……呼……'],
    wake: ['唔……再睡五分钟……', '早啊，今天也要给校长挣奖章！'],
    angry: ['你再不管我，就开班级审判了哦！', '饿扁了……这就是绝望的味道吗？', '喂——有人吗——'],
    tap: ['干嘛？', '唔噗噗！', '找校长有事？', '戳我戳我，奖章拿来~'],
    levelup: ['升级啦！我们的羁绊加深了哦！']
  };
  function quote(type) {
    var arr = QUOTES[type] || QUOTES.tap;
    return arr[Math.floor(Math.random() * arr.length)];
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
    h += '<div class="hint">教材版本：语文部编版 / 数学苏教版 / 英语译林版。内容持续填充中——骨架先搭好，每周往里填新课。</div>';
    return h;
  }

  /* ---------- 学科·单元课文 ---------- */
  function renderSubject(key) {
    var s = D.CURRICULUM[key];
    if (!s) return '<div class="empty-tip">学科不存在</div>';
    var h = '<div class="back-row"><button data-go="#/study">‹ 返回学科</button></div>';
    h += '<div class="lesson-hero"><div class="crumb">' + s.version + '</div><h2 style="color:' + s.color + '">' + s.name + '</h2>' +
      '<div class="focus">点单元展开课文，点课文开始学习</div></div>';
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
      h += '<div class="section-title">' + (key === 'english' ? '单词短语' : '词语积累') + '</div><div class="card"><div class="word-chips">';
      if (l.words.list) l.words.list.forEach(function (w) { h += '<span class="chip' + (key === 'english' ? ' eng' : '') + '">' + esc(w) + '</span>'; });
      if (l.words.phrases) l.words.phrases.forEach(function (w) { h += '<span class="chip eng" style="border-color:var(--gold-dim)">' + esc(w) + '</span>'; });
      if (l.words.write) l.words.write.forEach(function (w) { h += '<span class="chip" style="border-color:' + s.color + '55">' + esc(w) + '</span>'; });
      h += '</div>';
      if (l.words.write) h += '<div class="hint">带色框的是会写字，每个写两遍，明天听写。</div>';
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

  /* ---------- 设置 ---------- */
  function renderSettings() {
    return '<div class="section-title">设置</div>' +
      '<div class="card">' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="export-btn">导出备份（JSON）</button>' +
      '<button class="btn ghost" style="width:100%;margin-bottom:10px" id="import-btn">导入备份</button>' +
      '<input type="file" id="import-file" accept=".json" style="display:none">' +
      '<button class="btn ghost" style="width:100%;color:var(--pink)" id="reset-btn">清空重来</button>' +
      '<div class="hint">数据只存在这台设备的浏览器里。换手机/清浏览器前，先导出备份发给家长微信存好。</div></div>' +
      '<div class="card"><div class="hint">希望之峰 v1.0 · 给源远 · 黑白熊形象出自《弹丸论破》<br>教材：部编语文 / 苏教数学 / 译林英语 五年级上册</div></div>';
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
        after('eat', quote('feed')); break;
      case 'drink':
        if (!spend(3)) return;
        p.thirst = Math.min(100, p.thirst + 25);
        addXp(3); S.counters.feeds++; S._feedDay = dkey();
        after('eat', quote('drink')); break;
      case 'snack':
        if (!spend(10)) return;
        p.hunger = Math.min(100, p.hunger + 10); p.mood = Math.min(100, p.mood + 10);
        addXp(6);
        after('happy', quote('snack')); break;
      case 'tickle':
        if (!spend(5)) return;
        p.mood = Math.min(100, p.mood + 20);
        addXp(5);
        after('giggle', quote('tickle')); break;
      case 'roll':
        if (!spend(5)) return;
        p.mood = Math.min(100, p.mood + 8);
        addXp(4);
        after('back', quote('roll')); break;
      case 'sleep':
        if (p.sleeping) {
          p.sleeping = false;
          after('idle', quote('wake'), 800);
        } else {
          if (!spend(8)) return;
          p.sleeping = true;
          addXp(4);
          after('sleep', quote('sleep'), 60000);
        }
        break;
      case 'play':
        p.mood = Math.min(100, p.mood + 6);
        addXp(2);
        after('happy', quote('tap'), 1800);
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
    { hash: '#/pet', icon: '🐻', name: '黑白熊' }
  ];
  function renderTabbar(route) {
    var bar = $('#tabbar');
    bar.innerHTML = TABS.map(function (t) {
      var on = route.indexOf(t.hash) === 0 || (t.hash === '#/study' && route.indexOf('#/lesson') === 0) || (t.hash === '#/study' && route.indexOf('#/subject') === 0);
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
      setTimeout(function () { say(petGrumpy() ? quote('angry') : '唔噗噗，你来啦！'); }, 500);
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
      navigator.serviceWorker.register('sw.js').catch(function () { });
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
