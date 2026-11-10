// 页面层：路由、状态与各阶互动。经文在 DATA，演算在 Yi。
(function () {
'use strict';
var HEX = DATA.simp, TRAD = DATA.trad, FU = DATA.fu;
Yi.init(HEX, DATA.lunar);
var $ = function (s, e) { return (e || document).querySelector(s); };
var $$ = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var view = $('#view');
var POS = ['初', '二', '三', '四', '五', '上'];
var LEVELS = [
  { id: 'l1', tag: '初', nm: '符号', desc: '阴阳 → 八卦', yang: 1 }, { id: 'l2', tag: '二', nm: '成卦', desc: '两卦叠成六十四', yang: 0 },
  { id: 'l3', tag: '三', nm: '爻位', desc: '一眼看出好坏', yang: 1 }, { id: 'l4', tag: '四', nm: '读辞', desc: '吉凶词与规律', yang: 0 },
  { id: 'l5', tag: '五', nm: '起卦', desc: '蓍草 · 铜钱 · 数字', yang: 1 }, { id: 'l6', tag: '上', nm: '解卦', desc: '变爻与真实案例', yang: 0 }
];
var ADV = [{ id: 'mh', tag: '梅', nm: '梅花易数' }, { id: 'nj', tag: '纳', nm: '纳甲六爻' }, { id: 'tui', tag: '推', nm: '六爻推演' }];
var TOOLS = [{ id: 'dict', tag: '典', nm: '卦典与课程' }, { id: 'drill', tag: '练', nm: '记忆练习' }];
var DEMO = { values: [7, 9, 8, 8, 7, 8], q: '这辆车可以买吗？（示例：傅佩荣讲过的节卦九二）', method: '数字卦', demo: true, t: [2026, 11, 9, 10] };

// ---- 状态：登录时存账号（跨设备），否则存本机 ----
var S = { learned: {}, notes: {}, box: {}, cast: null, history: [], levels: {}, updatedAt: 0 };
var dbRef = null, saveTimer = null;
function save() {
  S.updatedAt = Date.now();
  try { localStorage.setItem('yijing', JSON.stringify(S)); } catch (e) { }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () { if (dbRef) dbRef.set(JSON.parse(JSON.stringify(S))).catch(function () { }); }, 1200);
}
try { var raw = localStorage.getItem('yijing'); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) { }
function connectStore() {
  if (!window.claude || !claude.use) return;
  Promise.all([claude.use('db'), claude.use('user')]).then(function (r) {
    var db = r[0], user = r[1];
    if (!db || !user || !user.id) return;
    return user.id().then(function (id) {
      if (!id) return;
      dbRef = db.collection('data/users/' + id).doc('progress');
      return dbRef.get().then(function (snap) {
        if (snap.exists && (snap.data().updatedAt || 0) > S.updatedAt) { S = Object.assign(S, snap.data()); route(); }
        else if (S.updatedAt) dbRef.set(JSON.parse(JSON.stringify(S))).catch(function () { });
      });
    });
  }).catch(function () { });
}
function cast() { return S.cast || DEMO; }

// ---- 图形部件 ----
function gua(bits, o) {
  o = o || {};
  var s = '';
  for (var i = 0; i < 6; i++) s += lineHTML(bits[i], i, o);
  return '<div class="gua ' + (o.size || '') + ' ' + (o.cls || '') + '">' + s + '</div>';
}
function lineHTML(b, i, o) {
  var c = 'ln ' + (b === '1' ? 'yang' : 'yin');
  if (o.moving && o.moving.indexOf(i) >= 0) c += ' mv';
  if (o.hot && o.hot.indexOf(i) >= 0) c += ' hot';
  if (o.dim && o.dim.indexOf(i) >= 0) c += ' dim';
  var inner = '<i></i><u></u><i></i>';
  if (o.btn) return '<button class="' + c + '" data-i="' + i + '" aria-label="切换' + POS[i] + '爻">' + inner + '</button>';
  return '<div class="' + c + '">' + inner + '</div>';
}
function tri(bits, o) {
  o = o || {}; var s = '';
  for (var i = 0; i < 3; i++) s += lineHTML(bits[i], i, o);
  return '<div class="gua ' + (o.size || '') + '">' + s + '</div>';
}
function label(i, yang) { var y = yang ? '九' : '六'; return i === 0 || i === 5 ? POS[i] + y : y + POS[i]; }
function hexName(b) { return Yi.fullName(b); }
function head(title, sub) { return '<div class="bhead"><h2>' + title + '</h2>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>'; }
function finishBtn(id) { var d = S.levels[id]; return '<div class="row"><button class="btn ' + (d ? 'ghost' : '') + '" data-finish="' + id + '">' + (d ? '已学完，再复习' : '这一阶学完了') + '</button></div>'; }
function bindFinish() { $$('[data-finish]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-finish'); S.levels[id] = !S.levels[id]; save(); route(); }; }); }

// ---- 总览 ----
var views = {};
views.home = function () {
  var d = new Date(), seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  var today = HEX[seed % 64], g = GLOSS[today.kw - 1];
  var done = Object.keys(S.learned).length, boxes = Object.keys(S.box).length;
  var next = LEVELS.filter(function (l) { return !S.levels[l.id]; })[0] || LEVELS[5];
  var bars = LEVELS.slice().reverse().map(function (l) {
    return '<a class="pathln ' + (l.yang ? '' : 'yin') + '" href="#' + l.id + '"><b>' + l.tag + '</b><span class="bar"><em>' + l.nm + ' · ' + l.desc + '</em></span></a>';
  }).join('');
  view.innerHTML = '<section class="hero"><div class="pathgua">' + bars + '</div><div class="block"><h1>从一根线，学到排出一盘卦</h1>' +
    '<p class="lede">六阶由下往上走，就像一卦六爻。每一阶先动手，再记结论。跟着傅佩荣的《易经详解》听课时，到卦典查当集要点。</p>' +
    '<div class="row"><a class="btn" href="#' + next.id + '" style="text-decoration:none">继续：' + next.nm + '</a><a class="btn ghost" href="#l5" style="text-decoration:none">直接起一卦</a></div>' +
    '<div class="row small"><span>' + done + ' / 64 卦已学</span><span>' + boxes + ' 张卡片在练</span><span>' + Object.keys(S.levels).filter(function (k) { return S.levels[k]; }).length + ' / 6 阶完成</span></div></div></section>' +
    '<section class="block">' + head('今日一卦', '换一天换一卦，点开看全文') + '<a class="surface row" href="#dict" data-kw="' + today.kw + '" style="text-decoration:none;color:inherit">' + gua(today.bits, { size: 'mid' }) + '<div><div class="big">' + hexName(today.bits) + '</div><div>' + g[0] + '</div></div><div class="quote" style="flex:1;min-width:220px">' + today.judgment + '</div></a></section>' +
    '<section class="block">' + head('能力地图', '学到哪一步，就能做到什么') + '<div class="chain">' +
    [['认', '看图说出八卦和卦名'], ['判', '判断当位、得中、正应'], ['算', '用蓍草、铜钱、数字起卦'], ['解', '按规则找到该读的那句话']].map(function (x, i) { return '<div class="cnode" style="animation-delay:' + i * 90 + 'ms"><b>' + x[0] + '</b><span class="small">' + x[1] + '</span></div>'; }).join('') + '</div></section>';
  $('a[data-kw]').onclick = function () { dictSel = today.kw; };
};

// ---- 初：符号 ----
var TRI_INFO = {
  乾: { xing: '健', body: '首', fam: '父', ani: '马', xian: '南', hou: '西北' }, 坤: { xing: '顺', body: '腹', fam: '母', ani: '牛', xian: '北', hou: '西南' },
  震: { xing: '动', body: '足', fam: '长男', ani: '龙', xian: '东北', hou: '东' }, 巽: { xing: '入', body: '股', fam: '长女', ani: '鸡', xian: '西南', hou: '东南' },
  坎: { xing: '陷', body: '耳', fam: '中男', ani: '豕', xian: '西', hou: '北' }, 离: { xing: '丽', body: '目', fam: '中女', ani: '雉', xian: '东', hou: '南' },
  艮: { xing: '止', body: '手', fam: '少男', ani: '狗', xian: '西北', hou: '东北' }, 兑: { xing: '说', body: '口', fam: '少女', ani: '羊', xian: '东南', hou: '西' }
};
var KOUJUE = [['乾', '乾三连'], ['坤', '坤六断'], ['震', '震仰盂'], ['艮', '艮覆碗'], ['离', '离中虚'], ['坎', '坎中满'], ['兑', '兑上缺'], ['巽', '巽下断']];
function scene(t) {
  var c = 'var(--accent)', m = 'var(--move)';
  var s = {
    乾: '<circle cx="200" cy="74" r="30" fill="' + m + '" style="animation:pulse 3s infinite"/><circle cx="200" cy="74" r="56" fill="none" stroke="' + m + '" stroke-width="2" style="transform-origin:200px 74px;animation:ripple 3s infinite"/>',
    坤: '<path d="M0 118 Q100 96 200 116 T400 110 V150 H0Z" fill="' + c + '"/><path d="M0 92 Q120 76 240 96 T400 88 V150 H0Z" fill="' + c + '" opacity=".45"/>',
    震: '<path d="M214 8 L168 80 H200 L180 142 L242 62 H208 L232 8Z" fill="' + m + '" style="animation:flash 2.6s infinite"/>',
    巽: [38, 74, 110].map(function (y, i) { return '<path d="M-30 ' + y + ' q50 -28 100 0 t100 0 t100 0 t100 0 t100 0" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round" style="animation:float ' + (2 + i * .6) + 's ease-in-out infinite"/>'; }).join(''),
    坎: [52, 84, 116].map(function (y, i) { return '<path d="M-48 ' + y + ' q24 -20 48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0" fill="none" stroke="' + c + '" stroke-width="5" style="animation:float ' + (1.5 + i * .5) + 's ease-in-out infinite"/>'; }).join(''),
    离: '<path d="M200 18 C232 62 254 76 240 112 A44 44 0 0 1 160 112 C148 84 184 70 200 18Z" fill="' + m + '" style="transform-origin:200px 136px;animation:flick .9s ease-in-out infinite"/>',
    艮: '<path d="M30 150 L134 38 L204 112 L262 58 L370 150Z" fill="' + c + '"/><path d="M134 38 L112 62 L136 76 L156 62Z" fill="var(--paper)"/>',
    兑: '<ellipse cx="200" cy="98" rx="150" ry="32" fill="' + c + '" opacity=".55"/><ellipse cx="200" cy="98" rx="90" ry="19" fill="none" stroke="var(--paper)" stroke-width="2" style="transform-origin:200px 98px;animation:ripple 2.8s infinite"/>'
  };
  return '<svg class="scene" viewBox="0 0 400 150" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + Yi.IMG[t] + '">' + s[t] + '</svg>';
}
var ringMode = 'xian', ringSel = '乾';
function ringPos(t, mode) {
  var dir = { 南: 0, 东南: 1, 东: 2, 东北: 3, 北: 4, 西北: 5, 西: 6, 西南: 7 };
  var a = dir[TRI_INFO[t][mode]] * Math.PI / 4;
  return [180 + 132 * Math.sin(a), 180 - 132 * Math.cos(a)];
}
function ringSvg() {
  var nodes = Yi.TRI.map(function (t, n) {
    var p = ringPos(t, ringMode), bits = Yi.TB[t], r = '';
    for (var i = 0; i < 3; i++) {
      var y = 18 - i * 11;
      r += bits[i] === '1' ? '<rect x="-22" y="' + y + '" width="44" height="7" rx="1"/>' : '<rect x="-22" y="' + y + '" width="18" height="7" rx="1"/><rect x="4" y="' + y + '" width="18" height="7" rx="1"/>';
    }
    return '<g class="ring-node ' + (ringSel === t ? 'sel' : '') + '" data-t="' + t + '" style="transform:translate(' + p[0] + 'px,' + p[1] + 'px)">' + r + '<text y="-10">' + t + '</text><text class="n" x="33" y="12">' + (n + 1) + '</text></g>';
  }).join('');
  return '<svg viewBox="0 0 360 360" style="width:100%;max-width:360px;display:block;margin:auto" role="img" aria-label="八卦方位图"><circle cx="180" cy="180" r="96" fill="none" stroke="var(--line)" stroke-dasharray="3 6"/>' +
    '<text x="180" y="186" text-anchor="middle" style="font:900 22px var(--serif);fill:var(--muted)">' + (ringMode === 'xian' ? '先天' : '后天') + '</text>' + nodes + '</svg>';
}
var treeN = 3;
function treeHTML(n, hl) {
  var names = ['', '两仪', '四象', '八卦', '十六', '三十二', '六十四卦'], rows = '';
  for (var k = 1; k <= n; k++) {
    var cells = '', cols = Math.pow(2, n);
    for (var i = 0; i < cols; i++) {
      var yang = Math.floor(i / Math.pow(2, n - k)) % 2 === 0;
      cells += '<span class="' + (yang ? '' : 'y') + (hl === i ? ' hl' : '') + '" data-c="' + i + '"></span>';
    }
    rows += '<div class="tr" style="animation-delay:' + (k - 1) * 60 + 'ms">' + cells + '</div>';
  }
  return '<div class="row small" style="justify-content:space-between"><span>左阳右阴，每层一分为二</span><b style="font:900 20px var(--serif);color:var(--ink)">' + Math.pow(2, n) + ' · ' + names[n] + '</b></div><div class="tree">' + rows + '</div>';
}
views.l1 = function () {
  view.innerHTML = '<section class="block"><h1>初阶 · 符号</h1><p class="lede">所有卦都由两种线组成。先把八卦玩熟。</p></section>' +
    '<section class="block">' + head('一分为二', '拖动滑块，看符号如何长出来') + '<div class="surface block"><input id="tn" type="range" min="1" max="6" value="' + treeN + '" aria-label="分裂层数"><div id="tree"></div><div class="small" id="treehint">把鼠标移到色块上，看这一列是哪一卦</div></div></section>' +
    '<section class="block">' + head('八卦实验室', '点三根线，让它变成自然的样子') + '<div class="surface split"><div class="row" style="justify-content:center;gap:28px"><div id="trilab"></div><div><div class="big" id="triname"></div><div class="small" id="trikou"></div></div></div><div class="block"><div id="triscene"></div><div class="chips" id="trichips"></div></div></div></section>' +
    '<section class="block">' + head('八卦环', '先天看数，后天看方位') + '<div class="surface split"><div id="ring"></div><div class="block"><div class="chips"><button class="chip" data-r="xian">先天八卦</button><button class="chip" data-r="hou">后天八卦</button></div><div class="big" id="rname"></div><div id="rdesc"></div><div class="small">先天数 1 乾、2 兑、3 离、4 震、5 巽、6 坎、7 艮、8 坤，是傅佩荣数字卦的基础，对角相加都是 9。</div></div></div></section>' +
    '<section class="block">' + head('口诀翻牌', '先想，再点开') + '<div class="cases">' + KOUJUE.map(function (k) { return '<button class="case" data-k="' + k[0] + '"><b style="font:900 18px var(--serif)">' + k[1] + '</b><div class="reveal-tri" hidden>' + tri(Yi.TB[k[0]], { size: 'mid' }) + '<span class="small">' + k[0] + ' · ' + Yi.IMG[k[0]] + '</span></div></button>'; }).join('') + '</div></section>' + finishBtn('l1');
  // 横图
  var tn = $('#tn');
  function drawTree() {
    $('#tree').innerHTML = treeHTML(treeN, null);
    $('#tree .tree').onmousemove = function (e) {
      var c = e.target.getAttribute && e.target.getAttribute('data-c'); if (c == null) return;
      c = +c; var bits = '';
      for (var k = 1; k <= treeN; k++) bits += Math.floor(c / Math.pow(2, treeN - k)) % 2 === 0 ? '1' : '0';
      var hint = treeN === 6 ? hexName(bits) : treeN === 3 ? Yi.BT[bits] + ' · ' + Yi.IMG[Yi.BT[bits]] : '第 ' + (c + 1) + ' 列';
      $('#treehint').textContent = hint + (treeN >= 3 ? '　从下往上读这一列' : '');
      $$('#tree .hl').forEach(function (x) { x.classList.remove('hl'); });
      $$('#tree .tr').forEach(function (r) { r.children[c].classList.add('hl'); });
    };
  }
  tn.oninput = function () { treeN = +tn.value; drawTree(); };
  drawTree();
  // 实验室
  var lab = '111';
  function drawLab() {
    $('#trilab').innerHTML = tri(lab, { size: 'lg', btn: true });
    var t = Yi.BT[lab], i = TRI_INFO[t], ko = KOUJUE.filter(function (k) { return k[0] === t; })[0][1];
    $('#triname').textContent = t + ' · ' + Yi.IMG[t]; $('#trikou').textContent = ko;
    $('#triscene').innerHTML = scene(t);
    $('#trichips').innerHTML = [['性', i.xing], ['身', i.body], ['家', i.fam], ['物', i.ani], ['五行', Yi.GONG_WX[t]]].map(function (x) { return '<span class="chip">' + x[0] + ' <b>' + x[1] + '</b></span>'; }).join('');
    $$('#trilab .ln').forEach(function (b) { b.onclick = function () { var a = lab.split(''), n = +b.getAttribute('data-i'); a[n] = a[n] === '1' ? '0' : '1'; lab = a.join(''); drawLab(); }; });
  }
  drawLab();
  // 环
  function drawRing() {
    $('#ring').innerHTML = ringSvg();
    $$('#ring .ring-node').forEach(function (g) { g.onclick = function () { ringSel = g.getAttribute('data-t'); updRing(); }; });
    updRing();
  }
  function updRing() {
    var i = TRI_INFO[ringSel], n = Yi.TRI.indexOf(ringSel) + 1;
    $$('#ring .ring-node').forEach(function (g) { var t = g.getAttribute('data-t'), p = ringPos(t, ringMode); g.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)'; g.classList.toggle('sel', t === ringSel); });
    $('#rname').textContent = ringSel + ' · ' + Yi.IMG[ringSel];
    $('#rdesc').innerHTML = '<div class="chips"><span class="chip">先天数 <b>' + n + '</b></span><span class="chip">先天方位 <b>' + i.xian + '</b></span><span class="chip">后天方位 <b>' + i.hou + '</b></span></div>';
    $$('[data-r]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-r') === ringMode); });
    var tt = $('#ring svg text'); if (tt) tt.textContent = ringMode === 'xian' ? '先天' : '后天';
  }
  $$('[data-r]').forEach(function (b) { b.onclick = function () { ringMode = b.getAttribute('data-r'); updRing(); }; });
  drawRing();
  $$('[data-k]').forEach(function (b) { b.onclick = function () { var r = $('.reveal-tri', b); r.hidden = !r.hidden; if (!r.hidden) { r.style.display = 'flex'; r.style.gap = '10px'; r.style.alignItems = 'center'; } }; });
  bindFinish();
};

