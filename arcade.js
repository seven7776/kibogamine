/* Black-and-white playground. Local progress, finite rounds, no purchase or point deductions. */
(function () {
  'use strict';
  var WORLD=window.ArcadeWorld;
  var NAMES=['初次出发','面包店街角','广场跳跳路','小镇巡游','霓虹初夜','电玩大道','穿行灯海','夜城快车','森林入口','蘑菇小径','萤火深处','古树长廊','峡谷栈道','山风急弯','红岩穿梭','登峰试炼','雪松山麓','冰晶小径','极光长桥','希望之巅'];
  var HINTS=['熟悉换道与收星','跳过街角的金色矮栏','看准移动高墙再换道','体验蓝色加速带','双墙之间找到空道','换道后接一次起跳','移动墙与矮栏交替','更密集的城市组合赛','黑色沟槽可跳也可绕','连续收星后越过沟槽','移动墙前留好退路','树林里的换道跳跃组合','横木加入，注意起跳距离','在双墙与横木间穿行','加速后仍要看准空道','峡谷的连续组合挑战','冰蓝摆杆必须跳过','更快的摆杆与沟槽组合','双墙、横木、摆杆轮番来','全部机关组合的最终赛'];
  var LEVELS=NAMES.map(function(name,i){
    var biome=Math.floor(i/4), b=WORLD.BIOMES[biome];
    return {name:name,sub:HINTS[i],need:i,seconds:35+Math.round(i*1.3),speed:9+i*0.34,goal:7+i,spacing:2.5-i*0.035,color:b.color,sky:b.sky,kind:i,biome:biome};
  });
  // Old six-course saves allowed skipping a course. Keep their highest cleared stage,
  // grant its earlier cosmetic tiers, and let them replay the skipped stages.
  function cleared(state){return Object.keys(state.records).reduce(function(n,k){return state.records[k].stars>0?Math.max(n,Number(k)+1):n;},0);}
  function canEnter(state,index){return index>=0&&index<LEVELS.length&&index<=cleared(state);}
  function travel(position, seconds, dt, speedFactor) { return Math.min(seconds, Math.max(0, position + dt * speedFactor)); }
  function number(i){return String(i+1).padStart(2,'0');}
  var TRAILS = [
    { name: '经典脚步', color: '#ffffff', need: 0 },
    { name: '星光脚步', color: '#ffd24d', need: 3 },
    { name: '薄荷流光', color: '#6ee7d8', need: 7 },
    { name: '粉色闪电', color: '#ff70ad', need: 12 }
  ];
  function normalize(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var records = {};
    LEVELS.forEach(function (_, i) {
      var r = (raw.records || {})[i] || {};
      records[i] = { stars: Math.min(3, Math.max(0, Math.floor(Number(r.stars) || 0))), score: Math.max(0, Number(r.score) || 0) };
    });
    var state = { records: records, trail: Math.min(3, Math.max(0, Math.floor(Number(raw.trail) || 0))) };
    if (totalStars(state) < TRAILS[state.trail].need) state.trail = 0;
    return state;
  }
  function totalStars(state) { return Object.keys(state.records).reduce(function (sum, k) { return sum + state.records[k].stars; }, 0); }
  function rating(collected, goal, hearts) { return 1 + (collected >= goal ? 1 : 0) + (collected >= goal && hearts === 3 ? 1 : 0); }
  function recordResult(state, index, collected, hearts) {
    var stars = rating(collected, LEVELS[index].goal, hearts), prev = state.records[index], firstClear = prev.stars === 0, oldRank=cleared(state);
    var delta = Math.max(0, stars - prev.stars);
    prev.stars = Math.max(prev.stars, stars); prev.score = Math.max(prev.score, collected);
    return { stars: stars, delta: delta, firstClear: firstClear, upgrade: cleared(state)>oldRank };
  }
  /* Wall waves leave an escape lane; full-width low obstacles can be jumped. */
  function waves(index) {
    var level = LEVELS[index], rows = [], n = Math.floor((level.seconds - 7) / level.spacing);
    for (var i = 0; i < n; i++) {
      var lane = ((i * 7 + index) % 3) - 1;
      var row = { at: 4 + i * level.spacing, items: [] };
      if (i === 0) lane = 0;
      if (i > 0) {
        if ((level.kind === 1 || level.kind >= 4) && i % 3 === 1) {
          [-1, 0, 1].forEach(function (l) { row.items.push({ type: index>=16&&i%2===1?'sweeper':index>=12&&i%2===0?'log':'bar', lane: l }); });
        } else {
          row.items.push({ type: level.kind >= 2 && i % 4 === 2 ? 'moving' : 'block', lane: lane === 1 ? -1 : lane + 1 });
          if (level.kind >= 4 && i % 3 === 0) row.items.push({ type: 'block', lane: lane === -1 ? 1 : lane - 1 });
        }
      }
      if(index>=8&&i>0&&i%4===3) row.items.push({type:'pit',lane:lane});
      for (var c = 0; c < 3; c++) row.items.push({ type: 'star', lane: lane, offset: c * 2 });
      if (level.kind >= 3 && i % 4 === 0) row.items.push({ type: 'boost', lane: lane, offset: 7 });
      rows.push(row);
    }
    return rows;
  }
  function mount(host, options) {
    var state = options.state, disposed = false, scene = null, renderer = null, camera = null, bear = null;
    var raf = 0, resizeObserver = null, cleanups = [], frameTime = 0, clock = 0, runTime = 0;
    var selected = 0, phase = 'lobby', objects = [], roadMarks = [], scenery = [], sparks = [];
    var rowIndex = 0, rows = [], lane = 0, x = 0, jumpTime = -1, jumpY = 0, hearts = 3, collected = 0;
    var invulnerable = 0, boost = 0, noteTimer = 0, combo = 0, countdown = 3, audio = null, muted = !options.sound;
    var hud, overlay, note, canvas, progress, activeLevel, actualSpeed, finishGate, fx, gearRank;
    var drive = "normal", usedItems = {}, liveItems = {}, hudValue = "", jumpBuffer = 0;
    function on(target, event, fn, opts) {
      target.addEventListener(event, fn, opts);
      cleanups.push(function () { target.removeEventListener(event, fn, opts); });
    }
    function tone(freq, length) {
      if (muted) return;
      try {
        if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === 'suspended') audio.resume();
        var o = audio.createOscillator(), gain = audio.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        gain.gain.setValueAtTime(0.035, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + length);
        o.connect(gain); gain.connect(audio.destination); o.start(); o.stop(audio.currentTime + length);
        o.onended = function () { o.disconnect(); gain.disconnect(); };
      } catch (_) { /* Audio is optional on older tablet browsers. */ }
    }
    function message(text) { if (note) note.textContent = text; noteTimer = 2.3; }
    function previewReward(index) {
      var mask=document.createElement('div'), rank=index+1, reward=WORLD.REWARDS[index], player=null, closed=false;
      mask.className='modal-mask reward-preview';
      mask.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-labelledby="reward-title"><h3 id="reward-title">'+reward[0]+'</h3><p>'+reward[1]+'</p><canvas aria-label="成长装备与特效预览"></canvas><p class="hint">展示到第 '+rank+' 级的装备与特效组合。'+(rank<=cleared(state)?'已获得，进入关卡自动生效。':'尚未获得，此处仅预览，不改变进度。')+'</p><div class="btn-row"><button class="btn ghost" id="reward-turn">转身看背面</button><button class="btn" id="reward-close">返回</button></div></section>';
      document.body.appendChild(mask);
      var target=0, fxPreview, previousCycle=-1, focus=document.activeElement;
      function close(){if(closed)return;closed=true;if(player)player.stop();mask.remove();document.removeEventListener('keydown',key);if(focus&&focus.isConnected)focus.focus();}
      function key(e){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){var first=mask.querySelector('#reward-turn'),last=mask.querySelector('#reward-close');if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
      mask.querySelector('#reward-close').onclick=close;mask.querySelector('#reward-turn').onclick=function(e){target=target===0?Math.PI:0;e.currentTarget.textContent=target?'转回正面':'转身看背面';};document.addEventListener('keydown',key);cleanups.push(close);
      try{player=window.Pet3D.createStage(mask.querySelector('canvas'),function(){return options.skin;},{camZ:10,camY:2.6,lookY:1.7,pixelRatio:1.25,decorate:function(model,previewScene){WORLD.equip(model,rank);fxPreview=WORLD.effects(previewScene,rank,null,0);},onFrame:function(model,t,dt){var cycle=Math.floor(t/3),step=t%3,jump=step<0.95?0.8*Math.sin(Math.PI*step/0.95):0;model.root.position.y=jump;model.root.rotation.y+=(target-model.root.rotation.y)*Math.min(1,dt*7);if(cycle!==previousCycle){previousCycle=cycle;fxPreview.burst(new THREE.Vector3(0,0.8,0),5);}fxPreview.update(dt,t,0,jump,2,true);}});}catch(e){mask.querySelector('canvas').replaceWith(document.createTextNode('当前设备无法打开预览，请回地图后重试。'));}
      mask.querySelector('#reward-close').focus();
    }
    function releaseScene() {
      if (raf) cancelAnimationFrame(raf); raf = 0;
      if (resizeObserver) resizeObserver.disconnect(); resizeObserver = null;
      cleanups.forEach(function (fn) { fn(); }); cleanups = [];
      if (scene) window.Pet3D.dispose(scene);
      if (renderer) renderer.dispose();
      scene = renderer = camera = bear = null;
      objects = []; scenery = []; roadMarks = []; sparks = [];
    }
    function lobby() {
      releaseScene(); phase = 'lobby';
      var stars = totalStars(state), rank = cleared(state);
      host.innerHTML = '<section class="arcade-lobby"><div class="arcade-back"><a href="#/pet">← 回黑白熊的家</a><span>免费试玩 · 学习奖章不扣除</span></div>' +
        '<div class="arcade-hero"><div><p class="arcade-eyebrow">MONOKUMA / PLAYGROUND</p><h2>放学了，<br>一起去闯关。</h2><p>黑白熊已经站上起跑线。<br>躲开路障、跳过栏杆，把星星带回来。</p><button class="arcade-primary" id="arcade-quick">' + (stars ? '继续冒险 ↗' : '从第一关出发 ↗') + '</button></div><div class="arcade-mascot"><canvas id="arcade-preview"></canvas><span>呜噗噗，准备好了吗？</span></div></div>' +
        '<div class="arcade-section"><h3>游乐地图</h3><span>已收集 ' + stars + ' / 60 枚关卡星</span></div><div class="arcade-levels">' + LEVELS.map(function (l, i) {
          var locked = !canEnter(state,i), r = state.records[i];
          return (i%4===0?'<div class="arcade-biome-heading"><span>区域 '+(Math.floor(i/4)+1)+' / '+WORLD.BIOMES[l.biome].name+'</span><small>关卡 '+number(i)+'—'+number(i+3)+'</small></div>':'') + '<button class="arcade-level' + (locked ? ' is-locked' : '') + '" data-level="' + i + '" ' + (locked ? 'disabled' : '') + ' style="--level-color:' + l.color + '"><span class="arcade-level-no">' + number(i) + '</span><b>' + l.name + '</b><small>' + l.sub + '</small><small class="arcade-prize">首通奖励 · '+WORLD.REWARDS[i][0]+'</small><span class="arcade-level-foot">' + (locked ? '通过第 '+i+' 关解锁' : '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + ' · ' + l.seconds + ' 秒') + '</span></button>';
        }).join('') + '</div><div class="arcade-section"><h3>成长装备 · Lv.'+rank+'</h3><span>每通过一关，自动穿戴新装备或升级特效</span></div><div class="arcade-rewards">'+WORLD.REWARDS.map(function(r,i){return '<button data-reward="'+i+'" class="arcade-reward '+(i<rank?'earned':'')+'"><b>'+r[2]+' '+r[0]+'</b><small>'+r[1]+'</small><span>'+(i<rank?'已获得 · 自动生效':'通过第 '+(i+1)+' 关获得')+'</span></button>';}).join('')+'</div><div class="arcade-section"><h3>我的脚步特效</h3><span>挑战进步就能解锁</span></div><div class="arcade-trails">' + TRAILS.map(function (t, i) {
          return '<button data-trail="' + i + '" class="' + (state.trail === i ? 'selected' : '') + '" ' + (stars < t.need ? 'disabled' : '') + '><i style="background:' + t.color + '"></i>' + t.name + '<small>' + (stars < t.need ? t.need + ' 枚关卡星解锁' : state.trail === i ? '使用中' : '已解锁') + '</small></button>';
        }).join('') + '</div><p class="arcade-rule">每关到达终点得 1 星，收集目标数量再得 1 星，同时保持三颗爱心得第 3 星。关卡星取最好成绩，不重复累加。想休息随时退出，失败不扣奖章。</p></section>';
      host.querySelectorAll('[data-reward]').forEach(function(b){on(b,'click',function(){previewReward(Number(b.dataset.reward));});});
      var preview = host.querySelector('#arcade-preview');
      var player = window.Pet3D.createStage(preview, function () { return options.skin; }, {camZ:8.6,decorate:function(model){ WORLD.equip(model,rank); }});
      cleanups.push(function () { player.stop(); });
      on(host.querySelector('#arcade-quick'), 'click', function () {
        var next = LEVELS.findIndex(function (l, i) { return canEnter(state,i) && state.records[i].stars === 0; });
        start(next < 0 ? 0 : next);
      });
      host.querySelectorAll('[data-level]').forEach(function (b) { on(b, 'click', function () { start(Number(b.dataset.level)); }); });
      host.querySelectorAll('[data-trail]').forEach(function (b) { on(b, 'click', function () { state.trail = Number(b.dataset.trail); options.save(); lobby(); }); });
    }
    function material(color, emissive) { return new THREE.MeshStandardMaterial({ color: color, roughness: 0.65, emissive: emissive ? color : '#000000', emissiveIntensity: emissive ? 0.25 : 0 }); }
    function box(w, h, d, color, px, py, pz) {
      var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color)); mesh.position.set(px, py, pz); scene.add(mesh); return mesh;
    }
    function starMesh(color) {
      var shape = new THREE.Shape();
      for (var i = 0; i < 10; i++) { var angle = Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? 0.22 : 0.48;
        if (!i) shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius); else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      shape.closePath();
      return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1 }), material(color, true));
    }
    function start(index) {
      if (!canEnter(state,index)) return;
      releaseScene(); selected = index; activeLevel = LEVELS[index]; phase = 'ready'; drive='normal';usedItems={};liveItems={};hudValue='';jumpBuffer=0;
      clock = runTime = frameTime = 0; lane = x = collected = combo = invulnerable = boost = 0; jumpTime = -1; jumpY = 0; hearts = 3; rowIndex = 0; rows = waves(index); countdown = 3;
      host.innerHTML = '<section class="arcade-game"><div class="arcade-toolbar"><button id="arcade-exit">← 地图</button><b>' + number(index) + ' / ' + activeLevel.name + '</b><div><button id="arcade-sound" aria-label="切换声音">' + (muted ? '静音' : '声音开') + '</button><button id="arcade-pause">暂停</button></div></div><div class="arcade-viewport"><canvas aria-label="黑白熊闯关赛道" tabindex="0"></canvas><div class="arcade-hud"><span class="arcade-hearts"></span><span></span><span></span></div><div class="arcade-progress"><i></i></div><div class="arcade-note" aria-live="polite"></div><div class="arcade-overlay"></div></div><div class="arcade-controls"><div><button data-move="-1" aria-label="向左换道">◀</button><button data-move="1" aria-label="向右换道">▶</button></div><span>左右换道 · 低障碍可跳<br>粉色高墙要绕开</span><button class="arcade-jump" id="arcade-jump">跳跃 ↑</button></div><div class="arcade-drive" aria-label="前进模式"><button data-drive="reverse" aria-pressed="false">倒退 ↓</button><button data-drive="stop" aria-pressed="false">停止 ■</button><button data-drive="normal" aria-pressed="true">前进 ▶</button><button data-drive="fast" aria-pressed="false">加速 »</button></div></section>';
      canvas = host.querySelector('canvas'); hud = host.querySelector('.arcade-hud'); overlay = host.querySelector('.arcade-overlay'); note = host.querySelector('.arcade-note'); progress = host.querySelector('.arcade-progress i');
      try {
        renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        scene = new THREE.Scene(); scene.background = new THREE.Color(activeLevel.sky); scene.fog = new THREE.Fog(activeLevel.sky, 35, 90);
        camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120); camera.position.set(0, 7.2, 14); camera.lookAt(0, 0.2, -9);
        var snow = activeLevel.biome === 4;
        scene.add(new THREE.HemisphereLight('#ffffff', '#34405b', snow ? 0.85 : 1.3));
        var light = new THREE.DirectionalLight('#fff3de', snow ? 0.9 : 1.5); light.position.set(-5, 9, 10); scene.add(light);
        box(10, 0.5, 110, WORLD.BIOMES[activeLevel.biome].road, 0, -0.45, -40);
        [-5.1, 5.1].forEach(function (xx) { box(0.16, 0.3, 110, activeLevel.color, xx, -0.08, -40); });
        for (var j = 0; j < 24; j++) {
          [-1.5, 1.5].forEach(function (xx) { roadMarks.push(box(0.045, 0.025, 1.8, '#c6cee1', xx, -0.18, 8 - j * 4.5)); });
        }
        scenery = WORLD.buildScenery(scene,activeLevel.biome);
        finishGate = new THREE.Group(); finishGate.visible = false; scene.add(finishGate);
        [-4.7,4.7].forEach(function(xx){var post=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,4.7,12),material(activeLevel.color));post.position.set(xx,2.1,0);finishGate.add(post);});
        for(var fi=0;fi<12;fi++)for(var fj=0;fj<2;fj++){
          var flag=new THREE.Mesh(new THREE.BoxGeometry(0.78,0.38,0.1),material((fi+fj)%2?'#202638':'#ffffff'));
          flag.position.set(-4.3+fi*0.78,4.25+fj*0.38,0);finishGate.add(flag);
        }
        bear = window.Pet3D.buildModel(options.skin); bear.root.name = 'monokuma-runner'; bear.root.scale.setScalar(0.58); bear.root.position.set(0, 0.1, 3); bear.root.rotation.y=Math.PI; scene.add(bear.root);
        gearRank=cleared(state);WORLD.equip(bear,gearRank);fx=WORLD.effects(scene,gearRank,state.trail>0?TRAILS[state.trail].color:null);
        for (var sp = 0; sp < 12; sp++) {
          var spark = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), material(TRAILS[state.trail].color, true));
          spark.visible = false; scene.add(spark); sparks.push(spark);
        }
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas); resize();
      } catch (err) {
        releaseScene();
        host.innerHTML = '<div class="arcade-error"><h3>这个浏览器暂时无法启动 3D 场景</h3><p>请关闭其他页面后重试。原来的学习记录和奖章都保留着。</p><button id="arcade-retry">回游乐地图</button></div>';
        on(host.querySelector('#arcade-retry'), 'click', lobby); return;
      }
      on(host.querySelector('#arcade-exit'), 'click', lobby);
      on(host.querySelector('#arcade-pause'), 'click', pauseToggle);
      on(host.querySelector('#arcade-sound'), 'click', function (e) { muted = !muted; e.currentTarget.textContent = muted ? '静音' : '声音开'; tone(520, 0.1); });
      host.querySelectorAll('[data-drive]').forEach(function(b){on(b,'click',function(){setDrive(b.dataset.drive);});});
      host.querySelectorAll('[data-move]').forEach(function (b) { on(b, 'pointerdown', function (e) { e.preventDefault(); move(Number(b.dataset.move)); }); });
      on(host.querySelector('#arcade-jump'), 'pointerdown', function (e) { e.preventDefault(); jump(); });
      on(window, 'keydown', function (e) {
        if (e.repeat) return;
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'w', 'ArrowDown', 's', 'f', 'r', 'Escape'].indexOf(e.key) < 0) return;
        e.preventDefault();
        if (e.key === 'Escape') pauseToggle();
        else if (e.key === 'ArrowDown' || e.key === 'r') setDrive('reverse');
        else if (e.key === 's') setDrive('stop');
        else if (e.key === 'f') setDrive('fast');
        else if (e.key === 'ArrowLeft' || e.key === 'a') move(-1);
        else if (e.key === 'ArrowRight' || e.key === 'd') move(1); else jump();
      });
      var down = null;
      on(canvas, 'pointerdown', function (e) { if(down)return; down = [e.clientX, e.clientY, e.pointerId]; canvas.setPointerCapture(e.pointerId); });
      on(canvas, 'pointerup', function (e) {
        if (!down || down[2]!==e.pointerId) return; var dx = e.clientX - down[0], dy = e.clientY - down[1]; down = null;
        if (Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? -1 : 1);
        else if (dy < -25 || Math.abs(dx) < 12 && Math.abs(dy) < 12) jump();
      });
      on(canvas, 'pointercancel', function () { down = null; });
      on(document, 'visibilitychange', function () { if (document.hidden) pause(); });
      on(window, 'blur', pause);
      on(canvas, 'webglcontextlost', function (e) { e.preventDefault(); pause(); message('画面暂时中断，请回地图重新进入。'); });
      readyOverlay(); updateHud(); raf = requestAnimationFrame(loop);
    }
    function resize() {
      if (!renderer) return;
      var w = canvas.clientWidth || 600, h = canvas.clientHeight || 420;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      // Keep all three lanes visible in portrait orientation.
      camera.fov = camera.aspect < 0.9 ? 62 : 48; camera.updateProjectionMatrix();
    }
    function readyOverlay() {
      overlay.hidden = false;
      overlay.innerHTML = '<div class="arcade-dialog"><p class="arcade-eyebrow">READY / ' + number(selected) + '</p><h3>' + activeLevel.name + '</h3><p>左右按钮或左右滑动换道<br>点击「跳跃」或向上滑动越过金色矮栏<br>粉色高墙请换道；黑色沟槽、横木可跳过<br>三次碰撞后可免费重来<br>倒退重走不重复得星；停止后点「前进」继续<br>加速会缩短反应时间，可随时恢复前进</p><p class="arcade-prize">本关首通：'+WORLD.REWARDS[selected][0]+' · '+WORLD.REWARDS[selected][1]+'</p><p>目标：到终点 · 收集 ' + activeLevel.goal + ' 颗星星 · 保持三颗爱心</p><button class="arcade-primary" id="arcade-start">准备好了，出发！</button></div>';
      overlay.querySelector('#arcade-start').onclick = function () { phase = 'countdown'; overlay.innerHTML = '<strong class="arcade-count">3</strong>'; tone(440, 0.12); };
    }
    function move(direction) { if (phase !== 'running') return; lane = Math.min(1, Math.max(-1, lane + direction)); tone(260 + lane * 50, 0.05); }
    function setDrive(mode) {
      if(phase!=='running')return;
      drive=mode;
      host.querySelectorAll('[data-drive]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.drive===drive));});
      message({reverse:'正在倒退 · 星星不会重复计奖',stop:'已停止 · 点前进继续',normal:'正常前进',fast:'正在加速 · 看准障碍再跳'}[drive]);
    }
    function jump() {
      if(phase!=='running'||drive==='stop')return;
      if(jumpTime>=0){if(jumpTime>0.80)jumpBuffer=0.15;return;}
      jumpTime=0;jumpBuffer=0;tone(580,0.12);
    }
    var resumePhase = 'running';
    function pause() {
      if (phase !== 'running' && phase !== 'countdown') return;
      resumePhase = phase; phase = 'paused'; frameTime = 0; jumpBuffer=0;
      overlay.hidden = false; overlay.innerHTML = '<div class="arcade-dialog"><h3>歇一会儿</h3><p>赛道与倒计时都停住了。</p><button class="arcade-primary" id="arcade-resume">继续这一局</button><button id="arcade-paused-exit">回地图</button></div>';
      overlay.querySelector('#arcade-resume').onclick = pauseToggle;
      overlay.querySelector('#arcade-paused-exit').onclick = lobby;
    }
    function pauseToggle() {
      if (phase === 'paused') { phase = resumePhase; frameTime = 0; overlay.hidden = phase !== 'countdown'; if (phase === 'countdown') overlay.innerHTML = '<strong class="arcade-count">' + Math.ceil(countdown) + '</strong>'; }
      else pause();
    }
    function spawn(row, rowId) {
      row.items.forEach(function (item, itemId) {
        var id=rowId+':'+itemId, z=3+(runTime-row.at)*activeLevel.speed-(item.offset||0);
        if(usedItems[id]||liveItems[id]||z < -75||z > 12)return;
        var obj, type = item.type;
        if (type === 'star') { obj = starMesh('#ffe481'); scene.add(obj); obj.position.y = 0.8; }
        else if (type === 'bar') { obj = box(2.6, 0.48, 0.55, '#ffcb54', 0, 0.25, 0); }
        else if (type === 'sweeper') { obj=box(2.7,0.22,0.48,'#85d8ff',0,0.36,0);var pivot=new THREE.Mesh(new THREE.SphereGeometry(0.19,10,8),material('#faf7ed'));obj.add(pivot); }
        else if (type === 'log') { obj=new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.30,2.6,10),material('#c6a077'));obj.rotation.z=Math.PI/2;obj.position.y=0.18;scene.add(obj); }
        else if (type === 'pit') { obj=box(2.7,0.045,1.0,'#182432',0,-0.16,0); [-1,1].forEach(function(side){var edge=new THREE.Mesh(new THREE.BoxGeometry(2.7,0.055,0.08),material('#ffc96b'));edge.position.z=side*0.49;obj.add(edge);}); }
        else if (type === 'boost') { obj = box(2.4, 0.06, 1.5, '#69dcff', 0, -0.15, 0); }
        else { obj = box(2, 2.2, 1, '#f77daa', 0, 0.9, 0); var band = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.24, 1.02), material('#292d43')); band.rotation.z = 0.12; obj.add(band); }
        obj.position.x = item.lane * 3;
        obj.userData.kind = type;
        obj.position.z = z;liveItems[id]=true;
        objects.push({ id:id, offset:item.offset||0, mesh: obj, type: type, lane: item.lane, seed: row.at, used: false });
      });
    }
    function updateHud() {
      var seconds=Math.max(0,Math.ceil(activeLevel.seconds-runTime)), value=hearts+':'+collected+':'+seconds;
      if(value!==hudValue){
        hudValue=value;var spans=hud.children;
        spans[0].textContent='♥'.repeat(hearts)+'♡'.repeat(3-hearts);
        spans[1].textContent='★ '+collected+' / '+activeLevel.goal;
        spans[2].textContent='约 '+seconds+' 秒路程';
      }
      progress.style.width=Math.min(100,runTime/activeLevel.seconds*100)+'%';
    }
    function finish(won) {
      if (phase !== 'running') return;
      phase = won ? 'won' : 'lost'; jumpTime=-1; jumpY=0; overlay.hidden = false;
      var result = won ? recordResult(state, selected, collected, hearts) : { stars: 0, delta: 0 };
      if (won) { options.save(); if (result.delta) options.reward(result.delta); tone(880, 0.3); }
      var nextAvailable = selected + 1 < LEVELS.length && canEnter(state,selected+1);
      overlay.innerHTML = '<div class="arcade-dialog arcade-result"><p class="arcade-eyebrow">' + (won ? 'FINISH / 完成一局' : 'TRY AGAIN / 再来一次也没关系') + '</p><h3>' + (won ? '呜噗噗，抵达终点！' : '差一点，下次绕过去！') + '</h3><div class="arcade-result-stars">' + '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars) + '</div><p>本局收集 ' + collected + ' 颗星星' + (won ? ' · 最佳 ' + state.records[selected].score + ' 颗' : '') + '</p><p>' + (won ? (result.delta ? '新增 ' + result.delta + ' 枚关卡星，羁绊 +' + result.delta * 3 : '最好成绩已保留。没有重复增加关卡星。') : '学习奖章没有减少。粉墙要换道，金栏可跳过。') + '</p>'+ (won&&result.upgrade?'<div class="arcade-unlock"><b>解锁 '+WORLD.REWARDS[selected][0]+'</b><span>'+WORLD.REWARDS[selected][1]+'</span><small>已自动装备 · 下一局直接体验</small></div>':'')+'<div class="arcade-result-actions"><button class="arcade-primary" id="arcade-again">再挑战这一关</button>' + (won && nextAvailable ? '<button id="arcade-next">去下一关 →</button>' : '') + '<button id="arcade-map">回地图 / 休息一下</button></div></div>';
      overlay.querySelector('#arcade-again').onclick = function () { start(selected); };
      overlay.querySelector('#arcade-map').onclick = lobby;
      var next = overlay.querySelector('#arcade-next'); if (next) next.onclick = function () { start(selected + 1); };
    }
    function loop(ts) {
      if (disposed || !renderer) return;
      raf = requestAnimationFrame(loop);
      if (document.hidden) { frameTime = 0; return; }
      var dt = frameTime ? Math.min(0.05, (ts - frameTime) / 1000) : 0; frameTime = ts;
      if (phase === 'paused') return;
      if(phase!=='running'||drive!=='stop')clock += dt;
      if (phase === 'countdown') {
        var before = Math.ceil(countdown); countdown -= dt;
        if (countdown <= 0) { phase = 'running'; overlay.hidden = true; message('出发！左右换道，金栏可跳'); tone(780, 0.18); }
        else if (Math.ceil(countdown) !== before) { overlay.innerHTML = '<strong class="arcade-count">' + Math.ceil(countdown) + '</strong>'; tone(440, 0.1); }
      }
      if (phase === 'running') {
        var factor=drive==='stop'?0:drive==='reverse'?-0.6:drive==='fast'?1.5:1;
        factor*=boost>0?1.22:1;
        runTime=travel(runTime,activeLevel.seconds,dt,factor);actualSpeed=activeLevel.speed*factor;
        var motionDt=drive==='stop'?0:dt;
        finishGate.visible = activeLevel.seconds - runTime < 6;
        finishGate.position.z = 3 - (activeLevel.seconds - runTime) * activeLevel.speed;
        invulnerable = Math.max(0, invulnerable - motionDt); boost = Math.max(0, boost - motionDt);
        noteTimer -= dt; if (noteTimer <= 0) note.textContent = '';
        x += (lane * 3 - x) * Math.min(1, motionDt * 14);
        jumpBuffer=Math.max(0,jumpBuffer-motionDt);
        if (jumpTime >= 0) { jumpTime += motionDt; jumpY = 1.55 * Math.sin(Math.PI * Math.min(1, jumpTime / 0.95)); if (jumpTime >= 0.95) { jumpTime = -1; jumpY = 0; if(jumpBuffer>0)jump(); } }
        rows.forEach(function(row,i){spawn(row,i);});
        objects.forEach(function (o) {
          if (o.used) return;
          var oldZ=o.mesh.position.z;
          o.mesh.position.z = 3+(runTime-o.seed)*activeLevel.speed-o.offset;
          if (o.type === 'moving') o.mesh.position.x = o.lane * 3 + Math.sin(clock * 1.4 + o.seed) * 1.25;
          if (o.type === 'sweeper') o.mesh.rotation.y=Math.sin(clock*2.8+o.seed)*0.24;
          if (o.type === 'star') o.mesh.rotation.y += dt * 1.7;
          var crossesPlayer=Math.min(oldZ,o.mesh.position.z)<3.7 && Math.max(oldZ,o.mesh.position.z)>2.3;
          if (drive!=='stop' && crossesPlayer && Math.abs(o.mesh.position.x - x) < (o.type === 'star' ? 1 : 1.2)) {
            if (o.type === 'star') {
              o.used = true; o.mesh.visible = false; collected++; combo++; fx.burst(o.mesh.position,combo); tone(500 + Math.min(combo, 12) * 40, 0.07);
              if (combo % 6 === 0) message('连续收集 ' + combo + ' 颗！');
            } else if (o.type === 'boost') { o.used = true; o.mesh.visible = false; boost = 2.2; message('加速带！继续看前方'); tone(700, 0.2); }
            else if (!invulnerable && (['bar','log','pit','sweeper'].indexOf(o.type)<0 || jumpY < 0.72)) {
              o.used = true; hearts--; combo = 0; invulnerable = 1.5; message(['bar','log','pit','sweeper'].indexOf(o.type)>=0 ? '矮栏、横木、沟槽和摆杆可以跳过去' : '粉色高墙要换道绕开'); tone(140, 0.2);
            }
          }
        });
        for (var i = objects.length - 1; i >= 0; i--) if (objects[i].mesh.position.z > 12 || objects[i].mesh.position.z < -75 || objects[i].used) {
          if(objects[i].used)usedItems[objects[i].id]=true;delete liveItems[objects[i].id];
          scene.remove(objects[i].mesh); window.Pet3D.dispose(objects[i].mesh); objects.splice(i, 1);
        }
        roadMarks.forEach(function (m) { m.position.z += actualSpeed * dt; if (m.position.z > 10) m.position.z -= 108; if (m.position.z < -98) m.position.z += 108; });
        scenery.forEach(function (m) { m.position.z += actualSpeed * dt; if (m.position.z > 14) m.position.z -= 108; if(m.position.z < -94) m.position.z += 108; });
        sparks.forEach(function (s, i) { s.visible = state.trail > 0; s.position.set(x + Math.sin(clock * 6 + i) * 0.3, 0.05 + i * 0.012, 3 + ((clock * 5 + i * 0.22) % 3)); });
        updateHud();
        if (hearts <= 0) finish(false); else if (runTime >= activeLevel.seconds) finish(true);
      }
      window.Pet3D.animate(bear.parts, bear.bodyG, phase === 'running' && drive !== 'stop' ? 'walk' : phase === 'won' ? 'happy' : phase === 'lost' ? 'sit' : 'idle', drive==='reverse'?-clock:clock, dt);
      bear.root.position.set(x, 0.1 + jumpY, 3); bear.root.rotation.z = (lane * 3 - x) * -0.06;
      bear.root.visible = phase !== 'running' || invulnerable <= 0 || Math.sin(clock * 30) > -0.3;
      bear.root.rotation.y += ((phase==='won'?Math.PI*2:Math.PI)-bear.root.rotation.y)*Math.min(1,dt*6);
      fx.update(phase==='running'&&drive==='stop'?0:dt,clock,x,jumpY,phase==='running'?actualSpeed:0,phase==='running'&&drive!=='stop');
      renderer.render(scene, camera);
    }
    lobby();
    return { destroy: function () { disposed = true; releaseScene(); if (audio) audio.close().catch(function () {}); } };
  }
  window.BearArcade = { mount: mount, normalize: normalize, totalStars: totalStars, rating: rating, recordResult: recordResult, waves: waves, LEVELS: LEVELS, cleared: cleared, canEnter: canEnter, travel: travel };
})();
