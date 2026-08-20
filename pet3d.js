/* ============================================================
 * 黑白熊 3D 引擎 — Three.js 程序化建模, 参照弹丸论破2官方设定图
 * 半白半黑(shader按局部x切色) + 红斜眼 + 锯齿咧嘴 + 白肚皮X扣
 * API 兼容旧 pet.js: MonokumaPet.draw / createPlayer / SKINS
 * ============================================================ */
(function () {
  'use strict';
  if (!window.THREE) { console.error('pet3d: three.min.js 未加载'); return; }

  /* ---------- 皮肤 ---------- */
  var SKINS = {
    classic:  { name: '经典校长',   a: '#F2F2F0', b: '#26262E', eye: '#E60033', acc: null,       cost: 0,   unlock: '默认拥有' },
    suit:     { name: '西装校长',   a: '#F2F2F0', b: '#26262E', eye: '#E60033', acc: 'suit',     cost: 50,  unlock: '羁绊Lv.2' },
    invert:   { name: '绝望反色',   a: '#26262E', b: '#F2F2F0', eye: '#E60033', acc: null,       cost: 50,  unlock: '50奖章' },
    gold:     { name: '黄金审判',   a: '#F7C948', b: '#2B2113', eye: '#FF3E6C', acc: null,       cost: 120, unlock: '羁绊Lv.4' },
    cyber:    { name: '赛博熊',     a: '#E0FBFC', b: '#0B132B', eye: '#00F5D4', acc: null,       cost: 100, unlock: '100奖章' },
    matrix:   { name: '虚拟像素',   a: '#B7E4C7', b: '#1B4332', eye: '#52FF52', acc: null,       cost: 100, unlock: '100奖章' },
    hula:     { name: '草裙吉他',   a: '#F2F2F0', b: '#26262E', eye: '#E60033', acc: 'hula',     cost: 80,  unlock: '吉他打卡7天' },
    ring:     { name: '泳圈度假',   a: '#F2F2F0', b: '#26262E', eye: '#E60033', acc: 'ring',     cost: 80,  unlock: '80奖章' },
    sombrero: { name: '西部牛仔',   a: '#F2F2F0', b: '#26262E', eye: '#E60033', acc: 'sombrero', cost: 80,  unlock: '80奖章' }
  };

  /* ---------- 半白半黑材质（局部x>0为B色） ---------- */
  function splitMaterial(a, b) {
    var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.05 });
    mat.onBeforeCompile = function (shader) {
      shader.uniforms.colA = { value: new THREE.Color(a) };
      shader.uniforms.colB = { value: new THREE.Color(b) };
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLp;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLp = position;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLp;\nuniform vec3 colA;\nuniform vec3 colB;')
        .replace('#include <color_fragment>', 'diffuseColor.rgb = (vLp.x > 0.0) ? colB : colA;');
    };
    return mat;
  }
  function plain(color, rough) {
    return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.6 : rough, metalness: 0.05 });
  }

  /* ---------- 建模 ---------- */
  function buildModel(skinId) {
    var skin = SKINS[skinId] || SKINS.classic;
    var fur = splitMaterial(skin.a, skin.b);
    var whiteM = plain(skin.a);
    var blackM = plain(skin.b);
    var darkM = plain('#141418', 0.5);
    var redEyeM = new THREE.MeshStandardMaterial({ color: skin.eye, emissive: skin.eye, emissiveIntensity: 0.85, roughness: 0.3 });
    var teethM = new THREE.MeshStandardMaterial({ color: '#F3EEDF', roughness: 0.62, metalness: 0 });
    var mouthM = plain('#3A0A14', 0.5);

    var root = new THREE.Group();      // 整体位移/旋转
    var bodyG = new THREE.Group();     // 呼吸 squash
    root.add(bodyG);
    var parts = {};

    /* 身体: 梨形 */
    var body = new THREE.Mesh(new THREE.SphereGeometry(0.92, 40, 32), fur);
    body.scale.set(0.98, 1.12, 0.9);
    body.position.y = 0.78;
    bodyG.add(body); parts.body = body;

    /* 白肚皮 + X扣 */
    var belly = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 24), whiteM);
    belly.scale.set(0.98, 1.06, 0.38);
    belly.position.set(0, 0.66, 0.62);
    bodyG.add(belly);
    var xb1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.04), darkM);
    var xb2 = xb1.clone();
    xb1.rotation.z = 0.65; xb2.rotation.z = -0.65;
    xb1.position.set(0, 0.66, 0.86); xb2.position.set(0, 0.66, 0.86);
    bodyG.add(xb1); bodyG.add(xb2);

    /* 头 */
    var headG = new THREE.Group();
    headG.position.y = 2.02;
    bodyG.add(headG); parts.headG = headG;
    var head = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 36), fur);
    head.scale.set(1, 0.96, 0.94);
    headG.add(head); parts.head = head;

    /* 耳朵: 左白右黑, 大而挺 */
    var earL = new THREE.Mesh(new THREE.SphereGeometry(0.40, 24, 18), whiteM);
    earL.position.set(-0.74, 1.00, 0.02); earL.scale.set(1, 1.05, 0.78);
    var earR = new THREE.Mesh(new THREE.SphereGeometry(0.40, 24, 18), blackM);
    earR.position.set(0.74, 1.00, 0.02); earR.scale.set(1, 1.05, 0.78);
    headG.add(earL); headG.add(earR);

    /* 左眼: 黑圆眼 */
    var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), darkM);
    eyeL.position.set(-0.38, 0.16, 0.92);
    headG.add(eyeL); parts.eyeL = eyeL;

    /* 右眼: 红色斜上挑(自定义楔形) */
    var eyeShape = new THREE.Shape();
    eyeShape.moveTo(-0.16, -0.05);
    eyeShape.lineTo(0.10, 0.05);
    eyeShape.lineTo(0.24, 0.16);
    eyeShape.lineTo(0.16, 0.20);
    eyeShape.lineTo(0.02, 0.12);
    eyeShape.lineTo(-0.14, 0.06);
    eyeShape.lineTo(-0.16, -0.05);
    var eyeR = new THREE.Mesh(new THREE.ExtrudeGeometry(eyeShape, { depth: 0.05, bevelEnabled: false }), redEyeM);
    eyeR.position.set(0.34, 0.16, 0.88);
    eyeR.rotation.x = -0.12; eyeR.rotation.y = 0.28;
    headG.add(eyeR); parts.eyeR = eyeR;

    /* 口鼻: 白色吻部 + 小黑鼻 */
    var muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), whiteM);
    muzzle.scale.set(1.12, 0.72, 0.6);
    muzzle.position.set(-0.02, -0.30, 0.84);
    headG.add(muzzle);
    var nose = new THREE.Mesh(new THREE.SphereGeometry(0.10, 16, 12), darkM);
    nose.scale.set(1.25, 0.8, 0.8);
    nose.position.set(-0.02, -0.14, 1.02);
    headG.add(nose);

    /* 咧嘴: 黑色半边大弧度排白牙 + 深色口腔底 */
    var grinG = new THREE.Group();
    grinG.position.set(0.40, -0.20, 0.82);
    grinG.rotation.y = 0.30;
    headG.add(grinG);
    var mouth = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 18), mouthM);
    mouth.scale.set(1.5, 0.62, 0.28);
    mouth.position.z = -0.02;
    grinG.add(mouth);
    for (var i = 0; i < 7; i++) {
      // 圆头胶囊牙 + 每颗轻微明度差/前后错落, 去塑料感
      var tg = new THREE.CapsuleGeometry(0.045, 0.09, 4, 12);
      tg.scale(1, 1, 0.55);
      var tm = teethM.clone();
      tm.color.multiplyScalar(0.94 + (i % 3) * 0.03);
      var t = new THREE.Mesh(tg, tm);
      var fx = (i - 3) * 0.088;
      // 弧线: 外侧上挑(坏笑), 锯齿交错
      var arc = Math.pow(Math.abs(i - 3) / 3, 1.6) * 0.13;
      t.position.set(fx, -0.02 + arc + (i % 2 ? 0.014 : -0.014), 0.11 - Math.pow(Math.abs(i - 3) / 3, 2) * 0.045);
      t.rotation.z = (i - 3) * -0.13;
      t.rotation.x = (i % 2 ? 0.06 : -0.04);
      grinG.add(t);
    }

    /* 手臂(肩 pivot) */
    function makeArm(side) { // side: -1左(白) +1右(黑)
      var g = new THREE.Group();
      g.position.set(side * 0.88, 1.34, 0.02);
      var m = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.30, 6, 16), side < 0 ? whiteM : blackM);
      m.position.y = -0.24;
      g.add(m);
      g.rotation.z = side * -0.28;
      bodyG.add(g);
      return g;
    }
    parts.armL = makeArm(-1);
    parts.armR = makeArm(1);

    /* 腿(髋 pivot) */
    function makeLeg(side) {
      var g = new THREE.Group();
      g.position.set(side * 0.36, 0.30, 0.02);
      var m = new THREE.Mesh(new THREE.CapsuleGeometry(0.235, 0.22, 6, 16), side < 0 ? whiteM : blackM);
      m.position.y = -0.16;
      g.add(m);
      bodyG.add(g);
      return g;
    }
    parts.legL = makeLeg(-1);
    parts.legR = makeLeg(1);

    /* 接触阴影 */
    var shadowTex = (function () {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var x = c.getContext('2d');
      var g = x.createRadialGradient(64, 64, 8, 64, 64, 62);
      g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    })();
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow); parts.shadow = shadow;

    /* 配件 */
    var accG = new THREE.Group();
    bodyG.add(accG);
    if (skin.acc === 'suit') {
      var tieShape = new THREE.Shape();
      tieShape.moveTo(-0.09, 0); tieShape.lineTo(0.09, 0);
      tieShape.lineTo(0.05, -0.42); tieShape.lineTo(0, -0.52); tieShape.lineTo(-0.05, -0.42);
      tieShape.lineTo(-0.09, 0);
      var tie = new THREE.Mesh(new THREE.ExtrudeGeometry(tieShape, { depth: 0.04, bevelEnabled: false }), plain('#D62828', 0.45));
      tie.position.set(0, 1.28, 0.80); tie.rotation.x = -0.10;
      accG.add(tie);
      var knot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.05), plain('#B91F31', 0.45));
      knot.position.set(0, 1.30, 0.82); knot.rotation.x = -0.10;
      accG.add(knot);
    } else if (skin.acc === 'hula') {
      var skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 1.00, 0.42, 32, 1, true), plain('#7FB069', 0.8));
      skirt.position.y = 0.62;
      accG.add(skirt);
      for (var fi = 0; fi < 5; fi++) {
        var petal = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), plain('#FF6B6B', 0.5));
        var ang = fi / 5 * Math.PI * 2;
        petal.position.set(-0.68 + Math.cos(ang) * 0.09, 1.18 + Math.sin(ang) * 0.09, 0.10);
        accG.add(petal);
      }
    } else if (skin.acc === 'ring') {
      var cols = ['#EF476F', '#FFFFFF'];
      for (var qi = 0; qi < 4; qi++) {
        var seg = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.17, 12, 20, Math.PI / 2), plain(cols[qi % 2], 0.55));
        seg.rotation.x = Math.PI / 2;
        seg.rotation.z = qi * Math.PI / 2;
        seg.position.y = 0.72;
        seg.rotation.order = 'ZXY';
        accG.add(seg);
      }
    } else if (skin.acc === 'sombrero') {
      var brim = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.06, 0.07, 32), plain('#C89F65', 0.75));
      brim.position.set(0, 2.92, 0); brim.rotation.z = 0.10;
      accG.add(brim);
      var crown = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.42, 0.42, 24), plain('#C89F65', 0.75));
      crown.position.set(0, 3.14, 0); crown.rotation.z = 0.10;
      accG.add(crown);
      var band = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.44, 0.10, 24), plain('#D62828', 0.6));
      band.position.set(0, 2.98, 0); band.rotation.z = 0.10;
      accG.add(band);
    }

    /* 干饭碗 */
    var bowlG = new THREE.Group();
    var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.20, 0.18, 20), plain('#8B5A2B', 0.6));
    var food = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), plain('#FFB3C6', 0.7));
    food.scale.y = 0.55; food.position.y = 0.10;
    bowlG.add(bowl); bowlG.add(food);
    bowlG.position.set(0, 0.18, 0.78);
    bowlG.visible = false;
    root.add(bowlG); parts.bowl = bowlG;

    /* 表情精灵(Zzz/爱心/怒) */
    function makeSprite(txt, color, size) {
      var c = document.createElement('canvas'); c.width = c.height = 128;
      var x = c.getContext('2d');
      x.font = 'bold 88px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = color; x.fillText(txt, 64, 70);
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      sp.scale.set(size, size, 1);
      sp.visible = false;
      root.add(sp);
      return sp;
    }
    parts.sprZzz = makeSprite('Z', '#FFD24D', 0.55);
    parts.sprHeart = makeSprite('♥', '#FF3E6C', 0.5);
    parts.sprAnger = makeSprite('💢', '#FF3E6C', 0.55);

    return { root: root, bodyG: bodyG, parts: parts, skin: skinId };
  }

  /* ---------- 姿态/动画 ---------- */
  function resetPose(p) {
    p.armL.rotation.set(0, 0, -0.28);
    p.armR.rotation.set(0, 0, 0.28);
    p.legL.rotation.set(0, 0, 0);
    p.legR.rotation.set(0, 0, 0);
    p.headG.rotation.set(0, 0, 0);
    p.eyeL.scale.set(1, 1, 1);
    p.eyeL.visible = true;
    p.bowl.visible = false;
    p.sprZzz.visible = p.sprHeart.visible = p.sprAnger.visible = false;
  }

  var blinkState = { t: 0 };
  function applyAnim(p, bodyG, name, t, dt) {
    resetPose(p);
    var s;
    switch (name) {
      case 'walk':
        s = Math.sin(t * 8);
        p.legL.rotation.x = s * 0.55;
        p.legR.rotation.x = -s * 0.55;
        p.armL.rotation.x = -s * 0.45;
        p.armR.rotation.x = s * 0.45;
        bodyG.position.y = Math.abs(Math.cos(t * 8)) * 0.05;
        bodyG.rotation.z = Math.sin(t * 8) * 0.045;
        break;
      case 'sit':
        p.legL.rotation.x = -1.35; p.legR.rotation.x = -1.35;
        bodyG.position.y = -0.24;
        p.armL.rotation.x = -0.35; p.armR.rotation.x = -0.35;
        break;
      case 'sleep':
        p.legL.rotation.x = -1.35; p.legR.rotation.x = -1.35;
        bodyG.position.y = -0.24;
        p.headG.rotation.z = 0.14;
        p.headG.rotation.x = 0.08;
        p.eyeL.visible = false;
        bodyG.scale.y = 1 + Math.sin(t * 1.6) * 0.02; // 熟睡呼吸
        p.sprZzz.visible = true;
        p.sprZzz.position.set(0.75, 2.9 + Math.sin(t * 1.6) * 0.1, 0.3);
        break;
      case 'happy':
        bodyG.position.y = Math.abs(Math.sin(t * 6)) * 0.28;
        p.armL.rotation.z = -2.45; p.armR.rotation.z = 2.45;
        p.eyeL.scale.set(1, 0.15, 1); // 笑眯眼
        p.headG.rotation.z = Math.sin(t * 6) * 0.05;
        break;
      case 'giggle':
        p.armL.rotation.x = -1.75; p.armR.rotation.z = -0.55;
        p.armR.rotation.x = -1.75; p.armR.rotation.z = 0.55;
        p.headG.rotation.z = 0.10 + Math.sin(t * 10) * 0.02;
        p.eyeL.scale.set(1, 0.15, 1);
        bodyG.rotation.z = Math.sin(t * 10) * 0.02;
        p.sprHeart.visible = true;
        p.sprHeart.position.set(0.72, 2.7 + Math.sin(t * 3) * 0.06, 0.3);
        break;
      case 'angry':
        bodyG.rotation.x = 0.10;
        p.armL.rotation.z = -1.05; p.armR.rotation.z = 1.05;
        p.headG.rotation.x = 0.14;
        p.sprAnger.visible = Math.sin(t * 6) > -0.4;
        p.sprAnger.position.set(0.78, 2.95, 0.3);
        break;
      case 'eat':
        p.legL.rotation.x = -1.35; p.legR.rotation.x = -1.35;
        bodyG.position.y = -0.24;
        p.headG.rotation.x = 0.18 + Math.max(0, Math.sin(t * 5)) * 0.14;
        p.armL.rotation.x = -0.55; p.armR.rotation.x = -0.55;
        p.bowl.visible = true;
        break;
      case 'back':
        bodyG.rotation.y = Math.PI;
        break;
      default: // idle
        bodyG.scale.y = 1 + Math.sin(t * 2) * 0.014; // 呼吸
        bodyG.rotation.y = Math.sin(t * 0.6) * 0.06;
        // 眨眼
        blinkState.t += dt;
        var cyc = blinkState.t % 3.4;
        if (cyc < 0.14) p.eyeL.scale.set(1, 0.1, 1);
    }
  }

  /* ---------- 舞台(活动画) ---------- */
  function createStage(canvas, skinGetter, opts) {
    opts = opts || {};
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    cam.position.set(0, opts.camY || 1.6, opts.camZ || 6.0);
    cam.lookAt(0, opts.lookY || 1.28, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2d38, 1.05));
    var key = new THREE.DirectionalLight(0xfff2dd, 1.6);
    key.position.set(2.5, 4, 3);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x8fb8ff, 0.7);
    rim.position.set(-2, 2.5, -3);
    scene.add(rim);

    var model = null, anim = 'idle', t = 0, last = 0, raf = null;
    function mount() {
      if (model) scene.remove(model.root);
      model = buildModel(skinGetter());
      scene.add(model.root);
    }
    function resize() {
      var w = canvas.clientWidth || 120, h = canvas.clientHeight || 120;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    mount(); resize();
    function loop(ts) {
      raf = requestAnimationFrame(loop);
      if (document.hidden) { last = 0; return; } // 息屏/切后台不渲染, 省电(华为平板)
      var now = ts / 1000;
      var dt = Math.min(0.05, now - (last || now));
      last = now; t += dt;
      applyAnim(model.parts, model.bodyG, anim, t, dt);
      renderer.render(scene, cam);
    }
    raf = requestAnimationFrame(loop);
    return {
      play: function (name) { anim = name || 'idle'; },
      current: function () { return anim; },
      redraw: function () { mount(); resize(); }, // 皮肤变化
      stop: function () { if (raf) cancelAnimationFrame(raf); raf = null; },
      resize: resize
    };
  }

  /* ---------- 静帧(Logo/皮肤缩略图), 共享离屏渲染器 ---------- */
  var stillR = null, stillScene = null, stillCam = null, stillModel = null, stillSkin = null;
  function ensureStill() {
    if (stillR) return;
    stillR = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    stillR.setSize(256, 256);
    stillScene = new THREE.Scene();
    stillCam = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    stillCam.position.set(0, 1.6, 6.0);
    stillCam.lookAt(0, 1.28, 0);
    stillScene.add(new THREE.HemisphereLight(0xffffff, 0x2a2d38, 1.05));
    var k = new THREE.DirectionalLight(0xfff2dd, 1.6); k.position.set(2.5, 4, 3); stillScene.add(k);
    var r = new THREE.DirectionalLight(0x8fb8ff, 0.7); r.position.set(-2, 2.5, -3); stillScene.add(r);
  }
  function draw(canvas, opts) {
    opts = opts || {};
    ensureStill();
    var skinId = opts.skin || 'classic';
    if (!stillModel || stillSkin !== skinId) {
      if (stillModel) stillScene.remove(stillModel.root);
      stillModel = buildModel(skinId);
      stillSkin = skinId;
      stillScene.add(stillModel.root);
    }
    var poseMap = { stand: 'idle', blink: 'idle', walkA: 'walk', walkB: 'walk', sit: 'sit', sleep: 'sleep', happy: 'happy', giggle: 'giggle', angry: 'angry', eat: 'eat', back: 'back' };
    blinkState.t = 2.0; // 静帧避开眨眼窗口
    applyAnim(stillModel.parts, stillModel.bodyG, poseMap[opts.frame] || 'idle', 0.5, 0);
    stillR.render(stillScene, stillCam);
    var size = Math.max(48, (opts.scale || 3) * 36);
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(stillR.domElement, 0, 0, size, size);
  }

  /* ---------- 兼容旧API ---------- */
  window.MonokumaPet = {
    draw: draw,
    createPlayer: function (canvas, skinGetter) {
      var stage = createStage(canvas, skinGetter, {});
      return {
        play: stage.play,
        current: stage.current,
        redraw: stage.redraw,
        stop: stage.stop
      };
    },
    SKINS: SKINS,
    FRAMES: {},
    ANIMS: { idle: 1, blink: 1, walk: 1, sit: 1, sleep: 1, happy: 1, giggle: 1, angry: 1, eat: 1, back: 1 }
  };
  window.Pet3D = { buildModel: buildModel, createStage: createStage, SKINS: SKINS };
})();