// ---- 二：成卦 ----
var buildL = '乾', buildU = '坤', matrixMode = 'none';
function matrixHTML(sel, mode) {
  var head1 = '<span></span>' + Yi.TRI.map(function (t) { return '<span class="ax">' + t + '</span>'; }).join('');
  var body = Yi.TRI.map(function (lo) {
    return '<span class="ax">' + lo + '</span>' + Yi.TRI.map(function (up) {
      var b = Yi.TB[lo] + Yi.TB[up], h = Yi.hex(b), hl = '';
      if (mode === 'up' && h.kw <= 30) hl = 'hl'; if (mode === 'down' && h.kw > 30) hl = 'hl';
      if (mode === 'pure' && lo === up) hl = 'hl'; if (mode === 'xi' && Yi.XIAOXI.indexOf(b) >= 0) hl = 'hl';
      if (mode === 'pal' && Yi.palaceMap[b].palace === Yi.palaceMap[sel].palace) hl = 'hl';
      return '<button class="cell ' + hl + (b === sel ? ' sel' : '') + '" data-b="' + b + '" title="' + h.kw + ' ' + hexName(b) + '">' + gua(b, { size: 'mini' }) + '</button>';
    }).join('');
  }).join('');
  return '<div class="matrix">' + head1 + body + '</div>';
}
function ringOrder(sel) {
  var pts = HEX.map(function (h, i) { var a = i / 64 * 2 * Math.PI - Math.PI / 2; return [180 + 158 * Math.cos(a), 180 + 158 * Math.sin(a)]; }), lines = '';
  for (var i = 0; i < 64; i += 2) {
    var fan = Yi.zong(HEX[i].bits) === HEX[i + 1].bits;
    lines += '<line x1="' + pts[i][0] + '" y1="' + pts[i][1] + '" x2="' + pts[i + 1][0] + '" y2="' + pts[i + 1][1] + '" stroke="' + (fan ? 'var(--accent)' : 'var(--move)') + '" stroke-width="' + (HEX[i].bits === sel || HEX[i + 1].bits === sel ? 5 : 2.5) + '"/>';
  }
  var dots = HEX.map(function (h, i) { return '<circle class="seqd" data-b="' + h.bits + '" cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="' + (h.bits === sel ? 8 : 4.5) + '" fill="' + (h.bits === sel ? 'var(--accent)' : (i < 30 ? 'var(--ink)' : 'var(--muted)')) + '" style="cursor:pointer"><title>' + (i + 1) + ' ' + h.name + '</title></circle>'; }).join('');
  return '<svg viewBox="0 0 360 360" style="width:100%;max-width:340px;display:block;margin:auto" role="img" aria-label="六十四卦序环">' + lines + dots + '</svg>';
}
views.l2 = function () {
  view.innerHTML = '<section class="block"><h1>二阶 · 成卦</h1><p class="lede">下卦是自己和内部，上卦是外面的环境。两卦一叠，就成一种处境。</p></section>' +
    '<section class="block">' + head('叠卦机', '选上下两卦，看它合成') + '<div class="surface split"><div class="block"><div class="small">上卦 · 外</div><div class="chips" id="pu"></div><div class="small">下卦 · 内</div><div class="chips" id="pl"></div></div><div class="row" style="justify-content:center;gap:24px"><div id="bg"></div><div><div class="big" id="bn"></div><div class="small" id="bk"></div><div id="bgl" style="max-width:220px"></div><a class="btn ghost" href="#dict" id="bl" style="display:inline-block;margin-top:8px;text-decoration:none">看全文</a></div></div></div></section>' +
    '<section class="block">' + head('一卦四面', '傅佩荣说“非覆即变”，点开动画') + '<div class="relgrid" id="rels"></div></section>' +
    '<section class="block">' + head('六十四卦矩阵', '行是下卦，列是上卦') + '<div class="surface block"><div class="chips" id="mm">' + [['none', '不标记'], ['up', '上经 30 卦'], ['down', '下经 34 卦'], ['pure', '八纯卦'], ['xi', '十二消息'], ['pal', '同宫八卦']].map(function (x) { return '<button class="chip" data-m="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><div id="matrix"></div></div></section>' +
    '<section class="block">' + head('卦序一圈', '蓝线翻转成对（覆），黄线全变成对（变）') + '<div class="surface split"><div id="seq"></div><div class="block"><div class="big" id="seqn"></div><div id="seqd" class="small"></div></div></div></section>' + finishBtn('l2');
  function cur() { return Yi.TB[buildL] + Yi.TB[buildU]; }
  function pick(id, val, setter) {
    $(id).innerHTML = Yi.TRI.map(function (t) { return '<button class="chip ' + (t === val ? 'on' : '') + '" data-t="' + t + '">' + t + ' ' + Yi.IMG[t] + '</button>'; }).join('');
    $$(id + ' [data-t]').forEach(function (b) { b.onclick = function () { setter(b.getAttribute('data-t')); draw(); }; });
  }
  function selectBits(b) { buildL = Yi.lower(b); buildU = Yi.upper(b); draw(); }
  function draw() {
    var b = cur(), h = Yi.hex(b);
    pick('#pu', buildU, function (v) { buildU = v; }); pick('#pl', buildL, function (v) { buildL = v; });
    $('#bg').innerHTML = gua(b, { size: 'lg', cls: 'gap-mid' });
    var ln = $('#bg .gua'); ln.style.setProperty('--split', '26px'); requestAnimationFrame(function () { ln.style.setProperty('--split', '0px'); });
    $('#bn').textContent = hexName(b); $('#bk').textContent = '第 ' + h.kw + ' 卦';
    $('#bgl').textContent = GLOSS[h.kw - 1][0];
    $('#bl').onclick = function () { dictSel = h.kw; };
    var rel = [['变卦', '六爻全变，又叫错卦', Yi.cuo(b), 'flipc'], ['覆卦', '上下翻转，又叫综卦', Yi.zong(b), 'spin'], ['互卦', '取中间四爻重组', Yi.hu(b), 'flipc']];
    $('#rels').innerHTML = '<div class="rel">' + gua(b, { size: 'mid' }) + '<b>' + h.name + '</b><span class="small">本卦</span></div>' + rel.map(function (r) { return '<button class="rel" data-b="' + r[2] + '" data-a="' + r[3] + '">' + gua(r[2], { size: 'mid' }) + '<b>' + Yi.hex(r[2]).name + '</b><span class="small">' + r[0] + ' · ' + r[1] + '</span></button>'; }).join('');
    $$('#rels button').forEach(function (x) { x.onmouseenter = function () { x.classList.remove(x.getAttribute('data-a')); void x.offsetWidth; x.classList.add(x.getAttribute('data-a')); }; x.onclick = function () { selectBits(x.getAttribute('data-b')); }; });
    $('#matrix').innerHTML = matrixHTML(b, matrixMode);
    $$('#matrix .cell').forEach(function (c) { c.onclick = function () { selectBits(c.getAttribute('data-b')); }; });
    $$('[data-m]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-m') === matrixMode); });
    $('#seq').innerHTML = ringOrder(b);
    $$('#seq .seqd').forEach(function (c) { c.onclick = function () { selectBits(c.getAttribute('data-b')); }; });
    var i = h.kw - 1, partner = HEX[i % 2 ? i - 1 : i + 1], fan = Yi.zong(h.bits) === partner.bits;
    $('#seqn').textContent = h.name + ' ⇄ ' + partner.name;
    $('#seqd').textContent = (fan ? '翻转成对' : '全变成对') + '。记住一卦，另一卦就顺带记住了。';
  }
  $$('[data-m]').forEach(function (x) { x.onclick = function () { matrixMode = x.getAttribute('data-m'); draw(); }; });
  draw(); bindFinish();
};

