/* ============================================================
 * 黑白熊像素引擎 — 参照《弹丸论破2》官方设定集 DOT PATTERN 手绘
 * 18×19 像素网格, canvas 渲染, 支持动作帧 / 皮肤(调色板+挂件) / 道具
 * 全局命名空间: MonokumaPet
 * v2: 全帧行宽统一18列; 贴纸风描边(深色底可见黑半边); 挂件支持负行(头顶)
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 调色板（皮肤） ---------- */
  var PALETTES = {
    classic: { W: '#F2F2F0', B: '#23252D', R: '#E60033', N: '#0B0B0D', X: '#0B0B0D', P: '#FF9EBB' },
    invert:  { W: '#23252D', B: '#F2F2F0', R: '#E60033', N: '#F2F2F0', X: '#F2F2F0', P: '#E60033' },
    gold:    { W: '#F7C948', B: '#2B2113', R: '#FF3E6C', N: '#1A1408', X: '#1A1408', P: '#FFE08A' },
    cyber:   { W: '#E0FBFC', B: '#0B132B', R: '#00F5D4', N: '#050914', X: '#050914', P: '#00F5D4' },
    matrix:  { W: '#B7E4C7', B: '#1B4332', R: '#52FF52', N: '#081C15', X: '#081C15', P: '#D8F3DC' }
  };
  var OUTLINE = '#FAF7F0'; // 贴纸风描边

  /* 挂件层固定色 */
  var PROPS_COLORS = {
    T: '#D62828', J: '#3A3F4A', G: '#7FB069', F: '#FF6B6B',
    Q: '#EF476F', H: '#C89F65', O: '#8B5A2B', M: '#FFB3C6',
    C: '#4CC9F0', Z: '#FFD24D'
  };
  var HEART_COLOR = '#FF3E6C';

  /* ---------- 基础帧（全部严格18列） ---------- */
  var STAND = [
    '..WWW........BBB..',
    '.WWWWWWWWBBBBBBBB.',
    '.WWWWWWWWBBBBBBBB.',
    '.WWWBWWWWBBRRRBBB.',
    '.WWWBWWWWBBRBRBBB.',
    '.WWWWWWWNBBBBBBBB.',
    '.WWWWWNNWBWWWWWBB.',
    '.WWWWWWWWBWBWBWBB.',
    '.WWWWWWWWBBBBBBBB.',
    '...WWWWWWBBBBB....',
    '..WWWWWWWBBBBBBB..',
    '..WWWWWWWWWWBBBB..',
    '..WWWWWWWWWWBBBB..',
    '..WWWWWWXXWWBBBB..',
    '..WWWWWWWWWWBBBB..',
    '..WWWWWWWWWWBBBB..',
    '...WWWWWWWWBBBB...',
    '...WWWWWWBBBBBB...',
    '...WWWW....BBBB...'
  ];

  function mod(frame, changes) {
    var f = frame.slice();
    for (var r in changes) f[r] = changes[r];
    return f;
  }

  var FRAMES = {
    stand: STAND,
    blink: mod(STAND, {
      3: '.WWWWWWWWBBRRRBBB.',
      4: '.WWWWWWWWBBRBRBBB.'
    }),
    walkA: mod(STAND, { 18: '..WWWW......BBBB..' }),
    walkB: mod(STAND, { 18: '....WWWW..BBBB....' }),
    sit: mod(STAND, {
      17: '..WWWWWWWWBBBBBB..',
      18: '..WWWWWWWWBBBBBB..'
    }),
    sleep: mod(STAND, {
      3: '.WWWWWWWWBBBBBBBB.',
      4: '.WWWWWWWWBBBBBBBB.',
      6: '.WWWWWWWWBBBBBBBB.',
      7: '.WWWWWWWWBBBBBBBB.',
      17: '..WWWWWWWWBBBBBB..',
      18: '..WWWWWWWWBBBBBB..'
    }),
    happy: mod(STAND, {
      3: '.WWWWWWWWBBRRRBBB.',
      4: '.WWWWWWWWBBRRRBBB.',
      6: '.WWWWNNNWBWWWWWWB.',
      7: '.WWWWNNNWBWBWBWBB.',
      8: 'WWWWWWWWWBBBBBBBBB',
      9: 'WWWWWWWWBBBBBBBB..'
    }),
    giggle: mod(STAND, {
      3: '.WWWWWWWWBBBBBBBB.',
      4: '.WWWWWWWWBBBBBBBB.',
      5: '.WPPWWWWWBBBBBBBB.',
      6: '.WWWWWNNWBBBBBBBB.',
      7: '.WWWWWWWWBBBBBBBB.',
      17: '..WWWWWWWWBBBBBB..',
      18: '..WWWWWWWWBBBBBB..'
    }),
    angry: mod(STAND, {
      2: '.WWBBWWWWBBBBBBBB.',
      3: '.WWWBWWWWBBRRRRBB.',
      4: '.WWWBWWWWBBRRRRBB.',
      6: '.WWWWWWWWBWWWWWBB.',
      7: '.WWWWWWWWBWBWBWBB.'
    }),
    eat: mod(STAND, {
      3: '.WWWWWWWWBBRRRBBB.',
      17: '..WWWWWWWWBBBBBB..',
      18: '..WWWWWWWWBBBBBB..'
    }),
    back: [
      '..WWW........BBB..',
      '.WWWWWWWWBBBBBBBB.',
      '.WWWWWWWWBBBBBBBB.',
      '.WWWWWWWWBBBBBBBB.',
      '.WWWWWWWWBBBBBBBB.',
      '.WWWWWWWWBBBBBBBB.',
      '.WWWWWWWWBBBBBBBB.',
      '.WWWWWWWWBBBBBBBB.',
      '.WWWWWWWWBBBBBBBB.',
      '...WWWWWWBBBBB....',
      '..WWWWWWWBBBBBBB..',
      '..WWWWWWWBBBBBBB..',
      '..WWWWWWWBBBBBBB..',
      '..WWWWWWWBBBBBBB..',
      '..WWWWWWWBBBBBBB..',
      '..WWWWWWWBBBBBBB..',
      '...WWWWWWBBBBBB...',
      '...WWWWWWBBBBBB...',
      '...WWWW....BBBB...'
    ]
  };

  /* ---------- 挂件层（行号可负=超出头顶） ---------- */
  var OVERLAYS = {
    suit: {
      9:  '........TT........',
      10: '...JJ...TT...JJ...',
      11: '...JJ...TT...JJ...',
      12: '...JJ...TT...JJ...',
      13: '...JJ...TT...JJ...',
      14: '...JJ...TT...JJ...',
      15: '...JJ....T...JJ...'
    },
    hula: {
      0:  '.FF...............',
      15: '..GGGGGGGGGGGGGG..',
      16: '..G.G.G.G.G.G.G.G.'
    },
    ring: {
      15: '.QQWWQQWWQQWWQQWW.',
      16: '.WQQWWQQWWQQWWQQW.'
    },
    sombrero: {
      '-3': '.....HHHHHHHH.....',
      '-2': '.....HHHHHHHH.....',
      '-1': 'HHHHHHHHHHHHHHHHHH'
    }
  };

  var SKINS = {
    classic:  { name: '经典校长',   palette: 'classic', overlay: null,       cost: 0,   unlock: '默认拥有' },
    suit:     { name: '西装校长',   palette: 'classic', overlay: 'suit',     cost: 50,  unlock: '羁绊Lv.2' },
    invert:   { name: '绝望反色',   palette: 'invert',  overlay: null,       cost: 50,  unlock: '50奖章' },
    gold:     { name: '黄金审判',   palette: 'gold',    overlay: null,       cost: 120, unlock: '羁绊Lv.4' },
    cyber:    { name: '赛博熊',     palette: 'cyber',   overlay: null,       cost: 100, unlock: '100奖章' },
    matrix:   { name: '虚拟像素',   palette: 'matrix',  overlay: null,       cost: 100, unlock: '100奖章' },
    hula:     { name: '草裙吉他',   palette: 'classic', overlay: 'hula',     cost: 80,  unlock: '吉他打卡7天' },
    ring:     { name: '泳圈度假',   palette: 'classic', overlay: 'ring',     cost: 80,  unlock: '80奖章' },
    sombrero: { name: '西部牛仔',   palette: 'classic', overlay: 'sombrero', cost: 80,  unlock: '80奖章' }
  };

  /* ---------- 小道具 ---------- */
  var PROPS = {
    bowl:  ['.MMMMMMMM.', 'OOOOOOOOOO', 'OOOOOOOOOO', '.OOOOOOOO.'],
    cup:   ['..CC..', '..CC..', '.CCCC.', '.CCCC.', '.CCCC.'],
    heart: ['.H.H.', 'HHHHH', 'HHHHH', '.HHH.', '..H..'],
    zzz:   ['ZZZ..', '..Z..', '.Z...', 'ZZZ..'],
    anger: ['R..R', '.RR.', '.RR.', 'R..R'],
    note:  ['..N..', '..N..', '..N..', '.NNN.', '.NNN.']
  };

  /* ---------- 内部工具 ---------- */
  function cellsOf(map, yOffset) {
    var set = {};
    for (var r = 0; r < map.length; r++) {
      var row = map[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (ch !== '.' && ch !== ' ') set[c + ',' + (r + (yOffset || 0))] = ch;
      }
    }
    return set;
  }

  function overlayCells(overlay) {
    var set = {};
    if (!overlay) return set;
    for (var r in overlay) {
      var ri = parseInt(r, 10), row = overlay[r];
      for (var c = 0; c < row.length; c++) {
        var ch = row[c];
        if (ch !== '.' && ch !== ' ') set[c + ',' + ri] = ch;
      }
    }
    return set;
  }

  /* 描边：对本体外轮廓+挂件外轮廓画一圈 OUTLINE */
  function drawOutline(ctx, bodyCells, extraCells, scale, oy) {
    var all = {}, k;
    for (k in bodyCells) all[k] = 1;
    for (k in extraCells) all[k] = 1;
    ctx.fillStyle = OUTLINE;
    var D = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
    for (k in all) {
      var parts = k.split(','), c = +parts[0], r = +parts[1];
      for (var i = 0; i < 8; i++) {
        var nc = c + D[i][0], nr = r + D[i][1];
        if (!all[nc + ',' + nr]) {
          ctx.fillRect(nc * scale, (nr + oy) * scale, scale, scale);
        }
      }
    }
  }

  function paintCells(ctx, cells, colors, scale, oy) {
    for (var k in cells) {
      var parts = k.split(','), c = +parts[0], r = +parts[1];
      var col = colors[cells[k]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(c * scale, (r + oy) * scale, scale, scale);
    }
  }

  function drawProp(ctx, name, scale, ox, oy) {
    var map = PROPS[name];
    if (!map) return;
    for (var r = 0; r < map.length; r++) {
      for (var c = 0; c < map[r].length; c++) {
        var ch = map[r][c];
        if (ch === '.' || ch === ' ') continue;
        ctx.fillStyle = (name === 'heart') ? HEART_COLOR : (PROPS_COLORS[ch] || '#fff');
        ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
      }
    }
  }

  /* 挂件最低行（负数→需要头部空间） */
  function minOverlayRow(overlay) {
    var m = 0;
    if (overlay) for (var r in overlay) m = Math.min(m, parseInt(r, 10));
    return m;
  }

  /**
   * 画一只黑白熊（含贴纸描边）
   * opts: { frame, skin, scale, props:[{name,dx,dy}], noOutline }
   */
  function draw(canvas, opts) {
    opts = opts || {};
    var frame = FRAMES[opts.frame || 'stand'] || FRAMES.stand;
    var skin = SKINS[opts.skin || 'classic'] || SKINS.classic;
    var palette = PALETTES[skin.palette];
    var overlay = OVERLAYS[skin.overlay];
    var scale = opts.scale || 4;
    var topPad = -Math.min(0, minOverlayRow(overlay)); // 头顶空间
    var w = 18 * scale, h = (19 + topPad) * scale;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    var bodyCells = cellsOf(frame, 0);
    var ovCells = overlayCells(overlay);
    if (!opts.noOutline) drawOutline(ctx, bodyCells, ovCells, scale, topPad);
    paintCells(ctx, bodyCells, palette, scale, topPad);
    paintCells(ctx, ovCells, PROPS_COLORS, scale, topPad);
    if (opts.props) {
      opts.props.forEach(function (p) {
        drawProp(ctx, p.name, scale, (p.dx || 0) * scale, (p.dy + topPad || 0) * scale);
      });
    }
  }

  /* ---------- 动画 ---------- */
  var ANIMS = {
    idle:   { frames: ['stand'], ms: 400 },
    blink:  { frames: ['stand', 'blink', 'stand'], ms: 160 },
    walk:   { frames: ['walkA', 'walkB'], ms: 220 },
    sit:    { frames: ['sit'], ms: 400 },
    sleep:  { frames: ['sleep'], ms: 600 },
    happy:  { frames: ['happy', 'stand', 'happy'], ms: 200 },
    giggle: { frames: ['giggle'], ms: 300 },
    angry:  { frames: ['angry', 'stand'], ms: 260 },
    eat:    { frames: ['eat', 'sit'], ms: 240 },
    back:   { frames: ['back'], ms: 400 }
  };

  function createPlayer(canvas, skinGetter) {
    var timer = null, idx = 0, current = 'idle';
    function canvasScale() { return parseInt(canvas.getAttribute('data-scale') || '4', 10); }
    function renderFrame() {
      var anim = ANIMS[current] || ANIMS.idle;
      var frame = anim.frames[idx % anim.frames.length];
      var props = null;
      if (current === 'sleep' && idx % 2 === 1) props = [{ name: 'zzz', dx: 13, dy: -2 }];
      if (current === 'eat') props = [{ name: 'bowl', dx: 4, dy: 16 }];
      if (current === 'angry' && idx % 2 === 0) props = [{ name: 'anger', dx: 14, dy: -1 }];
      if (current === 'giggle') props = [{ name: 'heart', dx: 13, dy: 0 }];
      draw(canvas, { frame: frame, skin: skinGetter(), scale: canvasScale(), props: props });
    }
    return {
      play: function (name) {
        if (!ANIMS[name]) name = 'idle';
        if (timer) { clearInterval(timer); timer = null; }
        current = name; idx = 0;
        renderFrame();
        var anim = ANIMS[current];
        if (anim.frames.length > 1 || name === 'sleep' || name === 'angry' || name === 'eat') {
          timer = setInterval(function () { idx++; renderFrame(); }, anim.ms);
        }
      },
      redraw: renderFrame,
      stop: function () { if (timer) { clearInterval(timer); timer = null; } },
      current: function () { return current; }
    };
  }

  window.MonokumaPet = {
    draw: draw,
    createPlayer: createPlayer,
    SKINS: SKINS,
    FRAMES: FRAMES,
    ANIMS: ANIMS
  };
})();