// ---- 三：爻位 ----
var boardBits = '100010', boardLayer = 'dang';
function fuZhu(b) { var n = FU_NOTES[Yi.hex(b).kw]; return n && n.zhu != null ? n.zhu : Yi.rareLine(b); }
views.l3 = function () {
  var layers = [['dang', '当位'], ['zhong', '得中'], ['ying', '正应'], ['cheng', '乘与承'], ['zhu', '主爻']];
  var notes = { dang: '阳爻在初、三、五，阴爻在二、四、上，就是当位。', zhong: '二、五在上下卦的中间。傅佩荣常说“中胜于正”。', ying: '初与四、二与五、三与上，一阴一阳才相应。', cheng: '阴爻骑在阳爻上叫乘刚（不妙），在阳爻下托着叫承（顺）。', zhu: '六爻中只有一个不同的爻最关键；其余要看彖传或讲稿。' };
  view.innerHTML = '<section class="block"><h1>三阶 · 爻位</h1><p class="lede">点爻改变卦，切换图层看位置关系。这是解卦前最实用的四步。</p></section>' +
    '<section class="block"><div class="surface split wide-l"><div class="block"><div class="chips" id="ly">' + layers.map(function (l) { return '<button class="chip" data-l="' + l[0] + '">' + l[1] + '</button>'; }).join('') + '</div><div class="board" id="board"></div></div><div class="block"><div class="big" id="bdn"></div><p id="ln"></p><div id="pick" class="block"></div></div></div></section>' +
    '<section class="block">' + head('看爻速读', '点一根爻，自动过四关') + '<div class="surface" id="yaoread"></div></section>' +
    '<section class="block">' + head('当场练', '点出所有当位的爻') + '<div class="surface q" id="dq"></div></section>' + finishBtn('l3');
  var picked = 1;
  function layerClass(a, i) {
    if (boardLayer === 'dang') return a[i].dang ? 'ok' : 'no';
    if (boardLayer === 'zhong') return a[i].zhong ? 'mid' : '';
    if (boardLayer === 'cheng') return a[i].chengGang ? 'no' : a[i].chengShang ? 'ok' : '';
    if (boardLayer === 'zhu' && fuZhu(boardBits) === i) return 'zhu';
    return '';
  }
  function arcs(a) {
    if (boardLayer !== 'ying') return '';
    var s = '', Y = function (i) { return 288 - 24 - i * 48; };
    [[0, 3], [1, 4], [2, 5]].forEach(function (p, n) {
      var ok = a[p[0]].ying, x = 22 + n * 34;
      s += '<path d="M2 ' + Y(p[0]) + ' C' + (x + 30) + ' ' + Y(p[0]) + ' ' + (x + 30) + ' ' + Y(p[1]) + ' 2 ' + Y(p[1]) + '" fill="none" stroke="' + (ok ? 'var(--good)' : 'var(--line)') + '" stroke-width="' + (ok ? 3.5 : 1.5) + '" ' + (ok ? '' : 'stroke-dasharray="4 5"') + '/>';
    });
    return s;
  }
  function draw() {
    var a = Yi.analyze(boardBits), h = '';
    for (var i = 5; i >= 0; i--) {
      var c = layerClass(a, i);
      h += '<div class="bpos" style="grid-row:' + (6 - i) + ';grid-column:1">' + POS[i] + ' · ' + (i % 2 === 0 ? '阳位' : '阴位') + '</div><div class="bline ' + c + '" style="grid-row:' + (6 - i) + ';grid-column:2"><button class="ln ' + (boardBits[i] === '1' ? 'yang' : 'yin') + (picked === i ? ' hot' : '') + '" data-i="' + i + '" aria-label="切换爻"><i></i><u></u><i></i></button></div>';
    }
    h += '<svg class="barcs" viewBox="0 0 120 288" aria-hidden="true">' + arcs(a) + '</svg>';
    $('#board').innerHTML = h;
    $('#bdn').textContent = hexName(boardBits);
    $('#ln').textContent = notes[boardLayer];
    $$('[data-l]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === boardLayer); });
    $('#pick').innerHTML = '<div class="small">试试这些卦</div><div class="chips">' + [['屯', '100010'], ['谦', '001000'], ['夬', '111110'], ['既济', '101010'], ['未济', '010101']].map(function (x) { return '<button class="chip" data-b="' + x[1] + '">' + x[0] + '</button>'; }).join('') + '</div>';
    $$('#pick [data-b]').forEach(function (b) { b.onclick = function () { boardBits = b.getAttribute('data-b'); draw(); }; });
    $$('#board .ln').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-i'); if (picked === i) { boardBits = Yi.flip(boardBits, [i]); } picked = i; draw(); }; });
    var A = a[picked], ch = [[A.dang, '当位', A.dang ? '在该在的位置' : '位置不合'], [A.zhong, '居中', A.zhong ? '中胜于正' : '不在中位'], [A.ying, '正应', A.ying ? label(A.partner, boardBits[A.partner] === '1') + '可呼应' : '与' + POS[A.partner] + '爻同性无应'], [!A.chengGang, A.chengGang ? '乘刚' : '无乘刚', A.chengGang ? '压在阳爻上' : '没有逆压']];
    var zh = fuZhu(boardBits) === picked;
    $('#yaoread').innerHTML = '<div class="row"><div class="big">' + label(picked, boardBits[picked] === '1') + '</div><div class="chips">' + ch.map(function (c) { return '<span class="chip ' + (c[0] ? 'g' : 'b') + '">' + c[1] + ' · ' + c[2] + '</span>'; }).join('') + (zh ? '<span class="chip m">主爻</span>' : '') + '</div></div><div class="small" style="margin-top:6px">再点一次这根爻可以翻转阴阳。</div>';
  }
  $$('[data-l]').forEach(function (b) { b.onclick = function () { boardLayer = b.getAttribute('data-l'); draw(); }; });
  draw(); bindFinish();
  // 练习
  var drillHex, chosen;
  function nq() { drillHex = HEX[Math.floor(Math.random() * 64)]; chosen = {}; dq(); }
  function dq(done) {
    var b = drillHex.bits, a = Yi.analyze(b), right = a.filter(function (x) { return x.dang; }).map(function (x) { return x.i; });
    var o = { size: 'lg', btn: true, hot: Object.keys(chosen).map(Number) };
    if (done) { o.btn = false; o.hot = right; }
    var ok = done && Object.keys(chosen).length === right.length && right.every(function (i) { return chosen[i]; });
    $('#dq').innerHTML = '<div class="big">' + hexName(b) + '</div>' + gua(b, o) + '<div class="row">' + (done ? '<span class="chip ' + (ok ? 'g' : 'b') + '">' + (ok ? '答对了' : '正确答案已标蓝') + '</span><button class="btn" id="dn">下一题</button>' : '<button class="btn" id="dc">交卷</button>') + '</div>';
    if (done) $('#dn').onclick = nq; else { $('#dc').onclick = function () { dq(true); }; $$('#dq .ln').forEach(function (x) { x.onclick = function () { var i = +x.getAttribute('data-i'); if (chosen[i]) delete chosen[i]; else chosen[i] = 1; dq(); }; }); }
  }
  nq();
};

// ---- 四：读辞 ----
var VERD = { 元吉: 3, 大吉: 3, 吉: 2, 无不利: 2, 无咎: 1, 无悔: 1, 悔亡: 1, 亨: 1, 悔: -1, 吝: -1, 厉: -2, 凶: -3 };
var VRE = /元吉|大吉|无不利|无咎|无悔|悔亡|吉|凶|厉|吝|悔|亨/g;
function verdict(t) { var m = t.match(VRE); return m ? VERD[m[m.length - 1]] : 0; }
function markVerdict(t) { return esc(t).replace(VRE, function (w) { var v = VERD[w]; return '<mark class="' + (v > 0 ? 'g' : v < -1 ? 'b' : 'w') + '">' + w + '</mark>'; }); }
var vClass = { 3: 'v3', 2: 'v2', 1: 'v1', 0: '', '-1': 'vm1', '-2': 'vm2', '-3': 'vm3' };
views.l4 = function () {
  var scale = [['元吉', 3, '最好'], ['吉', 2, '好'], ['无咎', 1, '没有过失'], ['悔', -1, '有后悔，能改'], ['吝', -1, '难堪、可惜'], ['厉', -2, '危险，要警惕'], ['凶', -3, '不好，不是必死']];
  // 统计
  var stats = [0, 1, 2, 3, 4, 5].map(function () { return { good: 0, bad: 0, n: 0 }; }), dang = { y: [0, 0], n: [0, 0] };
  HEX.forEach(function (h) {
    var a = Yi.analyze(h.bits);
    h.lines.slice(0, 6).forEach(function (l, i) { var v = verdict(l.text), s = stats[i]; s.n++; if (v >= 2) s.good++; if (v <= -2) s.bad++; var k = a[i].dang ? 'y' : 'n'; dang[k][0]++; if (v >= 2) dang[k][1]++; });
  });
  var maxp = Math.max.apply(null, stats.map(function (s) { return s.good / s.n; }));
  view.innerHTML = '<section class="block"><h1>四阶 · 读辞</h1><p class="lede">爻辞前半是画面，后半是判断。先认判断词，全书三百八十四爻就有了地图。</p></section>' +
    '<section class="block">' + head('吉凶刻度', '点一个词，地图只亮对应的爻') + '<div class="chips" id="sc"><button class="chip on" data-v="all">全部</button>' + scale.map(function (s) { return '<button class="chip" data-v="' + s[0] + '" title="' + s[2] + '">' + s[0] + ' <span class="small">' + s[2] + '</span></button>'; }).join('') + '</div></section>' +
    '<section class="block">' + head('全书吉凶地图', '每一小柱是一卦，从下到上是初到上') + '<div class="surface block"><div class="jmap" id="jm"></div><div class="quote" id="jtext">把鼠标移到方块上</div></div></section>' +
    '<section class="block">' + head('爻位与吉的关系', '用全书爻辞实算') + '<div class="surface split"><div class="posbars">' + stats.map(function (s, i) { var p = s.good / s.n; return { i: i, p: p, n: s.n, g: s.good }; }).reverse().map(function (x) { return '<div class="pb"><span>' + POS[x.i] + '爻</span><span class="tr"><i style="width:' + (x.p / maxp * 100) + '%;background:' + (x.i === 1 || x.i === 4 ? 'var(--good)' : 'var(--accent)') + '"></i></span><span class="val">' + Math.round(x.p * 100) + '%</span></div>'; }).join('') + '</div><div class="block"><div class="big">二、五最吉</div><p>两个中位的“吉”类判断最多，正好印证“中胜于正”。</p><div class="chips"><span class="chip">当位含吉 ' + Math.round(dang.y[1] / dang.y[0] * 100) + '%</span><span class="chip">不当位含吉 ' + Math.round(dang.n[1] / dang.n[0] * 100) + '%</span></div><div class="small">统计规则：以每爻最后出现的判断词为准，吉、元吉、无不利都算“吉”类。</div></div></div></section>' + finishBtn('l4');
  function drawMap(filter) {
    $('#jm').innerHTML = HEX.map(function (h, hi) {
      return '<div class="jg" title="' + h.name + '">' + h.lines.slice(0, 6).map(function (l, i) {
        var v = verdict(l.text), on = filter === 'all' ? true : (l.text.indexOf(filter) >= 0);
        return '<span class="jc ' + (on ? (vClass[v] || '') : '') + '" data-h="' + hi + '" data-i="' + i + '" style="' + (on ? '' : 'opacity:.25') + '"></span>';
      }).join('') + '</div>';
    }).join('');
  }
  drawMap('all');
  $('#jm').onmouseover = function (e) {
    var h = e.target.getAttribute && e.target.getAttribute('data-h'); if (h == null) return;
    var i = +e.target.getAttribute('data-i'), x = HEX[+h];
    $('#jtext').innerHTML = '<b>' + x.name + ' ' + x.lines[i].label + '</b>　' + markVerdict(x.lines[i].text) + '<div class="small">' + GLOSS[+h][1][i] + '</div>';
  };
  $('#jm').onclick = $('#jm').onmouseover;
  $$('[data-v]').forEach(function (b) { b.onclick = function () { $$('[data-v]').forEach(function (x) { x.classList.toggle('on', x === b); }); drawMap(b.getAttribute('data-v')); }; });
  bindFinish();
};

// ---- 五：起卦 ----
var castTab = 'dayan', pending = [];
function nowBJ() {
  var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()), o = {};
  f.forEach(function (p) { o[p.type] = +p.value; });
  return [o.year, o.month, o.day, o.hour % 24, o.minute];
}
function finishCast(values, method, qInput) {
  var q = (qInput || ($('#castq') && $('#castq').value) || '').trim();
  S.cast = { values: values, q: q, method: method, t: nowBJ(), at: Date.now() };
  S.history = [S.cast].concat(S.history || []).slice(0, 12);
  save();
}
function castPreview(values) {
  var filled = values.concat([]);
  var bits = filled.map(function (v) { return v === 7 || v === 9 ? '1' : '0'; }), s = '';
  for (var i = 0; i < 6; i++) {
    if (i < filled.length) s += lineHTML(bits[i], i, { moving: filled[i] === 6 || filled[i] === 9 ? [i] : [] });
    else s += '<div class="ln" style="opacity:.14"><i></i></div>';
  }
  return '<div class="gua lg">' + s + '</div>';
}
function castResult(values) {
  var b = Yi.valuesToBits(values), m = Yi.movingOf(values), z = Yi.flip(b, m);
  return '<div class="row"><div class="big">' + hexName(b) + (m.length ? ' → ' + hexName(z) : '') + '</div>' + (m.length ? '<span class="chip m">' + m.map(function (i) { return label(i, b[i] === '1'); }).join('、') + ' 动</span>' : '<span class="chip">六爻皆静</span>') + '<a class="btn" href="#l6" style="text-decoration:none">去解这一卦</a></div>';
}
var dayanRaf = 0;
views.l5 = function () {
  pending = [];
  view.innerHTML = '<section class="block"><h1>五阶 · 起卦</h1><p class="lede">先想清一个具体问题。傅佩荣的提醒：同一件事只占一次，也别用两种方法重复问。</p></section><input id="castq" placeholder="我想问：例如，这个月换工作合适吗？" aria-label="你想问的问题" style="width:100%;padding:10px 12px;font-size:16px">' +
    '<div class="tabs">' + [['dayan', '大衍筮法'], ['coin', '三枚铜钱'], ['num', '数字卦'], ['time', '时间起卦'], ['hand', '手动摆卦']].map(function (t) { return '<button class="tab ' + (castTab === t[0] ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="castarea"></div>' +
    '<section class="block">' + head('两种方法的概率', '大衍老阳多老阴少，铜钱一样多') + '<div class="surface split" id="probs"></div></section>' + finishBtn('l5');
  $$('.tab').forEach(function (b) { b.onclick = function () { castTab = b.getAttribute('data-tab'); pending = []; drawTab(); $$('.tab').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
  drawTab(); drawProbs(null); bindFinish();
};
function drawProbs(sim) {
  var th = { 大衍: { 6: 1 / 16, 7: 5 / 16, 8: 7 / 16, 9: 3 / 16 }, 铜钱: { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 } };
  var nm = { 6: '老阴 6', 7: '少阳 7', 8: '少阴 8', 9: '老阳 9' };
  function col(k) {
    return '<div class="prob"><b style="grid-column:1/4">' + k + '法</b>' + [6, 7, 8, 9].map(function (v) {
      var t = th[k][v], s = sim ? sim[k][v] : t;
      return '<span>' + nm[v] + '</span><span class="t"><i style="width:' + (s * 200) + '%"></i><s style="left:' + (t * 200) + '%"></s></span><span style="text-align:right">' + (s * 100).toFixed(1) + '%</span>';
    }).join('') + '</div>';
  }
  $('#probs').innerHTML = col('大衍') + col('铜钱') + '<div class="row" style="grid-column:1/-1"><button class="btn ghost" id="simb">模拟 10000 爻</button><span class="small">黄线是理论值</span></div>';
  $('#simb').onclick = function () {
    var r = { 大衍: { 6: 0, 7: 0, 8: 0, 9: 0 }, 铜钱: { 6: 0, 7: 0, 8: 0, 9: 0 } };
    for (var i = 0; i < 10000; i++) { r.大衍[Yi.dayanLine().value]++; r.铜钱[Yi.coinLine().value]++; }
    [6, 7, 8, 9].forEach(function (v) { r.大衍[v] /= 10000; r.铜钱[v] /= 10000; });
    drawProbs(r);
  };
}
function drawTab() {
  cancelAnimationFrame(dayanRaf);
  var a = $('#castarea');
  ({ dayan: tabDayan, coin: tabCoin, num: tabNum, time: tabTime, hand: tabHand })[castTab](a);
}
// 蓍草舞台：每根草一个目标位置，逐帧靠拢
function tabDayan(a) {
  a.innerHTML = '<div class="split wide-l"><div class="block"><canvas class="stalks" id="cv"></canvas><div class="calc" id="msg"></div><div class="row"><button class="btn" id="nx">下一步</button><button class="btn ghost" id="auto">自动演示</button><button class="btn ghost" id="fin">一键成卦</button></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
  var cv = $('#cv'), ctx = cv.getContext('2d'), W = cv.clientWidth, H = 210, dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
  var colors = cs(); var stalks = [], lineIdx = 0, changeIdx = 0, step = 0, curChange = null, total = 49, timer = 0, changes = [];
  function cs() { var s = getComputedStyle(document.documentElement); return { ink: s.getPropertyValue('--ink').trim(), acc: s.getPropertyValue('--accent').trim(), mv: s.getPropertyValue('--move').trim(), muted: s.getPropertyValue('--muted').trim() }; }
  function pile(n) { stalks = []; for (var i = 0; i < n; i++) stalks.push({ x: W / 2 + (i - n / 2) * 3, y: 54, tx: W / 2 + (i - n / 2) * 3, ty: 54, c: 'ink' }); }
  function setTarget(list, x0, y0, dx, c) { list.forEach(function (s, i) { s.tx = x0 + i * dx; s.ty = y0; if (c) s.c = c; }); }
  function groups(list, x0) { // 四根一组排开，剩下的挑出来
    var rem = list.length % 4 || 4, body = list.slice(0, list.length - rem), last = list.slice(list.length - rem);
    body.forEach(function (s, i) { var g = Math.floor(i / 4), k = i % 4; s.tx = x0 + (g % 5) * 30 + k * 5; s.ty = 26 + Math.floor(g / 5) * 42; s.c = 'ink'; });
    last.forEach(function (s, i) { s.tx = x0 + i * 7; s.ty = 176; s.c = 'mv'; });
    return last;
  }
  var L, R, G, off;
  function doStep() {
    if (lineIdx >= 6) return false;
    if (step === 0) {
      curChange = Yi.dayanChange(total); off = [];
      var idx = stalks.slice(); L = idx.slice(0, curChange.left); R = idx.slice(curChange.left); G = R.pop();
      setTarget(L, W * .25 - L.length * 1.7, 90, 3.4); setTarget(R, W * .75 - R.length * 1.7, 90, 3.4); setTarget([G], W * .5, 90, 0);
      say('分二', '左 ' + curChange.left + ' 根，右 ' + (curChange.right + 1) + ' 根');
    } else if (step === 1) { G.tx = W * .5; G.ty = 26; G.c = 'mv'; say('挂一', '从右手取 1 根，夹在指间'); }
    else if (step === 2) { off = groups(L, 8); say('揲左', '左手四根一数，余 ' + curChange.leftRem); }
    else if (step === 3) { off = off.concat(groups(R, W * .53)); say('揲右', '右手四根一数，余 ' + curChange.rightRem); }
    else if (step === 4) {
      off.concat([G]).forEach(function (s, i) { s.tx = W - 16 - i * 5; s.ty = 14; s.c = 'muted'; });
      var rest = L.concat(R).filter(function (s) { return off.indexOf(s) < 0 && s !== G; });
      rest.forEach(function (s, i) { s.tx = W / 2 + (i - rest.length / 2) * 3; s.ty = 54; s.c = 'ink'; });
      say('归奇', '去掉 ' + curChange.removed + ' 根，还剩 ' + curChange.rest + ' 根');
      stalks = rest.concat(); total = curChange.rest; changes.push(curChange); changeIdx++;
      if (changeIdx === 3) {
        var v = total / 4; pending.push(v);
        say('第 ' + (lineIdx + 1) + ' 爻', total + ' ÷ 4 = ' + v + (v === 9 ? '，老阳，会变' : v === 6 ? '，老阴，会变' : v === 7 ? '，少阳' : '，少阴'));
        lineIdx++; changeIdx = 0; changes = []; total = 49; step = -1; pendingReset = true;
        drawPV();
        if (lineIdx === 6) { clearInterval(timer); finishCast(pending.slice(), '大衍筮法'); $('#rs').innerHTML = castResult(pending); $('#nx').disabled = true; }
      } else step = -1;
    }
    step++;
    return true;
  }
  var pendingReset = false;
  function say(a, b) { $('#msg').innerHTML = '<span><b>第 ' + Math.min(lineIdx + 1, 6) + ' 爻 · 第 ' + (changeIdx + 1) + ' 变</b></span><span>' + a + '</span><span>' + b + '</span>'; }
  function drawPV() { $('#pv').innerHTML = castPreview(pending); }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    stalks.concat(off || []).concat(G ? [G] : []).forEach(function (s) {
      s.x += (s.tx - s.x) * .22; s.y += (s.ty - s.y) * .22;
      ctx.strokeStyle = colors[s.c]; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(s.x, s.y - 18); ctx.lineTo(s.x, s.y + 18); ctx.stroke();
    });
    dayanRaf = requestAnimationFrame(frame);
  }
  function advance() { if (pendingReset) { pendingReset = false; pile(49); off = []; G = null; return; } doStep(); }
  $('#nx').onclick = advance;
  $('#auto').onclick = function () { clearInterval(timer); timer = setInterval(function () { if (lineIdx >= 6) { clearInterval(timer); return; } advance(); }, 520); $('#auto').textContent = '演示中…'; $('#auto').disabled = true; };
  $('#fin').onclick = function () {
    clearInterval(timer); pending = []; for (var i = 0; i < 6; i++) pending.push(Yi.dayanLine().value);
    lineIdx = 6; drawPV(); finishCast(pending.slice(), '大衍筮法'); $('#rs').innerHTML = castResult(pending); $('#nx').disabled = true; stalks = []; off = []; G = null; say('完成', '六爻已成');
  };
  pile(49); off = []; drawPV(); say('准备', '大衍之数五十，其用四十有九'); frame();
}
function tabCoin(a) {
  a.innerHTML = '<div class="split"><div class="block"><div class="coins" id="coins">' + [0, 1, 2].map(function () { return '<div class="coin">背</div>'; }).join('') + '</div><div class="row" style="justify-content:center"><button class="btn" id="th">掷第 1 爻</button></div><div class="small" style="text-align:center">背算 3，字算 2。三枚相加：6 老阴、7 少阳、8 少阴、9 老阳。</div><div class="calc" id="clog" style="justify-content:center"></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
  function pv() { $('#pv').innerHTML = castPreview(pending); }
  pv();
  $('#th').onclick = function () {
    if (pending.length >= 6) return;
    var r = Yi.coinLine(), cs = $$('.coin');
    cs.forEach(function (c, i) { c.classList.remove('spin'); void c.offsetWidth; c.classList.add('spin'); c.textContent = r.coins[i] ? '背' : '字'; });
    pending.push(r.value);
    $('#clog').innerHTML += '<span>' + POS[pending.length - 1] + '：' + r.value + '</span>';
    pv();
    if (pending.length === 6) { finishCast(pending.slice(), '三枚铜钱'); $('#rs').innerHTML = castResult(pending); $('#th').disabled = true; }
    else $('#th').textContent = '掷第 ' + (pending.length + 1) + ' 爻';
  };
}
function tabNum(a) {
  a.innerHTML = '<div class="split"><div class="block"><div class="small">傅佩荣课堂方法：随手得来的三组三位数，由下往上写</div><div class="nums"><input id="n1" inputmode="numeric" maxlength="3" value="130" aria-label="第一组"><input id="n2" inputmode="numeric" maxlength="3" value="174" aria-label="第二组"><input id="n3" inputmode="numeric" maxlength="3" value="314" aria-label="第三组"></div><div class="calc" id="nc"></div><div class="row"><button class="btn" id="ng">定卦</button><button class="btn ghost" id="nr">随机三组</button></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
  var last = null;
  function calc() {
    var x = [$('#n1').value, $('#n2').value, $('#n3').value].map(function (v) { return parseInt(v, 10); });
    if (x.some(function (v) { return !(v >= 100 && v <= 999); })) { $('#nc').innerHTML = '<span>请输入三组三位数，开头不能是 0</span>'; $('#ng').disabled = true; return; }
    $('#ng').disabled = false;
    var r = Yi.numberCast(x[0], x[1], x[2]); last = r;
    $('#nc').innerHTML = '<span>' + x[0] + ' ÷ 8 余 ' + r.lowerN + ' → 下卦' + Yi.TRI[r.lowerN - 1] + '</span><span>' + x[1] + ' ÷ 8 余 ' + r.upperN + ' → 上卦' + Yi.TRI[r.upperN - 1] + '</span><span>' + x[2] + ' ÷ 6 余 ' + r.move + ' → ' + POS[r.move - 1] + '爻动</span>';
    $('#pv').innerHTML = castPreview(r.values);
  }
  ['n1', 'n2', 'n3'].forEach(function (i) { $('#' + i).oninput = calc; });
  $('#nr').onclick = function () { ['n1', 'n2', 'n3'].forEach(function (i) { $('#' + i).value = 100 + Math.floor(Math.random() * 900); }); calc(); };
  $('#ng').onclick = function () { finishCast(last.values.slice(), '数字卦'); $('#rs').innerHTML = castResult(last.values); };
  calc();
}
function tabTime(a) {
  var n = nowBJ(), def = n[0] + '-' + String(n[1]).padStart(2, '0') + '-' + String(n[2]).padStart(2, '0') + 'T' + String(n[3]).padStart(2, '0') + ':' + String(n[4]).padStart(2, '0');
  a.innerHTML = '<div class="split"><div class="block"><div class="small">梅花易数“年月日时起例”，按北京时间</div><input id="tt" type="datetime-local" value="' + def + '" aria-label="起卦时间"><div class="calc" id="tc"></div><div class="row"><button class="btn" id="tg">定卦</button></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
  var last;
  function calc() {
    var m = $('#tt').value.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); if (!m) return;
    var t = Yi.ganzhi(+m[1], +m[2], +m[3], +m[4], +m[5]), r = Yi.meihuaTimeCast(t); last = r;
    $('#tc').innerHTML = '<span>' + t.year + '年 ' + t.month + '月 ' + t.day + '日 ' + t.hour + '时</span><span>农历 ' + (t.lunar.leap ? '闰' : '') + t.lunar.month + ' 月 ' + t.lunar.day + ' 日</span><span>' + t.year[1] + '(' + r.yearN + ') + ' + t.lunar.month + ' + ' + t.lunar.day + ' = ' + r.base + ' → 上卦' + Yi.TRI[r.upperN - 1] + '</span><span>+ ' + t.hour[1] + '(' + r.hourN + ') → 下卦' + Yi.TRI[r.lowerN - 1] + '，' + POS[r.move - 1] + '爻动</span>';
    $('#pv').innerHTML = castPreview(r.values);
  }
  $('#tt').oninput = calc;
  $('#tg').onclick = function () { finishCast(last.values.slice(), '时间起卦'); $('#rs').innerHTML = castResult(last.values); };
  calc();
}
function tabHand(a) {
  var v = [7, 7, 7, 7, 7, 7], cycle = { 7: 8, 8: 9, 9: 6, 6: 7 };
  function draw() {
    var o = '';
    for (var i = 0; i < 6; i++) o += '<button class="ln ' + (v[i] === 7 || v[i] === 9 ? 'yang' : 'yin') + (v[i] === 6 || v[i] === 9 ? ' mv' : '') + '" data-i="' + i + '" aria-label="切换"><i></i><u></u><i></i></button>';
    a.innerHTML = '<div class="split"><div class="block" style="align-items:center"><div class="gua lg">' + o + '</div><div class="small">反复点爻：少阳 → 少阴 → 老阳 → 老阴</div><button class="btn" id="hg">定卦</button></div><div class="block" style="align-items:center"><div id="rs">' + castResult(v) + '</div></div></div>';
    $$('.ln', a).forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-i'); v[i] = cycle[v[i]]; draw(); }; });
    $('#hg').onclick = function () { finishCast(v.slice(), '手动摆卦'); $('#rs').innerHTML = castResult(v); };
  }
  draw();
}

// ---- 上：解卦 ----
var readV = null, caseSel = 'nankuai', caseStep = 0;
function textOf(t, r) {
  var b = t.hex === 'ben' ? r.ben : r.zhi, h = Yi.hex(b);
  if (t.type === 'judgment') return { title: h.name + '卦辞', body: h.judgment, gloss: GLOSS[h.kw - 1][0], extra: h.daxiang };
  var l = h.lines[t.i], g = t.i === 6 ? GLOSS[h.kw - 1][2] : GLOSS[h.kw - 1][1][t.i];
  return { title: h.name + ' ' + l.label, body: l.text, gloss: g, extra: h.smallxiang[t.i] };
}
views.l6 = function () {
  readV = cast().values.slice();
  var c = cast();
  view.innerHTML = '<section class="block"><h1>上阶 · 解卦</h1><p class="lede">点爻改变动爻，规则会自动指出这次该读哪一句。</p></section>' +
    '<section class="block"><div class="surface block"><div class="row" style="justify-content:space-between"><div class="small">' + (c.demo ? '示例卦 · 起一卦后这里变成你的' : esc(c.method) + (c.q ? ' · ' + esc(c.q) : '')) + '</div><a href="#l5" class="btn ghost" style="text-decoration:none">重新起卦</a></div><div class="flow" id="flow"></div><div class="chips" id="rule"></div><div id="targets" class="block"></div><div class="row"><span class="small" id="fualt"></span></div></div></section>' +
    '<section class="block">' + head('时间感', '傅佩荣：从动爻往上数，每爻一个阶段') + '<div class="surface split"><div class="ladder2" id="tl"></div><div class="block"><div class="big" id="tlb"></div><div class="small">单位看事情的周期：可能是天、月或年，要靠生活经验判断。</div></div></div></section>' +
    '<section class="block">' + head('把卦放进你的问题') + '<div class="surface block"><textarea id="askq" placeholder="写下问题和背景">' + esc(c.demo ? '' : c.q) + '</textarea><div class="row"><a class="btn" href="#tui" id="askb" style="text-decoration:none">带着问题去推演</a><span class="small">按傅佩荣的两条：不脱离情境，优先取合理解释</span></div></div></section>' +
    '<section class="block">' + head('古今筮例', '点一个例子，一步步揭开') + '<div class="cases" id="cs"></div><div id="cd" class="block"></div></section>' + finishBtn('l6');
  drawFlow(); drawCases(); bindFinish();
  $('#askq').oninput = function (e) { tui.q = e.target.value; };
};
function drawFlow() {
  var r = Yi.reading(readV), hl = r.moving;
  var benO = { size: 'lg', moving: hl, btn: true };
  var targetsLine = r.targets.filter(function (t) { return t.type === 'line' && t.i < 6; });
  var ziO = { size: 'mid', hot: targetsLine.filter(function (t) { return t.hex === 'zhi'; }).map(function (t) { return t.i; }) };
  benO.hot = targetsLine.filter(function (t) { return t.hex === 'ben'; }).map(function (t) { return t.i; }).filter(function (i) { return hl.indexOf(i) < 0; });
  $('#flow').innerHTML = '<div class="block" style="align-items:center">' + gua(r.ben, benO) + '<b style="font:900 20px var(--serif)">' + hexName(r.ben) + '</b></div><span class="arrow" aria-hidden="true">→</span><div class="block" style="align-items:center">' + gua(r.zhi, ziO) + '<b style="font:900 18px var(--serif)">' + hexName(r.zhi) + '</b></div>';
  $('#rule').innerHTML = '<span class="chip m">' + r.n + ' 爻变</span><span class="chip">' + r.rule + '</span>';
  $('#targets').innerHTML = r.targets.map(function (t) {
    var x = textOf(t, r);
    return '<div class="target ' + (t.main ? 'main' : '') + '"><div class="small">' + x.title + (t.main ? ' · 重点' : '') + '</div><div class="quote">' + markVerdict(x.body) + '</div><div>' + x.gloss + '</div>' + (x.extra ? '<div class="small">' + esc(x.extra) + '</div>' : '') + '</div>';
  }).join('');
  $('#fualt').textContent = r.n === 3 ? '傅佩荣的课上示范：三爻变直接看本卦卦辞。' : r.n === 1 ? '数字卦一定只有一个动爻。' : '';
  $$('#flow .ln').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-i'); readV[i] = { 7: 9, 9: 7, 8: 6, 6: 8 }[readV[i]]; drawFlow(); }; });
  // 时间阶梯
  var from = r.moving.length === 1 ? r.moving[0] : (r.moving.length ? r.moving[r.moving.length - 1] : 0), n = 6 - from;
  $('#tl').innerHTML = [0, 1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i >= from ? 'on' : '') + '" style="height:' + (22 + i * 13) + 'px" title="' + POS[i] + '爻"></i>'; }).join('');
  $('#tlb').textContent = (r.moving.length ? POS[from] + '爻起，约 ' + (n - 1 || 1) + ' 个阶段' : '无动爻，看整体形势');
}
function drawCases() {
  $('#cs').innerHTML = CASES.map(function (c) { var h = HEX.filter(function (x) { return x.name === c.ben; })[0]; return '<button class="case ' + (caseSel === c.id ? 'on' : '') + '" data-c="' + c.id + '">' + gua(h.bits, { size: 'mini', moving: c.mv || [] }) + '<b style="font:900 16px var(--serif)">' + c.ben + '</b><span class="small">' + c.tag + '</span></button>'; }).join('');
  $$('#cs .case').forEach(function (b) { b.onclick = function () { caseSel = b.getAttribute('data-c'); caseStep = 1; drawCases(); }; });
  var c = CASES.filter(function (x) { return x.id === caseSel; })[0], h = HEX.filter(function (x) { return x.name === c.ben; })[0];
  var st = [['他读到', c.read], ['转折', c.turn], ['结局', c.end]];
  $('#cd').innerHTML = '<div class="surface block"><div class="row" style="justify-content:space-between"><div><div class="small">' + c.tag + ' · ' + c.who + '</div><div class="quote">问：' + c.q + '</div></div>' + (c.mv ? '<button class="btn ghost" id="cl">放进上面的卦盘</button>' : '') + '</div><div class="reveal">' + st.map(function (s, i) { return '<button class="rstep ' + (i >= caseStep ? 'lock' : '') + '" data-s="' + i + '"><b>' + s[0] + '</b><span>' + s[1] + '</span></button>'; }).join('') + '</div><a class="small" href="' + c.src + '" target="_blank" rel="noopener">查看出处</a></div>';
  $$('#cd .rstep').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-s'); if (i === caseStep) { caseStep++; drawCases(); } }; });
  var cl = $('#cl'); if (cl) cl.onclick = function () { readV = h.bits.split('').map(function (x, i) { var y = x === '1'; return c.mv.indexOf(i) >= 0 ? (y ? 9 : 6) : (y ? 7 : 8); }); drawFlow(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
}
// ---- 梅花易数 ----
var wxSel = '木', mhMove = null;
function wxSvg(sel, sMark, kMark) {
  var pts = {}; Yi.WX.forEach(function (w, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; pts[w] = [170 + 118 * Math.cos(a), 160 + 118 * Math.sin(a)]; });
  function edge(a, b, k) {
    var p = pts[a], q = pts[b], dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy), u = [dx / len, dy / len], s = [p[0] + u[0] * 30, p[1] + u[1] * 30], e = [q[0] - u[0] * 34, q[1] - u[1] * 34];
    var head = 'M' + e[0] + ' ' + e[1] + 'L' + (e[0] - u[0] * 11 - u[1] * 6) + ' ' + (e[1] - u[1] * 11 + u[0] * 6) + 'L' + (e[0] - u[0] * 11 + u[1] * 6) + ' ' + (e[1] - u[1] * 11 - u[0] * 6) + 'Z';
    var on = k ? (a === sel ? 'on-k' : '') : (a === sel ? 'on-s' : '');
    return '<path class="wxe ' + on + '" d="M' + s + 'L' + e + '" ' + (k ? 'stroke-dasharray="6 5"' : '') + '/><path d="' + head + '" fill="' + (on === 'on-s' ? 'var(--good)' : on === 'on-k' ? 'var(--bad)' : 'var(--line)') + '"/>';
  }
  var e = Yi.WX.map(function (w) { return edge(w, Yi.SHENG[w], false) + edge(w, Yi.KE[w], true); }).join('');
  var n = Yi.WX.map(function (w) { var p = pts[w]; return '<g class="wx-node ' + (w === sel ? 'sel' : '') + '" data-w="' + w + '" transform="translate(' + p[0] + ',' + p[1] + ')"><circle r="28"/><text y="8">' + w + '</text></g>'; }).join('');
  return '<svg viewBox="0 0 340 320" style="width:100%;max-width:340px;display:block;margin:auto" role="img" aria-label="五行生克图">' + e + n + '</svg>';
}
views.mh = function () {
  view.innerHTML = '<section class="block"><h1>梅花易数</h1><p class="lede">不看爻辞也能断：把两个卦分成“我”和“事”，看五行谁生谁、谁克谁。</p></section>' +
    '<section class="block">' + head('五行生克', '点一行，绿线生，红虚线克') + '<div class="surface split"><div id="wx"></div><div class="block"><div class="big" id="wxn"></div><div class="chips" id="wxc"></div><div class="chips">' + Yi.TRI.map(function (t) { return '<span class="chip">' + t + ' ' + Yi.GONG_WX[t] + '</span>'; }).join('') + '</div></div></div></section>' +
    '<section class="block">' + head('体用推演', '动爻所在是用（事），另一卦是体（我）') + '<div class="surface block" id="mh"></div></section>';
  function dw() {
    $('#wx').innerHTML = wxSvg(wxSel);
    $('#wxn').textContent = wxSel;
    var sh = Yi.SHENG[wxSel], ke = Yi.KE[wxSel];
    $('#wxc').innerHTML = '<span class="chip g">' + wxSel + '生' + sh + '</span><span class="chip b">' + wxSel + '克' + ke + '</span>';
    $$('#wx .wx-node').forEach(function (g) { g.onclick = function () { wxSel = g.getAttribute('data-w'); dw(); }; });
  }
  dw(); drawMH();
};
function drawMH() {
  var c = cast(), m = Yi.movingOf(c.values), box = $('#mh');
  if (mhMove == null || mhMove.key !== c.values.join()) mhMove = { key: c.values.join(), mv: m.length === 1 ? m[0] + 1 : (m[0] != null ? m[m.length - 1] + 1 : 6) };
  var bits = Yi.valuesToBits(c.values), t = c.t ? Yi.ganzhi(c.t[0], c.t[1], c.t[2], c.t[3], c.t[4] || 0) : null;
  var R = Yi.meihua(bits, mhMove.mv, t ? t.month[1] : null);
  var ratio = { 生体: ['g', '有助于我'], 比和: ['g', '同气相助'], 受体克: ['g', '我能掌控'], 泄体: ['b', '耗我气力'], 克体: ['b', '压制于我'] };
  function node(lab, r, extra, i) { var v = ratio[r.rel]; return '<div class="cnode ' + v[0] + '" style="animation-delay:' + i * 120 + 'ms"><span class="small">' + lab + '</span><b>' + r.tri + ' ' + r.wx + '</b><span>' + r.rel + '</span><span class="small">' + v[1] + (extra || '') + '</span></div>'; }
  var sc = R.chain[0].r.score + R.chain[2].r.score + (R.chain[1].r.score + R.chain[1].r2.score) / 2;
  var final = sc >= 2 ? ['g', '偏吉'] : sc <= -2 ? ['b', '偏凶'] : ['', '平中有变'];
  box.innerHTML = '<div class="row"><div>' + gua(bits, { size: 'mid', moving: [mhMove.mv - 1] }) + '</div><div><div class="big">' + hexName(bits) + '</div><div class="small">' + (m.length === 1 ? '动爻 ' + POS[mhMove.mv - 1] : '梅花只用一个动爻，下面可以换') + '</div></div><div class="chips">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<button class="chip ' + (mhMove.mv === n ? 'on' : '') + '" data-mv="' + n + '">' + POS[n - 1] + '</button>'; }).join('') + '</div></div>' +
    '<div class="chain"><div class="cnode"><span class="small">体卦 · 我</span><b>' + R.ti + ' ' + R.tiWx + '</b><span>' + (R.tiState ? '月令 ' + R.tiState : '') + '</span></div>' + node('用卦 · 起因', R.chain[0].r, '', 1) + node('互卦 · 过程', R.chain[1].r, ' ／ ' + R.chain[1].r2.tri + R.chain[1].r2.rel, 2) + node('变卦 · 结果', R.chain[2].r, '', 3) + '</div>' +
    '<div class="row"><span class="chip ' + (final[0] === 'g' ? 'g' : final[0] === 'b' ? 'b' : '') + '">总势：' + final[1] + '</span><span class="small">用吉变凶是先吉后凶，用凶变吉是先难后易。“用”取传统规则，“总势”是本页的学习用加总。</span></div>';
  $$('[data-mv]', box).forEach(function (b) { b.onclick = function () { mhMove.mv = +b.getAttribute('data-mv'); drawMH(); }; });
}

// ---- 纳甲六爻 ----
var njStep = 7, njTopic = '妻财';
var TOPICS = [['求财、生意', '妻财'], ['工作、官运', '官鬼'], ['考试、文书、房车', '父母'], ['子女、平安', '子孙'], ['同伴、竞争', '兄弟']];
var STEPS = ['定宫', '纳干支', '世应', '六亲', '六神', '月日旺衰', '动变'];
views.nj = function () {
  view.innerHTML = '<section class="block"><h1>纳甲六爻</h1><p class="lede">这是民间最细的一套算法。按步骤把一卦“装”成一张表，再看要问的那一爻强不强。</p></section>' +
    '<section class="block"><div class="surface block"><div class="row"><label class="small" for="njt">起卦时间（北京时间）</label><input id="njt" type="datetime-local"><select id="njq" aria-label="问事类型">' + TOPICS.map(function (t) { return '<option value="' + t[1] + '">' + t[0] + '</option>'; }).join('') + '</select></div><div class="row"><div class="steps" id="stp"></div><button class="btn ghost" id="snext">一步步装卦</button></div><div class="row" id="njhead"></div><div class="scroll"><table class="nj" id="njtbl"></table></div><div class="chips" id="njtags"></div></div></section>' +
    '<section class="block">' + head('用神一条线', '谁生它，谁克它') + '<div class="surface split"><div class="chain" id="yc" style="grid-template-columns:repeat(5,minmax(0,1fr))"></div><div class="block" id="ysc"></div></div></section>' +
    '<section class="block">' + head('月建与日辰', '蓝是月建，黄是日辰，线是相冲') + '<div class="surface split"><div id="zr"></div><div class="block" id="zn"></div></div></section>' +
    '<section class="block">' + head('八宫图', '每宫八卦，一世到归魂') + '<div class="surface" id="pal"></div></section>';
  var c = cast(), t = c.t || nowBJ(), inp = $('#njt');
  function p2(n) { return String(n).padStart(2, '0'); }
  inp.value = t[0] + '-' + p2(t[1]) + '-' + p2(t[2]) + 'T' + p2(t[3]) + ':' + p2(t[4] || 0);
  $('#njq').value = njTopic;
  inp.oninput = drawNJ;
  $('#njq').onchange = function (e) { njTopic = e.target.value; drawNJ(); };
  $('#snext').onclick = function () { njStep = njStep >= 7 ? 1 : njStep + 1; drawNJ(); };
  drawNJ();
};
function drawNJ() {
  var m = $('#njt').value.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); if (!m) return;
  var t = Yi.ganzhi(+m[1], +m[2], +m[3], +m[4], +m[5]), v = cast().values, C = Yi.chart(v, t);
  $('#stp').innerHTML = STEPS.map(function (s, i) { return '<span class="st ' + (i + 1 < njStep ? 'done' : i + 1 === njStep ? 'cur' : '') + '">' + (i + 1) + ' ' + s + '</span>'; }).join('');
  var sn = njStep >= 7 ? '从头演示' : '下一步：' + STEPS[njStep];
  $('#snext').textContent = sn;
  $('#njhead').innerHTML = gua(C.bits, { size: 'mini', moving: C.moving }) + '<b style="font:900 18px var(--serif)">' + hexName(C.bits) + '</b><span class="chip">' + C.palace.palace + '宫 · ' + C.palace.wx + ' · ' + C.palace.level + '</span><span class="small">' + t.year + '年 ' + t.month + '月 ' + t.day + '日 ' + t.hour + '时　旬空 ' + C.kong.join('') + '</span>';
  function show(s) { return njStep >= s; }
  function cell(s, html) { return '<td class="' + (njStep === s ? 'in' : '') + (show(s) ? '' : ' hid') + '">' + (show(s) ? html : '') + '</td>'; }
  var thead = '<tr><th>爻</th><th>六神</th><th>六亲</th><th>干支</th><th>世应</th><th>旺衰</th><th>日辰</th><th>变爻</th></tr>';
  var rows = C.lines.slice().reverse().map(function (L) {
    var dr = L.dr, st = dr.state + (dr.monthBreak ? ' 月破' : ''), day = dr.dayRel + (dr.dayChong ? '·冲' : dr.dayHe ? '·合' : '') + (dr.anDong ? ' 暗动' : '') + (dr.dayBreak ? ' 日破' : '') + (dr.cs ? ' ' + dr.cs : '');
    var b = L.moving ? L.bian.qin + ' ' + L.bian.gan + L.bian.zhi + L.bian.wx + ' <span class="small">' + L.tags.join(' ') + '</span>' : '';
    return '<tr class="' + (L.qin === njTopic && show(4) ? 'yong' : '') + '"><td>' + label(L.i, L.yang) + (L.moving ? ' <b style="color:var(--move)">○</b>' : '') + '</td>' + cell(5, L.god) + cell(4, L.qin) + cell(2, L.gan + L.zhi + L.wx + (L.kong ? ' 空' : '')) + cell(3, L.shi ? '<b>世</b>' : L.ying ? '应' : '') + cell(6, st) + cell(6, day) + cell(7, b) + '</tr>';
  }).join('');
  $('#njtbl').innerHTML = thead + rows;
  var tags = [];
  if (C.chongHex) tags.push('<span class="chip b">六冲卦 · 事多散</span>');
  if (C.heHex) tags.push('<span class="chip g">六合卦 · 事易合</span>');
  C.hidden.forEach(function (x) { tags.push('<span class="chip">伏神 ' + x.qin + ' ' + x.gan + x.zhi + ' 在' + POS[x.i] + '爻下</span>'); });
  $('#njtags').innerHTML = tags.join('');
  // 用神
  var y = Yi.yongChain(njTopic), ls = C.lines.filter(function (L) { return L.qin === njTopic; });
  var list = ls.length ? ls : C.lines.filter(function (L) { return L.qin === y.yuan; });
  $('#yc').innerHTML = [['元神', y.yuan, 'g', '生用神'], ['用神', y.yong, '', '你问的事'], ['忌神', y.ji, 'b', '克用神'], ['仇神', y.chou, 'b', '克元神'], ['泄神', y.xie, '', '耗用神']].map(function (x, i) { return '<div class="cnode ' + x[2] + '" style="animation-delay:' + i * 90 + 'ms"><span class="small">' + x[0] + '</span><b>' + x[1] + '</b><span class="small">' + x[3] + '</span></div>'; }).join('');
  var sum = function (L) { return Yi.lineScore(L); };
  $('#ysc').innerHTML = '<div class="small">' + (ls.length ? njTopic + '爻强弱' : njTopic + '不上卦，先看伏神与元神') + '</div>' + list.map(function (L) {
    var s = sum(L), p = Math.max(-6, Math.min(6, s.score)) / 6 * 50;
    return '<div class="score"><span>' + label(L.i, L.yang) + ' ' + L.gan + L.zhi + '</span><span class="t"><s></s><i style="left:' + (p < 0 ? 50 + p : 50) + '%;width:' + Math.abs(p) + '%;background:var(--' + (p < 0 ? 'bad' : 'good') + ')"></i></span><b style="text-align:right">' + (s.score > 0 ? '+' : '') + s.score + '</b></div><div class="small">' + s.why.join('　') + '</div>';
  }).join('') + '<div class="small">分数是本页为初学者设的练习权重，古书并无此分。</div>';
  drawZhi(t);
  drawPal(C);
}
function drawZhi(t) {
  var mz = t.month[1], dz = t.day[1], pts = {};
  Yi.ZHI.forEach(function (z, i) { var a = (i * 30 - 90) * Math.PI / 180; pts[z] = [170 + 128 * Math.cos(a), 170 + 128 * Math.sin(a)]; });
  var lines = [[mz, 'var(--accent)'], [dz, 'var(--move)']].map(function (x) { var a = pts[x[0]], b = pts[Yi.chong(x[0])]; return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + x[1] + '" stroke-width="2.5"/>'; }).join('');
  var nodes = Yi.ZHI.map(function (z) { var p = pts[z], c = z === mz ? 'm' : z === dz ? 'd' : 'zb'; return '<circle class="' + c + '" cx="' + p[0] + '" cy="' + p[1] + '" r="19"/><text class="z ' + (c !== 'zb' ? 'mt' : '') + '" x="' + p[0] + '" y="' + (p[1] + 6) + '">' + z + '</text>'; }).join('');
  $('#zr').innerHTML = '<svg class="zhi-ring" viewBox="0 0 340 340" style="width:100%;max-width:320px;display:block;margin:auto" role="img" aria-label="十二地支图">' + lines + nodes + '</svg>';
  $('#zn').innerHTML = '<div class="big">' + t.month + '月 ' + t.day + '日</div><div class="chips"><span class="chip on">月建 ' + mz + ' 冲 ' + Yi.chong(mz) + '</span><span class="chip m">日辰 ' + dz + ' 冲 ' + Yi.chong(dz) + '</span><span class="chip">月五行 ' + Yi.ZHI_WX[mz] + '</span></div><div class="small">静爻被日冲：旺相是暗动，休囚是日破。</div>';
}
function drawPal(C) {
  var html = '<div class="matrix" style="grid-template-columns:34px repeat(8,minmax(0,1fr))">', byP = {};
  Object.keys(Yi.palaceMap).forEach(function (b) { var p = Yi.palaceMap[b]; (byP[p.palace] = byP[p.palace] || [])[p.order] = b; });
  html += '<span></span>' + ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'].map(function (x) { return '<span class="ax">' + x + '</span>'; }).join('');
  Yi.TRI.forEach(function (p) { html += '<span class="ax">' + p + '</span>' + byP[p].map(function (b) { return '<div class="cell ' + (b === C.bits ? 'hl' : '') + '" title="' + Yi.hex(b).name + '">' + gua(b, { size: 'mini' }) + '</div>'; }).join(''); });
  $('#pal').innerHTML = html + '</div>';
}

// ---- 六爻推演：野鹤规则逐步回放，可选接入模型 ----
var tui = { q: '', yong: '', step: 0, timer: null, r: null, C: null, t: null, llm: false, ai: null };
var PHASES = ['取用', '月建', '日辰', '旬空', '动变', '结论', '应期'];
views.tui = function () {
  var c = cast();
  if (!tui.q && !c.demo && c.q) tui.q = c.q;
  view.innerHTML = '<section class="block"><h1>六爻推演</h1><p class="lede">写下问题，规则引擎按《增删卜易》一步步推：先取用神，再看月日、旬空、动变，最后给吉凶和应期。每一步都能看到原文出处。</p></section>' +
    '<section class="block"><div class="surface block"><textarea id="tq" placeholder="例如：这个月能收回欠款吗？">' + esc(tui.q) + '</textarea><div class="qa" id="tqa" hidden></div>' +
    '<div class="row"><select id="ty" aria-label="用神"><option value="">用神：按问题自动取</option>' + ['父母', '兄弟', '子孙', '妻财', '官鬼', '世', '应'].map(function (y) { return '<option' + (tui.yong === y ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select><label class="small" for="tt">起卦时间</label><input id="tt" type="datetime-local"><a href="#l5" class="small">换一卦</a></div>' +
    '<div class="row" id="thd"></div></div></section>' +
    '<section class="block">' + head('推演回放', '点圆点可跳到任一阶段') + '<div class="surface block"><div class="phases" id="tph"></div>' +
    '<div class="tsplit"><div class="tchart" id="tch"></div><div class="block"><div class="tcard" id="tcd"></div><div class="tally" id="ttl"></div></div></div>' +
    '<div class="row"><button class="btn ghost" id="tpv" aria-label="上一步">上一步</button><button class="btn" id="tpl">播放</button><button class="btn ghost" id="tnx" aria-label="下一步">下一步</button><span class="small" id="tct"></span></div></div></section>' +
    '<section class="block">' + head('结论与应期', '应期候选标在地支环上') + '<div class="surface split"><div id="tzr"></div><div class="block" id="tvd"></div></div></section>' +
    '<section class="block" id="tai" hidden>' + head('多智能体解读', '每一步实时显示：请求、思考、工具、核对') + '<div class="surface block"><div class="row"><select id="tmd" aria-label="模式"><option value="single">只看野鹤断法</option><option value="compare">加上傅佩荣读辞对比</option></select><button class="btn" id="tgo">请智能体推算</button><span class="small" id="tst"></span></div><div class="pipe" id="tpipe" hidden></div><div class="aigrid" id="tgrid" hidden><div class="agents" id="tag"></div><aside class="alog" aria-label="实时日志"><div class="alh"><b>实时日志</b><span class="small" id="tlogn"></span></div><ol id="tlog"></ol></aside></div></div></section>';
  var t = c.t || nowBJ(), inp = $('#tt');
  function p2(n) { return String(n).padStart(2, '0'); }
  inp.value = t[0] + '-' + p2(t[1]) + '-' + p2(t[2]) + 'T' + p2(t[3]) + ':' + p2(t[4] || 0);
  $('#tq').oninput = function (e) { tui.q = e.target.value; tuiCompute(false); qaReset(); };
  $('#ty').onchange = function (e) { tui.yong = e.target.value; tuiCompute(true); };
  inp.oninput = function () { tuiCompute(true); };
  $('#tpv').onclick = function () { tuiStop(); tuiGo(tui.step - 1); };
  $('#tnx').onclick = function () { tuiStop(); tuiGo(tui.step + 1); };
  $('#tpl').onclick = function () {
    if (tui.timer) return tuiStop();
    if (tui.step >= tui.r.steps.length - 1) tui.step = -1;
    $('#tpl').textContent = '暂停';
    tui.timer = setInterval(function () { if (tui.step >= tui.r.steps.length - 1) return tuiStop(); tuiGo(tui.step + 1); }, 1500);
    tuiGo(tui.step + 1);
  };
  tuiCompute(true); tuiAI();
};
function tuiStop() { clearInterval(tui.timer); tui.timer = null; var b = $('#tpl'); if (b) b.textContent = '播放'; }
function tuiCompute(reset) {
  var m = $('#tt').value.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/); if (!m) return;
  var t = Yi.ganzhi(+m[1], +m[2], +m[3], +m[4], +m[5]), C = Yi.chart(cast().values, t);
  var cl = YiInfer.classify(tui.q), ai = tuiAiYong(), yong = tui.yong || (ai ? ai.yong : cl.yong), r = YiInfer.infer(C, { yong: yong });
  var changed = !tui.r || tui.r.label !== r.label || tui.C.bits !== C.bits || tui.t.day !== t.day || tui.t.month !== t.month;
  tui.t = t; tui.C = C; tui.r = r;
  $('#thd').innerHTML = gua(C.bits, { size: 'mini', moving: C.moving }) + '<b style="font:900 18px var(--serif)">' + hexName(C.bits) + '</b><span class="chip">' + t.month + '月 ' + t.day + '日</span><span class="chip">旬空 ' + C.kong.join('') + '</span><span class="chip on">' + yong + ' · ' + esc(r.label) + '</span><span class="small">' + (tui.yong ? '手动指定' : ai ? '问事官判定' : cl.hit ? '问题里有“' + esc(cl.hit) + '”→' + cl.why : cl.why) + '</span>';
  if (reset || changed) { tuiStop(); tui.step = 0; }
  tui.step = Math.min(tui.step, r.steps.length - 1);
  tuiGo(tui.step);
}
function tuiGo(k) {
  var r = tui.r, C = tui.C; if (!r) return;
  k = Math.max(0, Math.min(r.steps.length - 1, k)); tui.step = k;
  var s = r.steps[k], done = r.steps.slice(0, k + 1);
  var cur = PHASES.indexOf(s.phase);
  $('#tph').innerHTML = PHASES.map(function (p, i) {
    var first = -1; r.steps.some(function (x, j) { if (x.phase === p) { first = j; return true; } });
    return '<button class="ph ' + (i < cur ? 'done' : i === cur ? 'cur' : '') + '" ' + (first < 0 ? 'disabled' : 'data-j="' + first + '"') + '><i></i><span>' + p + '</span></button>';
  }).join('');
  $$('#tph [data-j]').forEach(function (b) { b.onclick = function () { tuiStop(); tuiGo(+b.getAttribute('data-j')); }; });
  // 排盘表 + 生克箭头
  var H = 42, rows = C.lines.slice().reverse().map(function (L) {
    var on = s.lines.indexOf(L.i) >= 0, isY = r.yong && !r.yong.fu && r.yong.i === L.i;
    var b = L.moving ? '→ ' + L.bian.qin + L.bian.zhi + L.bian.wx : '';
    return '<div class="trow ' + (on ? 'on ' : '') + (isY ? 'yong' : '') + '" style="height:' + H + 'px"><span>' + label(L.i, L.yang) + (L.moving ? '<b class="mvdot">○</b>' : '') + '</span><span>' + L.qin + '</span><span>' + L.gan + L.zhi + L.wx + (L.kong ? '<em>空</em>' : '') + '</span><span>' + (L.shi ? '<b>世</b>' : L.ying ? '应' : '') + '</span><span class="small">' + b + '</span></div>';
  }).join('');
  var y = function (i) { return (5 - i) * H + H / 2; };
  var arr = s.arrows.filter(function (a) { return a.from !== a.to; }).map(function (a) {
    var y1 = y(a.from), y2 = y(a.to), bend = 10 + Math.abs(y2 - y1) * 0.35, col = a.kind === '生' ? 'var(--good)' : 'var(--bad)';
    return '<path class="tarr" d="M30 ' + y1 + ' C' + (30 - bend) + ' ' + y1 + ' ' + (30 - bend) + ' ' + y2 + ' 30 ' + (y2 + (y2 > y1 ? -5 : 5)) + '" stroke="' + col + '" ' + (a.kind === '生' ? '' : 'stroke-dasharray="5 4"') + '/><path d="M30 ' + y2 + ' l-7 ' + (y2 > y1 ? -9 : 9) + ' l9 1z" fill="' + col + '"/><text x="' + (30 - bend - 4) + '" y="' + ((y1 + y2) / 2 + 5) + '" fill="' + col + '">' + a.kind + '</text>';
  }).join('');
  $('#tch').innerHTML = '<svg class="tsvg" viewBox="0 0 34 ' + 6 * H + '" style="height:' + 6 * H + 'px" aria-hidden="true">' + arr + '</svg><div class="trows">' + rows + '</div>' +
    (r.yong && r.yong.fu ? '<div class="small">用神不上卦，伏在' + POS[r.yong.i] + '爻下：' + r.yong.qin + r.yong.gan + r.yong.zhi + r.yong.wx + '</div>' : '');
  // 规则卡
  var R = YiInfer.RULES[s.rule] || {};
  $('#tcd').innerHTML = '<div class="row" style="justify-content:space-between"><span class="chip ' + (s.eff > 0 ? 'g' : s.eff < 0 ? 'b' : '') + '">' + s.phase + (s.eff > 0 ? ' · 生扶' : s.eff < 0 ? ' · 克害' : '') + '</span><span class="small">' + (k + 1) + ' / ' + r.steps.length + '</span></div><div class="tstep">' + esc(s.text) + '</div>' +
    (R.t ? '<div class="rule"><b>' + esc(R.t) + '</b><div class="quote">' + esc(R.q || '') + '</div><div class="small">' + esc(R.src || '') + '</div></div>' : '');
  var plus = done.filter(function (x) { return x.eff > 0; }).length, minus = done.filter(function (x) { return x.eff < 0; }).length, mx = Math.max(4, plus, minus);
  $('#ttl').innerHTML = '<div class="score"><span>生扶</span><span class="t"><i style="left:0;width:' + plus / mx * 100 + '%;background:var(--good)"></i></span><b>' + plus + '</b></div><div class="score"><span>克害</span><span class="t"><i style="left:0;width:' + minus / mx * 100 + '%;background:var(--bad)"></i></span><b>' + minus + '</b></div>';
  $('#tct').textContent = '“克少生多”只是野鹤的总原则，各条分量不等，结论以书中先后判断为准。';
  // 结论与应期（播到结论后揭晓）
  var shown = cur >= PHASES.indexOf('结论');
  var yz = shown ? r.yingqi.map(function (q) { return q.zhi; }) : [];
  tuiRing(tui.t, yz);
  $('#tvd').innerHTML = shown
    ? '<div class="verdict ' + (r.verdict === '吉' ? 'g' : r.verdict === '凶' ? 'b' : '') + '">' + r.verdict + '</div><div class="small">' + esc(r.label) + ' · 生扶 ' + r.plus + ' · 克害 ' + r.minus + (r.wait ? ' · 需待时' : '') + '</div><div class="block">' + r.yingqi.map(function (q) { return '<div><span class="chip m">' + q.zhi + '</span> <span class="small">' + esc(q.why.join('；')) + '</span></div>'; }).join('') + '</div>'
    : '<div class="small">播放到“结论”后揭晓。</div>';
}
function tuiRing(t, yz) {
  var pts = {};
  Yi.ZHI.forEach(function (z, i) { var a = (i * 30 - 90) * Math.PI / 180; pts[z] = [170 + 128 * Math.cos(a), 170 + 128 * Math.sin(a)]; });
  var nodes = Yi.ZHI.map(function (z) {
    var p = pts[z], c = z === t.month[1] ? 'm' : z === t.day[1] ? 'd' : 'zb', hit = yz.indexOf(z) >= 0;
    return (hit ? '<circle class="yq" cx="' + p[0] + '" cy="' + p[1] + '" r="25"/>' : '') + '<circle class="' + c + '" cx="' + p[0] + '" cy="' + p[1] + '" r="19"/><text class="z ' + (c !== 'zb' ? 'mt' : '') + '" x="' + p[0] + '" y="' + (p[1] + 6) + '">' + z + '</text>';
  }).join('');
  $('#tzr').innerHTML = '<svg class="zhi-ring" viewBox="0 0 340 340" style="width:100%;max-width:300px;display:block;margin:auto" role="img" aria-label="应期地支环">' + nodes + '<text class="z" x="170" y="166">月建 ' + t.month[1] + '</text><text class="z" x="170" y="190">日辰 ' + t.day[1] + '</text></svg>';
}
// 后端配置了模型才显示；单页（Artifact）里请求失败就保持隐藏
function tuiAI() {
  if (!window.fetch || location.protocol === 'file:') return;
  fetch('api/health').then(function (r) { return r.ok ? r.json() : null; }).then(function (h) {
    if (!h || !h.llm || !h.llm.configured || !$('#tai')) return;
    $('#tai').hidden = false; tui.llm = true; tuiCompute(false); qaReset();
    $('#tst').textContent = '模型 ' + h.llm.model + ' · 今日已用 ¥' + h.llm.spentToday + (h.llm.dailyBudget > 0 ? ' / ¥' + h.llm.dailyBudget : '');
    $('#tgo').onclick = function () {
      var m = $('#tt').value.match(/(\d+)-(\d+)-(\d+)T(\d+):(\d+)/), b = $('#tgo'), mode = $('#tmd').value;
      b.disabled = true; $('#tst').textContent = '连接服务…';
      var live = null, tick = setInterval(function () { if (live) live.tick(); }, 250);
      function end() { clearInterval(tick); if (live) live.tick(); b.disabled = false; }
      fetch('api/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ values: cast().values, time: { y: +m[1], m: +m[2], d: +m[3], h: +m[4], min: +m[5] }, question: tui.q, mode: mode }, tuiPicked())) })
        .then(function (r) {
          if (!r.ok || !r.body) return r.json().then(function (d) { $('#tst').textContent = d.error || '请求失败'; });
          live = agentLive(mode);
          return ndjson(r, live.on).then(function () { if (!live.ended) live.on({ type: 'error', error: '连接提前结束' }); });
        }).catch(function () { if (live) live.on({ type: 'error', error: '连接中断' }); else $('#tst').textContent = '连接中断'; }).then(end);
    };
  }).catch(function () { });
}
// 逐行读 NDJSON 事件流
function ndjson(r, on) {
  var rd = r.body.getReader(), dec = new TextDecoder(), buf = '';
  function pump() {
    return rd.read().then(function (x) {
      if (x.done) return;
      buf += dec.decode(x.value, { stream: true });
      var ls = buf.split('\n'); buf = ls.pop();
      ls.forEach(function (l) { if (l) { var ev; try { ev = JSON.parse(l); } catch (e) { return; } on(ev); } });
      return pump();
    });
  }
  return pump();
}
function tuiAiYong() { return tui.ai && tui.ai.q === tui.q.trim() ? tui.ai : null; }
// 推算时带上问题解析的结果，问事官这一步不再重复调用模型
function tuiPicked() {
  if (tui.yong) return { yong: tui.yong };
  var a = tuiAiYong();
  return a ? { yong: a.yong, yongBy: 'wenshi', yongReason: a.reason, yongConfidence: a.confidence } : {};
}

// ---- 问题解析：点按钮调用问事官，候选用神随思考实时变化 ----
var QY = ['父母', '兄弟', '子孙', '妻财', '官鬼', '世', '应'];
var QTERM = { 父母: /父母|parent/gi, 兄弟: /兄弟|sibling|brother/gi, 子孙: /子孙|offspring|descendant|medicine/gi, 妻财: /妻财|wealth|wife/gi, 官鬼: /官鬼|official|career/gi, 世: /世爻|取世|自占|self line/gi, 应: /应爻|取应|other party/gi };
var qa = { ctl: null, raf: 0 };
function qaAbort() { if (qa.ctl) { qa.ctl.abort(); qa.ctl = null; } cancelAnimationFrame(qa.raf); qa.raf = 0; }
function qaShell() {
  var box = $('#tqa'); if (!box) return null;
  if (!box.firstChild) {
    box.innerHTML = '<div class="qhd"><span class="atag">问</span><b>问题解析</b><span class="small" id="qst"></span><button class="btn" id="qgo">解析问题</button></div>' +
      '<div class="cands">' + QY.map(function (y) { return '<div class="cand" data-y="' + y + '"><span>' + y + '</span><i class="cbar"><b></b></i><em></em></div>'; }).join('') + '</div>' +
      '<div class="qthink small" hidden></div><div class="qres"></div>';
    $('#qgo').onclick = function () { qaRun(); };
  }
  box.hidden = false;
  return box;
}
function qaCands(kw, w, lock) {
  var mx = 0; QY.forEach(function (y) { mx = Math.max(mx, w[y] || 0); });
  QY.forEach(function (y) {
    var c = $('#tqa .cand[data-y="' + y + '"]'), v = mx ? (w[y] || 0) / mx : 0;
    c.className = 'cand' + (y === kw ? ' kw' : '') + (lock ? (y === lock ? ' lock' : ' off') : v === 1 ? ' lead' : '');
    $('.cbar b', c).style.width = (lock ? (y === lock ? 100 : v * 40) : v * 100).toFixed(0) + '%';
    $('em', c).textContent = y === lock ? '问事官' : y === kw ? '关键词' : '';
  });
}
// 思考文字里各用神被提到的次数，越靠后权重越大，近似模型此刻的倾向
function qaWeigh(text, kw) {
  var w = {}, n = text.length;
  QY.forEach(function (y) { var m, re = QTERM[y]; re.lastIndex = 0; w[y] = 0; while ((m = re.exec(text))) w[y] += Math.exp((m.index - n) / 400); });
  if (kw) w[kw] += 0.3; // 关键词初判留一点底分，思考刚开始时也有倾向
  return w;
}
// 问题改动后只更新关键词初判、取消进行中的解析；交给问事官要用户点按钮
function qaReset() {
  if (!tui.llm) return;
  var q = tui.q.trim(), box = qaShell(); if (!box) return;
  $('#qgo').disabled = q.length < 2;
  if (tuiAiYong()) return;
  var kw = YiInfer.classify(q).yong, w = {};
  qaAbort(); box.classList.remove('busy');
  $('.qthink', box).hidden = true; $('.qres', box).innerHTML = '';
  if (q.length < 2) { qaCands(kw, {}, null); $('#qst').textContent = '写好问题后点“解析问题”，问事官来取用神'; return; }
  w[kw] = 1; qaCands(kw, w, null);
  $('#qst').textContent = '关键词初判 ' + kw + ' · 写好后点“解析问题”交给问事官';
}
function qaRun() {
  var q = tui.q.trim(), box = qaShell(); if (!box || q.length < 2) return;
  qaAbort();
  var kw = YiInfer.classify(q).yong, ctl = window.AbortController ? new AbortController() : {}, t0 = Date.now(), first = 0, think = '', out = '', lock = null, done = false;
  qa.ctl = ctl;
  var st = $('#qst'), th = $('.qthink', box), res = $('.qres', box);
  th.hidden = true; th.textContent = ''; res.innerHTML = ''; box.classList.add('busy');
  function sec() { return ((Date.now() - t0) / 1000).toFixed(1); }
  function status() { st.textContent = !first ? '问事官已接到问题 · 等模型首字 ' + sec() + ' 秒' : lock ? '已定用神 ' + lock + ' · 正在写理由 · ' + sec() + ' 秒' : '问事官思考中 · ' + think.length + ' 字 · ' + sec() + ' 秒'; }
  var tick = setInterval(function () { if (done || qa.ctl !== ctl) return clearInterval(tick); status(); }, 200);
  status();
  function paint() { qa.raf = 0; if (!lock) qaCands(kw, qaWeigh(think, kw), null); th.textContent = think.slice(-70).replace(/\s+/g, ' '); }
  function on(ev) {
    if (qa.ctl !== ctl) return;
    if (ev.type === 'first') first = Date.now();
    else if (ev.type === 'delta' && ev.kind === 'reasoning') { think += ev.text; th.hidden = false; if (!qa.raf) qa.raf = requestAnimationFrame(paint); }
    else if (ev.type === 'delta') {
      out += ev.text;
      var m = out.match(/"yong"\s*:\s*"([^"]+)"/), rs = out.match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)/);
      if (m && !lock && QY.indexOf(m[1]) >= 0) { lock = m[1]; qaCands(kw, qaWeigh(think, kw), lock); th.hidden = true; }
      if (rs) res.innerHTML = '<div class="qreason">' + esc(rs[1].replace(/\\n/g, ' ')) + '<span class="caret"></span></div>';
    } else if (ev.type === 'final') {
      done = true; qa.ctl = null; box.classList.remove('busy'); th.hidden = true;
      tui.ai = { q: q, yong: ev.yong, reason: ev.reason, confidence: ev.confidence, clarify: ev.clarify };
      qaCands(kw, qaWeigh(think, kw), ev.yong);
      var pc = Math.round((+ev.confidence || 0) * 100);
      res.innerHTML = '<div class="row"><span class="chip on">用神 · ' + esc(ev.yong) + '</span><span class="conf"><i style="width:' + pc + '%"></i></span><span class="small">把握 ' + pc + '%</span>' + (ev.keyword && ev.keyword !== ev.yong ? '<span class="small">关键词表取 ' + esc(ev.keyword) + '，已改用问事官的结果</span>' : '') + '</div><div class="qreason">' + esc(ev.reason || '') + '</div>' + (ev.clarify ? '<div class="small qclar">问事官想确认：' + esc(ev.clarify) + '</div>' : '');
      st.textContent = '完成 · ' + sec() + ' 秒 · 思考 ' + think.length + ' 字 · ¥' + ev.cost;
      tuiCompute(false);
    } else if (ev.type === 'error') {
      done = true; qa.ctl = null; box.classList.remove('busy');
      st.textContent = ev.error + ' · 暂用关键词结果';
    }
  }
  fetch('api/yong', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: q }), signal: ctl.signal })
    .then(function (r) {
      if (!r.ok || !r.body) return r.json().then(function (d) { on({ type: 'error', error: d.error || '解析失败' }); });
      return ndjson(r, on).then(function () { if (!done) on({ type: 'error', error: '连接提前结束' }); });
    }).catch(function () { if (!done) on({ type: 'error', error: '连接中断' }); });
}

var AG = {
  问事官: ['问', '读你的问题，定用神', 1], 规则引擎: ['规', '按《增删卜易》逐步推理，本地计算', 0], 野鹤断卦师: ['断', '调用规则工具，写断语', 1],
  傅佩荣读辞师: ['辞', '按卦爻辞解读', 1], 审核官: ['审', '用代码逐条核对断卦师', 0], 讲解员: ['讲', '综合起来讲给你听', 1]
};
var SUBS = ['请求', '首字', '思考', '输出', '完成'];
function fmtN(n) { return n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(n); }
// 实时面板：流水线 + 角色卡 + 日志，全部由后端事件驱动
function agentLive(mode) {
  var names = ['问事官', '规则引擎', '野鹤断卦师'].concat(mode === 'compare' ? ['傅佩荣读辞师'] : []).concat(['审核官', '讲解员']);
  var t0 = Date.now(), st = {}, tot = { calls: 0, tin: 0, tout: 0, cost: 0 }, api = { ended: false }, logN = 0;
  names.forEach(function (n) { st[n] = { state: 'wait', sub: -1, think: 0, out: 0, tools: 0 }; });
  $('#tpipe').hidden = false; $('#tgrid').hidden = false; $('#tlog').innerHTML = '';
  $('#tpipe').innerHTML = '<div class="pnodes">' + names.map(function (n, i) { return (i ? '<i class="plink" data-l="' + i + '"></i>' : '') + '<div class="pnode wait" data-p="' + n + '"><span class="ptag">' + AG[n][0] + '</span><span class="pnm">' + n + '</span><span class="small pst">等待</span></div>'; }).join('') + '</div>' +
    '<div class="pbar"><i id="pfill"></i></div><div class="pstats small" id="pstats"></div>';
  $('#tag').innerHTML = names.map(function (n, i) {
    return '<div class="agent wait" id="ag' + i + '"><div class="ahd"><span class="atag">' + AG[n][0] + '</span><div class="anm"><b>' + n + '</b><span class="small">' + AG[n][1] + '</span></div><span class="astat small">等待上一步</span></div>' +
      (AG[n][2] ? '<ol class="asub">' + SUBS.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' : '') +
      '<div class="await" hidden><i class="shim"></i><span class="small awt"></span></div><div class="atools"></div><ol class="asteps"></ol>' +
      '<details class="athink" hidden><summary class="small">思考过程 <span class="athn"></span></summary><div class="athx"></div></details><div class="araw" hidden></div><div class="aout"></div><div class="ameta small"></div></div>';
  }).join('');
  function card(n) { var i = names.indexOf(n); return i < 0 ? null : $('#ag' + i); }
  function el(n, sel) { var c = card(n); return c ? $(sel, c) : null; }
  function sec() { return ((Date.now() - t0) / 1000).toFixed(1); }
  function log(n, cls, html) {
    var ol = $('#tlog'), stick = ol.scrollTop + ol.clientHeight >= ol.scrollHeight - 30;
    ol.insertAdjacentHTML('beforeend', '<li class="' + cls + '"><span class="lt">+' + sec() + 's</span>' + (n ? '<span class="ltag">' + AG[n][0] + '</span>' : '<span></span>') + '<span>' + html + '</span></li>');
    $('#tlogn').textContent = ++logN + ' 条';
    if (stick) ol.scrollTop = ol.scrollHeight;
  }
  function setState(n, state, txt) {
    var s = st[n]; s.state = state; var c = card(n); if (!c) return;
    c.className = 'agent ' + state; $('.astat', c).textContent = txt;
    var p = $('#tpipe [data-p="' + n + '"]'); p.className = 'pnode ' + state; $('.pst', p).textContent = txt;
  }
  function setSub(n, k) {
    var s = st[n]; s.sub = k; var ol = el(n, '.asub'); if (!ol) return;
    $$('li', ol).forEach(function (li, i) { li.className = i < k ? 'ok' : i === k ? 'cur' : ''; });
  }
  function progress() {
    var d = 0; names.forEach(function (n) { var s = st[n]; d += s.state === 'ok' ? 1 : s.state === 'run' ? Math.min(0.9, (s.sub + 1) / 6) : 0; });
    $('#pfill').style.width = (d / names.length * 100).toFixed(1) + '%';
    names.forEach(function (n, i) { if (i) { var l = $('#tpipe [data-l="' + i + '"]'); l.className = 'plink' + (st[names[i - 1]].state === 'ok' ? ' on' : ''); } });
    $('#pstats').innerHTML = '<span>已用 ' + sec() + ' 秒</span><span>完成 ' + names.filter(function (n) { return st[n].state === 'ok'; }).length + ' / ' + names.length + '</span><span>模型调用 ' + tot.calls + ' 次</span><span>输入 ' + fmtN(tot.tin) + ' · 输出 ' + fmtN(tot.tout) + ' tokens</span><span>花费 ¥' + tot.cost.toFixed(4) + '</span>';
  }
  api.tick = function () {
    names.forEach(function (n) {
      var s = st[n], w = el(n, '.awt'); if (s.state !== 'run' || !w) return;
      if (s.callAt && !s.firstAt) w.textContent = '已发出第 ' + s.calls + ' 次请求 · 上下文约 ' + fmtN(s.ctx) + ' tokens · 等模型首字 ' + ((Date.now() - s.callAt) / 1000).toFixed(1) + ' 秒';
      var m = el(n, '.ameta');
      if (m && s.firstAt) { var dt = (Date.now() - s.firstAt) / 1000; m.textContent = '思考 ' + s.think + ' 字 · 输出 ' + s.out + ' 字 · ' + Math.round((s.think + s.out) / Math.max(dt, 0.5)) + ' 字/秒'; }
    });
    if (!api.ended) $('#tst').textContent = '推算中 · ' + sec() + ' 秒';
    progress();
  };
  api.on = function (ev) {
    var n = ev.agent, s = st[n], c = n && card(n);
    if (ev.type === 'start') {
      s.at = Date.now(); setState(n, 'run', AG[n][2] ? '准备请求' : '计算中'); log(n, 'l-start', '<b>' + n + '</b> 开始');
      if (c) c.scrollIntoView && c.getBoundingClientRect().top > innerHeight && c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (ev.type === 'call') {
      s.calls = ev.n; s.ctx = ev.ctx; s.callAt = Date.now(); s.firstAt = 0; tot.calls++;
      setSub(n, 0); setState(n, 'run', '等首字'); el(n, '.await').hidden = false; el(n, '.araw').textContent = ''; el(n, '.araw').hidden = true;
      log(n, 'l-call', '发出模型请求 #' + ev.n + ' · ' + ev.msgs + ' 条消息 · 约 ' + fmtN(ev.ctx) + ' tokens' + (ev.tools.length ? ' · 可用工具 ' + ev.tools.join('、') : ''));
    } else if (ev.type === 'round') {
      if (ev.n > 1) log(n, 'l-note', '第 ' + ev.n + ' 轮：把工具结果交回模型');
    } else if (ev.type === 'first') {
      s.firstAt = Date.now(); el(n, '.await').hidden = true; setSub(n, 1);
      log(n, 'l-first', '首字到达 · 等了 ' + (ev.ms / 1000).toFixed(1) + ' 秒');
    } else if (ev.type === 'delta' && c) {
      if (ev.kind === 'reasoning') {
        if (s.sub < 2) { setSub(n, 2); setState(n, 'run', '思考中'); log(n, 'l-think', '开始思考'); }
        s.think += ev.text.length;
        var th = el(n, '.athink'); th.hidden = false; if (s.sub === 2) th.open = true;
        var x = el(n, '.athx'); x.textContent += ev.text; if (th.open) x.scrollTop = x.scrollHeight;
        el(n, '.athn').textContent = s.think + ' 字';
      } else {
        if (s.sub < 3) { setSub(n, 3); setState(n, 'run', '输出中'); el(n, '.athink').open = false; log(n, 'l-out', '开始输出' + (s.think ? '（思考了 ' + s.think + ' 字）' : '')); }
        s.out += ev.text.length;
        var raw = el(n, '.araw'); raw.hidden = false; raw.textContent += ev.text; raw.scrollTop = raw.scrollHeight;
      }
    } else if (ev.type === 'tool' && c) {
      s.tools++; setState(n, 'run', '执行工具');
      el(n, '.atools').insertAdjacentHTML('beforeend', '<div class="tool run" data-id="' + esc(ev.id) + '"><span class="tnm">' + esc(ev.name) + '</span><code>' + esc(JSON.stringify(ev.args)) + '</code><span class="small tres">执行中…</span></div>');
      log(n, 'l-tool', '调用工具 <code>' + esc(ev.name) + '</code> ' + esc(JSON.stringify(ev.args)));
    } else if (ev.type === 'tool_result' && c) {
      var t = $('.tool[data-id="' + (window.CSS && CSS.escape ? CSS.escape(ev.id) : ev.id) + '"]', c);
      if (t) { t.className = 'tool ok'; $('.tres', t).textContent = ev.summary; }
      log(n, 'l-res', '← ' + esc(ev.name) + '：' + esc(ev.summary));
    } else if (ev.type === 'parsed') {
      log(n, 'l-ok', '解析 JSON 成功：' + esc(ev.keys.join('、')));
    } else if (ev.type === 'note') {
      log(n, 'l-note', esc(ev.text));
    } else if (ev.type === 'usage') {
      tot.tin += ev.in; tot.tout += ev.out; tot.cost += ev.cost;
      log(n, 'l-use', '调用结束 · 输入 ' + fmtN(ev.in) + ' / 输出 ' + fmtN(ev.out) + ' tokens' + (ev.est ? '（估）' : '') + ' · ¥' + ev.cost.toFixed(4) + ' · ' + (ev.ms / 1000).toFixed(1) + ' 秒');
    } else if (ev.type === 'step' && c) {
      var k = $$('.asteps li', c).length;
      el(n, '.asteps').insertAdjacentHTML('beforeend', '<li class="' + (ev.eff > 0 ? 'g' : ev.eff < 0 ? 'b' : '') + '" style="animation-delay:' + k * 90 + 'ms"><span class="chip">' + ev.phase + '</span>' + esc(ev.text) + '</li>');
      log(n, 'l-step', '[' + ev.phase + '] ' + esc(ev.text));
    } else if (ev.type === 'check' && c) {
      log(n, ev.ok ? 'l-ok' : 'l-bad', (ev.ok ? '✓ ' : '✗ ') + esc(ev.text));
    } else if (ev.type === 'done' && c) {
      setSub(n, 5); setState(n, 'ok', '完成 · ' + ((Date.now() - s.at) / 1000).toFixed(1) + ' 秒' + (ev.cost ? ' · ¥' + ev.cost : ''));
      el(n, '.await').hidden = true; el(n, '.araw').hidden = true; el(n, '.athink').open = false;
      el(n, '.aout').innerHTML = agentBody(ev);
      if (s.firstAt) el(n, '.ameta').textContent = '思考 ' + s.think + ' 字 · 输出 ' + s.out + ' 字' + (s.tools ? ' · 工具 ' + s.tools + ' 次' : '');
      log(n, 'l-done', '<b>' + n + '</b> 完成');
    } else if (ev.type === 'final') {
      api.ended = true; progress();
      $('#tst').textContent = '完成 · 用时 ' + sec() + ' 秒 · 调用 ' + ev.usage.calls.length + ' 次 · 花费 ¥' + ev.usage.cost;
      log(null, 'l-done', '全部完成 · 花费 ¥' + ev.usage.cost);
    } else if (ev.type === 'error') {
      api.ended = true;
      names.forEach(function (k) { if (st[k].state === 'run') setState(k, 'err', '失败'); else if (st[k].state === 'wait') setState(k, 'skip', '未运行'); });
      $('#tst').textContent = ev.error; log(null, 'l-bad', esc(ev.error));
    }
    progress();
  };
  progress();
  return api;
}
function verdictTag(v) { return '<span class="vbadge ' + (v === '吉' ? 'g' : v === '凶' ? 'b' : '') + '">' + esc(v) + '</span>'; }
function agentBody(x) {
  var o = x.out, a = x.agent;
  if (a === '讲解员' && typeof o === 'string') return '<div class="narr">' + esc(o).split(/\n+/).filter(Boolean).map(function (p) { return '<p>' + p.replace(/^(处境|依据|提醒|应期)：/, '<b>$1</b>').replace(/（(规则|解读)）/g, '<span class="src $1">$1</span>') + '</p>'; }).join('') + '</div>';
  if (typeof o === 'string') return '<div class="ai">' + esc(o) + '</div>';
  if (a === '审核官') return o.map(function (c, i) { return '<div class="chk ' + (c.ok ? 'ok' : 'bad') + '" style="animation-delay:' + i * 120 + 'ms"><span>' + (c.ok ? '✓' : '✗') + '</span>' + esc(c.text) + '</div>'; }).join('');
  if (a === '问事官') return '<div class="row"><span class="chip on">用神 · ' + esc(o.yong) + '</span><span class="conf"><i style="width:' + Math.round((+o.confidence || 0) * 100) + '%"></i></span><span class="small">把握 ' + Math.round((+o.confidence || 0) * 100) + '%</span></div><div>' + esc(o.reason) + '</div>' + (o.clarify ? '<div class="small">可以补充：' + esc(o.clarify) + '</div>' : '');
  if (a === '规则引擎') return '<div class="row">' + verdictTag(o.verdict) + '<span class="small">' + esc(o.yong) + ' · 生扶 ' + o.plus + ' · 克害 ' + o.minus + '</span></div><div class="chips">' + o.yingqi.map(function (y) { return '<span class="chip m" title="' + esc(y.why) + '">应期 ' + y.zhi + '</span>'; }).join('') + '</div>';
  if (a === '野鹤断卦师') return '<div class="row">' + verdictTag(o.verdict) + '<div>' + esc(o.summary) + '</div></div><ol class="reasons">' + (o.reasons || []).map(function (r) { var R = YiInfer.RULES[r.rule]; return '<li>' + esc(r.text) + (r.rule ? ' <span class="chip" title="' + esc(R ? R.src + '：' + R.q : '未知规则') + '">' + esc(R ? R.t : r.rule) + '</span>' : '') + '</li>'; }).join('') + '</ol><div class="block">' + (o.yingqi || []).map(function (y) { return '<div><span class="chip m">' + esc(y.zhi) + '</span> <span class="small">' + esc(y.why) + '</span></div>'; }).join('') + '</div>' + (o.advice ? '<div class="advice">' + esc(o.advice) + '</div>' : '');
  if (a === '傅佩荣读辞师') return (o.source ? o.source.texts.map(function (t) { return '<div class="quote">' + esc(t.title) + '：' + esc(t.text) + '</div>'; }).join('') : '') + '<div>' + esc(o.summary) + '</div><div class="small">' + esc(o.reading) + '</div>' + (o.advice ? '<div class="advice">' + esc(o.advice) + '</div>' : '');
  return '<div class="ai">' + esc(JSON.stringify(o, null, 1)) + '</div>';
}

// ---- 卦典 ----
var dictSel = 1, dictLine = 0, showTrad = false;
views.dict = function () {
  view.innerHTML = '<section class="block"><h1>卦典与课程</h1><p class="lede">听到哪一卦，就点哪一卦。绿色下划线表示你学过了。</p></section><div class="dictgrid" id="dg"></div><div id="dd"></div>';
  drawGrid(); drawDetail();
};
function drawGrid() {
  $('#dg').innerHTML = HEX.map(function (h) { return '<button class="dcell ' + (dictSel === h.kw ? 'sel' : '') + (S.learned[h.kw] ? ' done' : '') + '" data-k="' + h.kw + '">' + gua(h.bits, { size: 'mini' }) + h.name + '</button>'; }).join('');
  $$('#dg .dcell').forEach(function (b) { b.onclick = function () { dictSel = +b.getAttribute('data-k'); dictLine = 0; drawGrid(); drawDetail(); }; });
}
function fuBlock(h) {
  var eps = FU.filter(function (e) { return e.k === h.kw; }), n = FU_NOTES[h.kw], s = '';
  if (eps.length) s += '<div class="row"><b>《易经详解》第 ' + eps.map(function (e) { return e.ep; }).join('、') + ' 集</b><span class="chip on">' + eps[0].t + '</span></div>';
  else s += '<div class="small">这一讲的文字稿暂未公开取得。</div>';
  if (n && n.tip) s += '<div>' + n.tip + '</div>';
  var ex = [];
  if (n && n.zhu != null) ex.push('主爻 ' + label(n.zhu, h.bits[n.zhu] === '1'));
  else if (Yi.rareLine(h.bits) >= 0) { var r = Yi.rareLine(h.bits); ex.push('主爻 ' + label(r, h.bits[r] === '1') + '（按少数原则）'); }
  if (n && n.bian) ex.push('由' + n.bian + '卦变来');
  if (ex.length) s += '<div class="chips">' + ex.map(function (e) { return '<span class="chip">' + e + '</span>'; }).join('') + '</div>';
  if (eps.length) s += '<div class="row small">' + eps.map(function (e) { return '<a target="_blank" rel="noopener" href="https://www.pascal-man.com/navigation/faq-java-browser/PDF-I-Ching/Pei-Jung-Fu-' + e.ep + '.pdf">第 ' + e.ep + ' 集讲稿 PDF</a><a target="_blank" rel="noopener" href="' + e.u + '">原博文</a>'; }).join(' ') + '</div>';
  return '<div class="fu">' + s + '</div>';
}
function drawDetail() {
  var h = HEX[dictSel - 1], t = showTrad ? TRAD[dictSel - 1] : h, g = GLOSS[dictSel - 1];
  var yaoN = t.lines.length, sel = Math.min(dictLine, yaoN - 1), cur = t.lines[sel];
  var glossT = sel === 6 ? g[2] : g[1][sel];
  var yaos = t.lines.map(function (l, i) { return '<button class="yao ' + (i === sel ? 'on' : '') + '" data-y="' + i + '"><b>' + l.label + '</b><span>' + markVerdict(l.text) + '</span></button>'; }).reverse().join('');
  $('#dd').innerHTML = '<div class="surface block"><div class="row" style="justify-content:space-between"><div class="row">' + gua(h.bits, { size: 'lg', hot: sel < 6 ? [sel] : [], btn: false }) + '<div class="block" style="gap:4px"><span class="small">第 ' + h.kw + ' 卦 · ' + t.lower + '下' + t.upper + '上</span><div class="big">' + hexName(h.bits) + '</div><div>' + g[0] + '</div><div class="chips"><button class="chip ' + (S.learned[h.kw] ? 'g' : '') + '" id="lrn">' + (S.learned[h.kw] ? '已学完' : '标为已学') + '</button><button class="chip" id="trd">' + (showTrad ? '切到简体' : '看繁体') + '</button></div></div></div></div>' +
    '<div class="split"><div class="block"><div class="quote">' + markVerdict(t.judgment) + '</div><div class="small">' + esc(t.daxiang) + '</div><div class="target main"><div class="small">' + cur.label + ' · 小象</div><div class="quote">' + markVerdict(cur.text) + '</div><div>' + glossT + '</div><div class="small">' + esc(t.smallxiang[sel] || '') + '</div></div>' + fuBlock(h) + '<details><summary>彖传全文</summary><p class="quote">' + esc(t.tuan) + '</p></details></div><div class="block"><div>' + yaos + '</div><textarea id="note" placeholder="听课笔记，自动保存">' + esc(S.notes[h.kw] || '') + '</textarea></div></div></div>';
  $$('.yao').forEach(function (b) { b.onclick = function () { dictLine = +b.getAttribute('data-y'); drawDetail(); }; });
  $('#lrn').onclick = function () { if (S.learned[h.kw]) delete S.learned[h.kw]; else S.learned[h.kw] = Date.now(); save(); drawGrid(); drawDetail(); };
  $('#trd').onclick = function () { showTrad = !showTrad; drawDetail(); };
  $('#note').oninput = function (e) { S.notes[h.kw] = e.target.value; save(); };
}

// ---- 练习：简单的盒子记忆法，答对升盒，答错回到第 0 盒 ----
var INTERVAL = [0, 1, 3, 7];
function dayNow() { return Math.floor(Date.now() / 86400000); }
function pickCard() {
  var due = HEX.map(function (h) { var b = S.box[h.kw] || { b: 0, next: 0 }; return { h: h, b: b }; }).filter(function (x) { return x.b.next <= dayNow(); });
  due.sort(function (a, b) { return a.b.b - b.b.b || Math.random() - .5; });
  return (due[0] || { h: HEX[Math.floor(Math.random() * 64)] }).h;
}
function shuffle(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
views.drill = function () {
  view.innerHTML = '<section class="block"><h1>记忆练习</h1><p class="lede">答对的卦间隔更久才再出现，答错的马上回来。</p></section><section class="block"><div class="surface"><div class="master" id="ms"></div></div></section><section class="surface q" id="q"></section>';
  nextQ();
};
function drawMaster() { $('#ms').innerHTML = HEX.map(function (h) { var b = (S.box[h.kw] || {}).b || 0; return '<i class="b' + b + '" title="' + h.name + '"></i>'; }).join(''); }
function nextQ() {
  drawMaster();
  var h = pickCard(), type = Math.floor(Math.random() * 4), box = $('#q');
  function others(prop) { return shuffle(HEX.filter(function (x) { return x !== h; })).slice(0, 3).map(prop); }
  function mark(ok) { var cur = S.box[h.kw] || { b: 0 }; var nb = ok ? Math.min(cur.b + 1, 3) : 0; S.box[h.kw] = { b: nb, next: dayNow() + INTERVAL[nb] }; save(); drawMaster(); }
  function choice(prompt, right, wrong) {
    var opts = shuffle([right].concat(wrong));
    box.innerHTML = prompt + '<div class="opts">' + opts.map(function (o) { return '<button class="opt">' + o + '</button>'; }).join('') + '</div><div id="fb"></div>';
    $$('.opt', box).forEach(function (b) { b.onclick = function () { var ok = b.textContent === right; $$('.opt', box).forEach(function (x) { x.onclick = null; if (x.textContent === right) x.classList.add('y'); }); if (!ok) b.classList.add('n'); mark(ok); $('#fb', box).innerHTML = '<button class="btn" id="go">下一题</button>'; $('#go').onclick = nextQ; }; });
  }
  if (type === 0) choice(gua(h.bits, { size: 'lg' }) + '<b>这是哪一卦？</b>', h.name, others(function (x) { return x.name; }));
  else if (type === 1) choice('<div class="big">' + h.name + '</div><b>上下卦是？</b>', h.lower + '下' + h.upper + '上', others(function (x) { return x.lower + '下' + x.upper + '上'; }));
  else if (type === 2) {
    var r = Math.floor(Math.random() * 6) + 1, cases = { 1: '本卦变爻', 2: '本卦两变爻，取上爻', 3: '本卦、之卦卦辞', 4: '之卦两不变爻，取下爻', 5: '之卦唯一不变爻', 6: '之卦卦辞' };
    choice('<div class="big">' + r + ' 爻变</div><b>按朱熹，该读什么？</b>', cases[r], shuffle(Object.keys(cases).filter(function (k) { return +k !== r; })).slice(0, 3).map(function (k) { return cases[k]; }));
  } else {
    var tmp = '000000';
    (function draw() {
      box.innerHTML = '<div class="big">画出「' + h.name + '」</div>' + gua(tmp, { size: 'lg', btn: true }) + '<button class="btn" id="dn">对答案</button>';
      $$('.ln', box).forEach(function (b) { b.onclick = function () { tmp = Yi.flip(tmp, [+b.getAttribute('data-i')]); draw(); }; });
      $('#dn').onclick = function () { var ok = tmp === h.bits; mark(ok); box.innerHTML = '<span class="chip ' + (ok ? 'g' : 'b') + '">' + (ok ? '画对了' : '正确是这样') + '</span>' + gua(h.bits, { size: 'lg' }) + '<button class="btn" id="go">下一题</button>'; $('#go').onclick = nextQ; };
    })();
  }
}

// ---- 路由与导航 ----
function nav() {
  var cur = location.hash.slice(1) || 'home';
  function step(l) { return '<a class="step ' + (cur === l.id ? 'on' : '') + '" href="#' + l.id + '"><span class="tag">' + l.tag + '</span><span class="nm">' + l.nm + '</span>' + (S.levels[l.id] !== undefined || LEVELS.indexOf(l) >= 0 ? '<span class="dot ' + (S.levels[l.id] ? 'done' : '') + '"></span>' : '<span></span>') + '</a>'; }
  $('#ladder').innerHTML = LEVELS.slice().reverse().map(step).join('');
  $('#adv').innerHTML = ADV.map(step).join('');
  $('#tools').innerHTML = TOOLS.map(step).join('');
}
function route() {
  cancelAnimationFrame(dayanRaf); tuiStop(); qaAbort();
  var id = location.hash.slice(1) || 'home';
  if (!views[id]) id = 'home';
  nav(); views[id]();
  var m = $('main'); if (m) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
connectStore();
})();
