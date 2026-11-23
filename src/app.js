// 页面层：路由、状态、零基础主线与进阶工具。经文在 DATA，演算在 Yi，课程在 Lessons。
(function () {
'use strict';
var HEX = DATA.simp, TRAD = DATA.trad, FU = DATA.fu;
Yi.init(HEX, DATA.lunar);
var $ = function (s, e) { return (e || document).querySelector(s); };
var $$ = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var view = $('#view');
var POS = ['初', '二', '三', '四', '五', '上'];
var PRAC = [{ id: 'l5', tag: '起', nm: '起卦实操' }, { id: 'l6', tag: '解', nm: '变爻解卦' }];
var ADV = [{ id: 'mh', tag: '梅', nm: '梅花易数' }, { id: 'nj', tag: '纳', nm: '纳甲六爻' }, { id: 'tui', tag: '推', nm: '六爻推演' }];
var TOOLS = [{ id: 'dict', tag: '典', nm: '卦典与笔记' }, { id: 'drill', tag: '练', nm: '分级练习' }, { id: 'qa', tag: '问', nm: '初学十二问' }];
var DEMO = { values: [7, 9, 8, 8, 7, 8], q: '这辆车可以买吗？（示例：节卦九二）', method: '数字卦', demo: true, t: [2026, 11, 9, 10] };

// ---- 状态：登录时存账号（跨设备），否则存本机 ----
var S = {
  learned: {}, notes: {}, box: {}, cast: null, history: [],
  levels: {}, learnMode: 'guided', lessonStep: {}, stepDone: {}, drillTier: null,
  castLogs: {},
  updatedAt: 0
};
var dbRef = null, saveTimer = null;
function normalizeState() {
  S.learned = S.learned || {};
  S.notes = S.notes || {};
  S.box = S.box || {};
  S.history = Array.isArray(S.history) ? S.history : [];
  S.levels = S.levels || {};
  S.lessonStep = S.lessonStep || {};
  S.stepDone = S.stepDone || {};
  S.castLogs = S.castLogs || {};
  if (S.learnMode !== 'overview') S.learnMode = 'guided';
}
function save() {
  S.updatedAt = Date.now();
  try { localStorage.setItem('yijing', JSON.stringify(S)); } catch (e) { }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () { if (dbRef) dbRef.set(JSON.parse(JSON.stringify(S))).catch(function () { }); }, 1200);
}
try { var raw = localStorage.getItem('yijing'); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) { }
normalizeState();

function connectStore() {
  if (!window.claude || !claude.use) return;
  Promise.all([claude.use('db'), claude.use('user')]).then(function (r) {
    var db = r[0], user = r[1];
    if (!db || !user || !user.id) return;
    return user.id().then(function (id) {
      if (!id) return;
      dbRef = db.collection('data/users/' + id).doc('progress');
      return dbRef.get().then(function (snap) {
        if (snap.exists && (snap.data().updatedAt || 0) > S.updatedAt) { S = Object.assign(S, snap.data()); normalizeState(); route(); }
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
  if (o.btn) return '<button type="button" class="' + c + '" data-i="' + i + '" aria-label="切换' + POS[i] + '爻">' + inner + '</button>';
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
function finishBtn(id) { var d = S.levels[id]; return '<div class="row"><button type="button" class="btn ' + (d ? 'ghost' : '') + '" data-finish="' + id + '">' + (d ? '已学完，再复习' : '这一步学完了') + '</button></div>'; }
function bindFinish() { $$('[data-finish]').forEach(function (b) { b.onclick = function () { var id = b.getAttribute('data-finish'); S.levels[id] = !S.levels[id]; save(); route(); }; }); }
function fuZhu(b) { var n = FU_NOTES[Yi.hex(b).kw]; return n && n.zhu != null ? n.zhu : Yi.rareLine(b); }
function recommendedTier() {
  var base7 = ['c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6'].every(function (id) { return S.levels[id]; });
  if (base7 || (S.levels.c6 && (S.levels.l5 || S.levels.l6))) return 5;
  if (S.levels.c5 || S.levels.c6) return 4;
  if (S.levels.c3) return 3;
  if (S.levels.c1) return 2;
  return 1;
}

// ---- 零基础首页 ----
var views = {};
views.home = function () {
  var d = new Date(), seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  var today = HEX[seed % 64], g = GLOSS[today.kw - 1];
  var doneHex = Object.keys(S.learned).length;
  var totalLessons = Lessons.LIST.length;
  var doneLessons = Lessons.LIST.filter(function (l) { return S.levels[l.id]; }).length;
  var nextLesson = Lessons.LIST.filter(function (l) { return !S.levels[l.id]; })[0] || null;
  var ctaHref = nextLesson ? ('#' + nextLesson.id) : '#l5';
  var ctaText = doneLessons === 0 ? '从第 0 课开始（破冰）' : (nextLesson ? ('继续：第 ' + nextLesson.tag + ' 课 · ' + nextLesson.short) : '全套微课已完 · 去实战起卦');
  var recTier = recommendedTier();

  function cardHTML(l, isNext) {
    var done = !!S.levels[l.id];
    return '<a class="rm-card' + (done ? ' done' : '') + (isNext ? ' next' : '') + '" href="#' + l.id + '">' +
      '<div class="row" style="justify-content:space-between"><span class="rm-tag">' + l.tag + '</span>' +
      (done ? '<span class="chip g">已学</span>' : isNext ? '<span class="chip m">下一步</span>' : '') + '</div>' +
      '<b>' + l.nm + '</b><span class="small">' + l.desc + '</span></a>';
  }
  var s1 = Lessons.LIST.filter(function (l) { return l.stage === 1; });
  var s2 = Lessons.LIST.filter(function (l) { return l.stage === 2; });
  var s3 = Lessons.LIST.filter(function (l) { return l.stage === 3; });

  var dailySection = '';
  if (S.levels.c3) {
    dailySection = '<section class="block">' + head('今日一卦', '换一天换一卦，点开看全文与注脚') +
      '<a class="surface row" href="#dict" data-kw="' + today.kw + '" style="text-decoration:none;color:inherit">' +
      gua(today.bits, { size: 'mid' }) + '<div><div class="big">' + hexName(today.bits) + '</div><div>' + g[0] + '</div></div>' +
      '<div class="quote" style="flex:1;min-width:220px">' + today.judgment + '</div></a></section>';
  } else {
    var ansRight = today.lower + '(' + Yi.IMG[today.lower] + ')下 · ' + today.upper + '(' + Yi.IMG[today.upper] + ')上';
    var wrongs = [], used = {}; used[ansRight] = true;
    for (var wi = 1; wrongs.length < 3 && wi < 64; wi++) {
      var cand = HEX[(seed + wi * 7) % 64];
      var lbl = cand.lower + '(' + Yi.IMG[cand.lower] + ')下 · ' + cand.upper + '(' + Yi.IMG[cand.upper] + ')上';
      if (!used[lbl]) { used[lbl] = true; wrongs.push(lbl); }
    }
    var opts = [ansRight].concat(wrongs).sort(function () { return Math.random() - 0.5; });
    dailySection = '<section class="block">' + head('今日一练 · 先认卦象', '学完第 3 课自动升级为完整每日一卦') +
      '<div class="surface split" id="daily-q"><div class="row" style="gap:20px">' + gua(today.bits, { size: 'lg', cls: 'gap-mid' }) +
      '<div class="block" style="gap:6px"><b>看这一卦由哪两个八卦叠成？</b><span class="small">提醒：下面三画是下卦，上面三画是上卦。</span></div></div>' +
      '<div class="block"><div class="opts" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">' +
      opts.map(function (o) { return '<button type="button" class="opt" data-ok="' + (o === ansRight ? 1 : 0) + '">' + o + '</button>'; }).join('') +
      '</div><div id="daily-fb"></div></div></div></section>';
  }

  view.innerHTML =
    '<section class="hero">' +
      '<div class="surface block">' +
        '<span class="chip on" style="align-self:flex-start">零基础交互学习 · 闯关 / 全览双模式</span>' +
        '<div class="row" style="justify-content:space-between;align-items:baseline"><b>课程总进度</b><span class="small">' + doneLessons + ' / ' + totalLessons + ' 课</span></div>' +
        '<div class="pbar"><i style="width:' + Math.round(doneLessons / totalLessons * 100) + '%"></i></div>' +
        '<div class="small" style="line-height:1.7">先破除算命迷思与“一字一义”，掌握画卦与读辞尺子，再精读乾坤谦与四大难卦、建立生活化的哲思坐标。全部微课都在浏览器里直接动手完成。</div>' +
      '</div>' +
      '<div class="block">' +
        '<h1>从一根阴阳线，读懂整本《易经》</h1>' +
        '<p class="lede">' + totalLessons + ' 门微课由浅入深：前 7 课过符号与读经关，后 4 课精读代表卦与《系辞》哲学，配套情境解卦工坊与初学十二问。</p>' +
        '<div class="row"><a class="btn" href="' + ctaHref + '" style="text-decoration:none">' + ctaText + '</a>' +
        '<a class="btn ghost" href="#drill" style="text-decoration:none">分级练习（推荐第 ' + recTier + ' 阶）</a>' +
        '<a class="btn ghost" href="#qa" style="text-decoration:none">初学十二问</a></div>' +
        '<div class="row small"><span>' + doneLessons + ' / ' + totalLessons + ' 门课完成</span><span>已解锁第 ' + recTier + ' 阶练习</span><span>' + doneHex + ' / 64 卦已学</span></div>' +
      '</div>' +
    '</section>' +
    '<section class="block">' + head('学习路线图', '从 00 到 10 循序渐进；带✓代表已学完') +
      '<div class="block"><h3>阶段一 · 破冰与符号语法</h3><div class="roadmap">' + s1.map(function (l) { return cardHTML(l, nextLesson && nextLesson.id === l.id); }).join('') + '</div></div>' +
      '<div class="block"><h3>阶段二 · 读经解码器</h3><div class="roadmap rm-3">' + s2.map(function (l) { return cardHTML(l, nextLesson && nextLesson.id === l.id); }).join('') + '</div></div>' +
      (s3.length ? '<div class="block"><h3>阶段三 · 代表卦精读与哲思</h3><div class="roadmap">' + s3.map(function (l) { return cardHTML(l, nextLesson && nextLesson.id === l.id); }).join('') + '</div></div>' : '') +
      '<div class="block"><h3>阶段四 · 实操与解惑</h3><div class="roadmap rm-3">' +
        '<a class="rm-card' + (S.levels.l5 ? ' done' : '') + '" href="#l5"><div class="row" style="justify-content:space-between"><span class="rm-tag">起</span>' + (S.levels.l5 ? '<span class="chip g">已体验</span>' : '') + '</div><b>起卦实操</b><span class="small">三不占原则 · 大衍蓍草 · 铜钱 · 数字卦</span></a>' +
        '<a class="rm-card' + (S.levels.l6 ? ' done' : '') + '" href="#l6"><div class="row" style="justify-content:space-between"><span class="rm-tag">解</span>' + (S.levels.l6 ? '<span class="chip g">已体验</span>' : '') + '</div><b>变爻解卦与情境工坊</b><span class="small">朱熹变爻 · 同爻异境 · 研易复盘笔记</span></a>' +
        '<a class="rm-card" href="#qa"><div class="row" style="justify-content:space-between"><span class="rm-tag">问</span><span class="chip">答疑</span></div><b>初学十二问</b><span class="small">经传关系 · 天道吉凶 · 占卦与理性</span></a>' +
      '</div></div>' +
    '</section>' +
    dailySection +
    '<section class="block">' + head('能力地图', '学完这套教程，你能亲手做到四件事') + '<div class="chain">' +
      [['认', '不用死背，用“以少为主”推出八卦与画法'], ['读', '拆开经文与《十翼》，不再被吉凶词吓住'], ['判', '用当位、得中、正应量出一爻的真实处境'], ['用', '守住“三不占”理性起卦，找到当下该读的那一句']].map(function (x, i) {
        return '<div class="cnode" style="animation-delay:' + i * 70 + 'ms"><b>' + x[0] + '</b><span class="small">' + x[1] + '</span></div>';
      }).join('') + '</div></section>';

  var kwA = $('a[data-kw]');
  if (kwA) kwA.onclick = function () { dictSel = today.kw; };
  var dq = $('#daily-q');
  if (dq) {
    $$('#daily-q .opt').forEach(function (b) {
      b.onclick = function () {
        var ok = b.getAttribute('data-ok') === '1';
        $$('#daily-q .opt').forEach(function (x) { x.classList.remove('y', 'n'); if (x.getAttribute('data-ok') === '1') x.classList.add('y'); });
        if (!ok) b.classList.add('n');
        $('#daily-fb').innerHTML = '<div class="mfb ' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ 认对啦！' : '看看正解：') +
          '<b>' + hexName(today.bits) + '</b>（' + ansRight + '）——' + g[0] + '。' +
          '<div class="quote" style="margin-top:4px">' + esc(today.judgment) + '</div>' +
          '<a class="btn ghost" href="#dict" id="daily-dict" style="display:inline-block;margin-top:6px;text-decoration:none">去卦典看全文</a></div>';
        $('#daily-dict').onclick = function () { dictSel = today.kw; };
      };
    });
  }
};

// ---- 零基础 7 门微课（c0..c6） ----
var verdict = function (t) { var m = t.match(VRE); return m ? VERD[m[m.length - 1]] : 0; };
var VERD = { 元吉: 3, 大吉: 3, 吉: 2, 无不利: 2, 无咎: 1, 无悔: 1, 悔亡: 1, 亨: 1, 悔: -1, 吝: -1, 厉: -2, 凶: -3 };
var VRE = /元吉|大吉|无不利|无咎|无悔|悔亡|吉|凶|厉|吝|悔|亨/g;
function markVerdict(t) { return esc(t).replace(VRE, function (w) { var v = VERD[w]; return '<mark class="' + (v > 0 ? 'g' : v < -1 ? 'b' : 'w') + '">' + w + '</mark>'; }); }
var vClass = { 3: 'v3', 2: 'v2', 1: 'v1', 0: '', '-1': 'vm1', '-2': 'vm2', '-3': 'vm3' };

var lessonCtx = {
  HEX: HEX, GLOSS: GLOSS, FU_NOTES: FU_NOTES, S: S, save: save, route: route,
  gua: gua, tri: tri, label: label, hexName: hexName, esc: esc, lineHTML: lineHTML,
  markVerdict: markVerdict, verdict: verdict, vClass: vClass, fuZhu: fuZhu,
  setDictSel: function (k) { dictSel = k; }, POS: POS
};
Lessons.LIST.forEach(function (l) {
  views[l.id] = function () { Lessons.render(l.id, view, lessonCtx); };
});

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
  view.innerHTML = '<section class="block"><h1>起卦实操</h1><p class="lede">先想清一个具体问题。记住' + Glossary.term('三不占') + '：不诚不占、不义不占、不疑不占；同一件事只占一次，别用两种方法重复问。</p></section><input id="castq" placeholder="我想问：例如，这个月换工作合适吗？" aria-label="你想问的问题" style="width:100%;padding:10px 12px;font-size:16px">' +
    '<div class="tabs">' + [['dayan', '大衍筮法'], ['coin', '三枚铜钱'], ['num', '数字卦'], ['time', '时间起卦'], ['hand', '手动摆卦']].map(function (t) { return '<button type="button" class="tab ' + (castTab === t[0] ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div><div id="castarea"></div>' +
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
  $('#probs').innerHTML = col('大衍') + col('铜钱') + '<div class="row" style="grid-column:1/-1"><button type="button" class="btn ghost" id="simb">模拟 10000 爻</button><span class="small">黄线是理论值</span></div>';
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
function tabDayan(a) {
  a.innerHTML = '<div class="split wide-l"><div class="block"><canvas class="stalks" id="cv"></canvas><div class="calc" id="msg"></div><div class="row"><button type="button" class="btn" id="nx">下一步</button><button type="button" class="btn ghost" id="auto">自动演示</button><button type="button" class="btn ghost" id="fin">一键成卦</button></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
  var cv = $('#cv'), ctx = cv.getContext('2d'), W = cv.clientWidth, H = 210, dpr = window.devicePixelRatio || 1;
  cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
  var colors = cs(); var stalks = [], lineIdx = 0, changeIdx = 0, step = 0, curChange = null, total = 49, timer = 0, changes = [];
  function cs() { var s = getComputedStyle(document.documentElement); return { ink: s.getPropertyValue('--ink').trim(), acc: s.getPropertyValue('--accent').trim(), mv: s.getPropertyValue('--move').trim(), muted: s.getPropertyValue('--muted').trim() }; }
  function pile(n) { stalks = []; for (var i = 0; i < n; i++) stalks.push({ x: W / 2 + (i - n / 2) * 3, y: 54, tx: W / 2 + (i - n / 2) * 3, ty: 54, c: 'ink' }); }
  function setTarget(list, x0, y0, dx, c) { list.forEach(function (s, i) { s.tx = x0 + i * dx; s.ty = y0; if (c) s.c = c; }); }
  function groups(list, x0) {
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
  a.innerHTML = '<div class="split"><div class="block"><div class="coins" id="coins">' + [0, 1, 2].map(function () { return '<div class="coin">背</div>'; }).join('') + '</div><div class="row" style="justify-content:center"><button type="button" class="btn" id="th">掷第 1 爻</button></div><div class="small" style="text-align:center">背算 3，字算 2。三枚相加：6 老阴、7 少阳、8 少阴、9 老阳。</div><div class="calc" id="clog" style="justify-content:center"></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
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
  a.innerHTML = '<div class="split"><div class="block"><div class="small">数字起卦法（基于' + Glossary.term('先天八卦') + '数 1~8）：随手得来三组三位数，由下往上写</div><div class="nums"><input id="n1" inputmode="numeric" maxlength="3" value="130" aria-label="第一组"><input id="n2" inputmode="numeric" maxlength="3" value="174" aria-label="第二组"><input id="n3" inputmode="numeric" maxlength="3" value="314" aria-label="第三组"></div><div class="calc" id="nc"></div><div class="row"><button type="button" class="btn" id="ng">定卦</button><button type="button" class="btn ghost" id="nr">随机三组</button></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
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
  a.innerHTML = '<div class="split"><div class="block"><div class="small">梅花易数“年月日时起例”，按北京时间</div><input id="tt" type="datetime-local" value="' + def + '" aria-label="起卦时间"><div class="calc" id="tc"></div><div class="row"><button type="button" class="btn" id="tg">定卦</button></div></div><div class="block" style="align-items:center"><div id="pv"></div><div id="rs"></div></div></div>';
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
    for (var i = 0; i < 6; i++) o += '<button type="button" class="ln ' + (v[i] === 7 || v[i] === 9 ? 'yang' : 'yin') + (v[i] === 6 || v[i] === 9 ? ' mv' : '') + '" data-i="' + i + '" aria-label="切换"><i></i><u></u><i></i></button>';
    a.innerHTML = '<div class="split"><div class="block" style="align-items:center"><div class="gua lg">' + o + '</div><div class="small">反复点爻：少阳 → 少阴 → 老阳 → 老阴</div><button type="button" class="btn" id="hg">定卦</button></div><div class="block" style="align-items:center"><div id="rs">' + castResult(v) + '</div></div></div>';
    $$('.ln', a).forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-i'); v[i] = cycle[v[i]]; draw(); }; });
    $('#hg').onclick = function () { finishCast(v.slice(), '手动摆卦'); $('#rs').innerHTML = castResult(v); };
  }
  draw();
}

// ---- 六：解卦 ----
var readV = null, caseSel = 'nankuai', caseStep = 0, ctxIdx = 0, ctxPick = 0, qaCat = 'all', qaOpenMap = { 1: true };
function textOf(t, r) {
  var b = t.hex === 'ben' ? r.ben : r.zhi, h = Yi.hex(b);
  if (t.type === 'judgment') return { title: h.name + '卦辞', body: h.judgment, gloss: GLOSS[h.kw - 1][0], extra: h.daxiang };
  var l = h.lines[t.i], g = t.i === 6 ? GLOSS[h.kw - 1][2] : GLOSS[h.kw - 1][1][t.i];
  return { title: h.name + ' ' + l.label, body: l.text, gloss: g, extra: h.smallxiang[t.i] };
}
function loadValuesToFlow(benName, mvList) {
  var h = HEX.filter(function (x) { return x.name === benName; })[0];
  if (!h) return;
  readV = h.bits.split('').map(function (x, i) { var y = x === '1'; return mvList && mvList.indexOf(i) >= 0 ? (y ? 9 : 6) : (y ? 7 : 8); });
  drawFlow();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
views.l6 = function () {
  readV = cast().values.slice();
  var c = cast();
  view.innerHTML = '<section class="block"><h1>变爻解卦</h1><p class="lede">点爻改变动爻，规则会自动指出这次该读哪一句（' + Glossary.term('本卦') + '对照' + Glossary.term('之卦') + '）。</p></section>' +
    '<section class="block"><div class="surface block"><div class="row" style="justify-content:space-between"><div class="small">' + (c.demo ? '示例卦 · 起一卦后这里变成你的' : esc(c.method) + (c.q ? ' · ' + esc(c.q) : '')) + '</div><a href="#l5" class="btn ghost" style="text-decoration:none">重新起卦</a></div><div class="flow" id="flow"></div><div class="chips" id="rule"></div><div id="targets" class="block"></div><div class="row"><span class="small" id="fualt"></span></div>' +
    '<details class="why-zhuxi"><summary>为什么朱熹规定“两变取上、四变取下”？</summary><div class="small" style="margin-top:6px">画卦讲究从下往上推进。两爻变时主力还在本卦之内往上走，因此走到更靠上面的那动爻才拍板；四爻及以上大面积变化时，局势重心已跨到之卦，在之卦仅剩的两个不变之爻里自下往上先遇见的下面那爻就是主导（同理，五爻变只看之卦唯一不变的那一爻）。</div></details></div></section>' +
    '<section class="block">' + head('时间感', '从动爻往上数，每爻一个阶段') + '<div class="surface split"><div class="ladder2" id="tl"></div><div class="block"><div class="big" id="tlb"></div><div class="small">单位看事情的周期：可能是天、月或年，要靠生活经验判断。</div></div></div></section>' +
    '<section class="block">' + head(Glossary.term('同爻异境') + ' · 情境解卦工坊', '同一条爻换了问题与身份，现实应对可以完全相反') + '<div class="surface block" id="ctx-lab"></div></section>' +
    '<section class="block">' + head('把卦放进你的问题') + '<div class="surface block"><textarea id="askq" placeholder="写下问题和背景">' + esc(c.demo ? '' : c.q) + '</textarea><div class="row"><a class="btn" href="#tui" id="askb" style="text-decoration:none">带着问题去六爻推演</a><span class="small">提醒：解卦不脱离具体情境，优先取最合常理的解释</span></div></div></section>' +
    '<section class="block">' + head(Glossary.term('占卦复盘') + ' · 研易笔记', '记录每次“问什么—怎么解—事后应验”，不用死背就能摸熟规律') + '<div class="surface block" id="cast-journal"></div></section>' +
    '<section class="block">' + head('古今筮例', '点一个例子，一步步揭开') + '<div class="cases" id="cs"></div><div id="cd" class="block"></div></section>' + finishBtn('l6');
  drawFlow(); drawCtxLab(); drawJournal(); drawCases(); bindFinish();
  Glossary.bind(view);
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
  $('#fualt').textContent = r.n === 3 ? '提醒：部分课堂习惯在三爻变时直接读本卦卦辞；按朱熹准则则对照本卦（贞）与之卦（悔）。' : r.n === 1 ? '数字卦一定只有一个动爻。' : '';
  $$('#flow .ln').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-i'); readV[i] = { 7: 9, 9: 7, 8: 6, 6: 8 }[readV[i]]; drawFlow(); }; });
  var from = r.moving.length === 1 ? r.moving[0] : (r.moving.length ? r.moving[r.moving.length - 1] : 0), n = 6 - from;
  $('#tl').innerHTML = [0, 1, 2, 3, 4, 5].map(function (i) { return '<i class="' + (i >= from ? 'on' : '') + '" style="height:' + (22 + i * 13) + 'px" title="' + POS[i] + '爻"></i>'; }).join('');
  $('#tlb').textContent = (r.moving.length ? POS[from] + '爻起，约 ' + (n - 1 || 1) + ' 个阶段' : '无动爻，看整体形势');
  var jkey = $('#j-key');
  if (jkey) {
    var curKey = readV.join('');
    jkey.textContent = hexName(r.ben) + (hl.length ? ' · 动 ' + hl.map(function (i) { return label(i, r.ben[i] === '1'); }).join('、') : '（静卦）');
    jkey.setAttribute('data-k', curKey);
  }
}
function drawCtxLab() {
  var box = $('#ctx-lab');
  if (!box || typeof DeepStudy === 'undefined') return;
  var list = DeepStudy.CONTEXT_CASES;
  var cur = list[ctxIdx] || list[0];
  var pick = cur.contexts[ctxPick] || cur.contexts[0];
  box.innerHTML =
    '<div class="ctx-tabs">' + list.map(function (c, i) {
      return '<button type="button" class="chip ctx-case-btn' + (i === ctxIdx ? ' on' : '') + '" data-ci="' + i + '">' + esc(c.title) + '</button>';
    }).join('') + '</div>' +
    '<div class="surface-sub block"><div class="row" style="justify-content:space-between"><b>' + esc(cur.quote) + '</b><button type="button" class="btn ghost" id="ctx-load">放进上面的卦盘</button></div>' +
    '<div class="small">象理背景：' + esc(cur.hint) + '</div>' +
    '<div class="ctx-tabs">' + cur.contexts.map(function (ct, j) {
      return '<button type="button" class="chip ctx-pick-btn' + (j === ctxPick ? ' m' : '') + '" data-pi="' + j + '">' + esc(ct.label) + '</button>';
    }).join('') + '</div>' +
    '<div><b>实际落点：</b>' + esc(pick.take) + '</div>' +
    '<div class="small">' + esc(pick.caution) + '</div></div>';
  $$('#ctx-lab .ctx-case-btn').forEach(function (b) {
    b.onclick = function () { ctxIdx = +b.getAttribute('data-ci'); ctxPick = 0; drawCtxLab(); };
  });
  $$('#ctx-lab .ctx-pick-btn').forEach(function (b) {
    b.onclick = function () { ctxPick = +b.getAttribute('data-pi'); drawCtxLab(); };
  });
  $('#ctx-load').onclick = function () { loadValuesToFlow(cur.ben, cur.mv); };
}
function drawJournal() {
  var box = $('#cast-journal');
  if (!box) return;
  var r = Yi.reading(readV), hl = r.moving, key = readV.join('');
  var saved = S.castLogs[key] || {};
  var c = cast();
  var hist = S.history || [];
  var allKeys = Object.keys(S.castLogs || {});
  box.innerHTML =
    '<div class="row" style="justify-content:space-between"><span class="chip on" id="j-key" data-k="' + key + '">' + hexName(r.ben) + (hl.length ? ' · 动 ' + hl.map(function (i) { return label(i, r.ben[i] === '1'); }).join('、') : '（静卦）') + '</span><span class="small">保存于浏览器本地</span></div>' +
    '<div class="split">' +
      '<div class="block">' +
        '<input id="j-q" placeholder="问什么与当下背景（例：年底是否换团队）" value="' + esc(saved.q != null ? saved.q : (c.demo ? '' : c.q)) + '">' +
        '<textarea id="j-read" placeholder="当时的解读：我最初重点看了哪句，准备怎么做？">' + esc(saved.read || '') + '</textarea>' +
        '<textarea id="j-verify" placeholder="事后应验/复盘：过了几周或几个月后再回来补充真发生的事">' + esc(saved.verify || '') + '</textarea>' +
        '<div class="row"><button type="button" class="btn" id="j-save">保存这条复盘</button><span class="small" id="j-fb"></span></div>' +
      '</div>' +
      '<div class="block">' +
        '<b>已保存复盘（' + allKeys.length + '）与最近起卦（' + hist.length + '）</b>' +
        '<div class="journal-list" id="j-list">' +
          (allKeys.length === 0 && hist.length === 0 ? '<span class="small">还没有个人记录。先在左侧填几句保存，或去 <a href="#l5">起卦实操</a> 起一卦回来记下。</span>' : '') +
          allKeys.map(function (k) {
            var it = S.castLogs[k];
            return '<button type="button" class="journal-item" data-jk="' + esc(k) + '"><b>' + esc(it.title || k) + '</b><span class="small">' + esc(it.q || '未填问题') + (it.verify ? ' · 已复盘' : '') + '</span></button>';
          }).join('') +
          hist.slice(0, 4).map(function (h, hi) {
            var b = Yi.valuesToBits(h.values);
            return '<button type="button" class="journal-item" data-hi="' + hi + '"><b>最近起卦 · ' + hexName(b) + '</b><span class="small">' + esc((h.method || '') + (h.q ? ' · ' + h.q : '')) + '</span></button>';
          }).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  $('#j-save').onclick = function () {
    var kNow = ($('#j-key') && $('#j-key').getAttribute('data-k')) || readV.join('');
    var rNow = Yi.reading(readV);
    S.castLogs[kNow] = {
      values: readV.slice(),
      title: hexName(rNow.ben),
      q: ($('#j-q').value || '').trim(),
      read: ($('#j-read').value || '').trim(),
      verify: ($('#j-verify').value || '').trim(),
      at: Date.now()
    };
    save();
    drawJournal();
    var fb = $('#j-fb');
    if (fb) fb.textContent = '✓ 已保存复盘';
  };
  $$('#j-list [data-jk]').forEach(function (b) {
    b.onclick = function () {
      var item = S.castLogs[b.getAttribute('data-jk')];
      if (item && Array.isArray(item.values)) {
        readV = item.values.slice();
        drawFlow(); drawJournal();
      }
    };
  });
  $$('#j-list [data-hi]').forEach(function (b) {
    b.onclick = function () {
      var h = S.history[+b.getAttribute('data-hi')];
      if (h && Array.isArray(h.values)) {
        readV = h.values.slice();
        drawFlow(); drawJournal();
      }
    };
  });
}
function drawCases() {
  $('#cs').innerHTML = CASES.map(function (c) { var h = HEX.filter(function (x) { return x.name === c.ben; })[0]; return '<button type="button" class="case ' + (caseSel === c.id ? 'on' : '') + '" data-c="' + c.id + '">' + gua(h.bits, { size: 'mini', moving: c.mv || [] }) + '<b style="font:900 16px var(--serif)">' + c.ben + '</b><span class="small">' + c.tag + '</span></button>'; }).join('');
  $$('#cs .case').forEach(function (b) { b.onclick = function () { caseSel = b.getAttribute('data-c'); caseStep = 1; drawCases(); }; });
  var c = CASES.filter(function (x) { return x.id === caseSel; })[0], h = HEX.filter(function (x) { return x.name === c.ben; })[0];
  var st = [['他读到', c.read], ['转折', c.turn], ['结局', c.end]];
  $('#cd').innerHTML = '<div class="surface block"><div class="row" style="justify-content:space-between"><div><div class="small">' + c.tag + ' · ' + c.who + '</div><div class="quote">问：' + c.q + '</div></div>' + (c.mv ? '<button type="button" class="btn ghost" id="cl">放进上面的卦盘</button>' : '') + '</div><div class="reveal">' + st.map(function (s, i) { return '<button type="button" class="rstep ' + (i >= caseStep ? 'lock' : '') + '" data-s="' + i + '"><b>' + s[0] + '</b><span>' + s[1] + '</span></button>'; }).join('') + '</div><a class="small" href="' + c.src + '" target="_blank" rel="noopener">查看出处</a></div>';
  $$('#cd .rstep').forEach(function (b) { b.onclick = function () { var i = +b.getAttribute('data-s'); if (i === caseStep) { caseStep++; drawCases(); } }; });
  var cl = $('#cl'); if (cl) cl.onclick = function () { loadValuesToFlow(c.ben, c.mv); };
}

// ---- 梅花易数 ----
var wxSel = '木', mhMove = null;
function wxSvg(sel) {
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
  box.innerHTML = '<div class="row"><div>' + gua(bits, { size: 'mid', moving: [mhMove.mv - 1] }) + '</div><div><div class="big">' + hexName(bits) + '</div><div class="small">' + (m.length === 1 ? '动爻 ' + POS[mhMove.mv - 1] : '梅花只用一个动爻，下面可以换') + '</div></div><div class="chips">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<button type="button" class="chip ' + (mhMove.mv === n ? 'on' : '') + '" data-mv="' + n + '">' + POS[n - 1] + '</button>'; }).join('') + '</div></div>' +
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
    '<section class="block"><div class="surface block"><div class="row"><label class="small" for="njt">起卦时间（北京时间）</label><input id="njt" type="datetime-local"><select id="njq" aria-label="问事类型">' + TOPICS.map(function (t) { return '<option value="' + t[1] + '">' + t[0] + '</option>'; }).join('') + '</select></div><div class="row"><div class="steps" id="stp"></div><button type="button" class="btn ghost" id="snext">一步步装卦</button></div><div class="row" id="njhead"></div><div class="scroll"><table class="nj" id="njtbl"></table></div><div class="chips" id="njtags"></div></div></section>' +
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
    '<div class="row"><button type="button" class="btn ghost" id="tpv" aria-label="上一步">上一步</button><button type="button" class="btn" id="tpl">播放</button><button type="button" class="btn ghost" id="tnx" aria-label="下一步">下一步</button><span class="small" id="tct"></span></div></div></section>' +
    '<section class="block">' + head('结论与应期', '应期候选标在地支环上') + '<div class="surface split"><div id="tzr"></div><div class="block" id="tvd"></div></div></section>' +
    '<section class="block" id="tai" hidden>' + head('多智能体解读', '每一步实时显示：请求、思考、工具、核对') + '<div class="surface block"><div class="row"><select id="tmd" aria-label="模式"><option value="single">只看野鹤断法</option><option value="compare">加上傅佩荣读辞对比</option></select><button type="button" class="btn" id="tgo">请智能体推算</button><span class="small" id="tst"></span></div><div class="pipe" id="tpipe" hidden></div><div class="aigrid" id="tgrid" hidden><div class="agents" id="tag"></div><aside class="alog" aria-label="实时日志"><div class="alh"><b>实时日志</b><span class="small" id="tlogn"></span></div><ol id="tlog"></ol></aside></div></div></section>';
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
    return '<button type="button" class="ph ' + (i < cur ? 'done' : i === cur ? 'cur' : '') + '" ' + (first < 0 ? 'disabled' : 'data-j="' + first + '"') + '><i></i><span>' + p + '</span></button>';
  }).join('');
  $$('#tph [data-j]').forEach(function (b) { b.onclick = function () { tuiStop(); tuiGo(+b.getAttribute('data-j')); }; });
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
  var R = YiInfer.RULES[s.rule] || {};
  $('#tcd').innerHTML = '<div class="row" style="justify-content:space-between"><span class="chip ' + (s.eff > 0 ? 'g' : s.eff < 0 ? 'b' : '') + '">' + s.phase + (s.eff > 0 ? ' · 生扶' : s.eff < 0 ? ' · 克害' : '') + '</span><span class="small">' + (k + 1) + ' / ' + r.steps.length + '</span></div><div class="tstep">' + esc(s.text) + '</div>' +
    (R.t ? '<div class="rule"><b>' + esc(R.t) + '</b><div class="quote">' + esc(R.q || '') + '</div><div class="small">' + esc(R.src || '') + '</div></div>' : '');
  var plus = done.filter(function (x) { return x.eff > 0; }).length, minus = done.filter(function (x) { return x.eff < 0; }).length, mx = Math.max(4, plus, minus);
  $('#ttl').innerHTML = '<div class="score"><span>生扶</span><span class="t"><i style="left:0;width:' + plus / mx * 100 + '%;background:var(--good)"></i></span><b>' + plus + '</b></div><div class="score"><span>克害</span><span class="t"><i style="left:0;width:' + minus / mx * 100 + '%;background:var(--bad)"></i></span><b>' + minus + '</b></div>';
  $('#tct').textContent = '“克少生多”只是野鹤的总原则，各条分量不等，结论以书中先后判断为准。';
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
function tuiPicked() {
  if (tui.yong) return { yong: tui.yong };
  var a = tuiAiYong();
  return a ? { yong: a.yong, yongBy: 'wenshi', yongReason: a.reason, yongConfidence: a.confidence } : {};
}

// ---- 问题解析 ----
var QY = ['父母', '兄弟', '子孙', '妻财', '官鬼', '世', '应'];
var QTERM = { 父母: /父母|parent/gi, 兄弟: /兄弟|sibling|brother/gi, 子孙: /子孙|offspring|descendant|medicine/gi, 妻财: /妻财|wealth|wife/gi, 官鬼: /官鬼|official|career/gi, 世: /世爻|取世|自占|self line/gi, 应: /应爻|取应|other party/gi };
var qa = { ctl: null, raf: 0 };
function qaAbort() { if (qa.ctl) { qa.ctl.abort(); qa.ctl = null; } cancelAnimationFrame(qa.raf); qa.raf = 0; }
function qaShell() {
  var box = $('#tqa'); if (!box) return null;
  if (!box.firstChild) {
    box.innerHTML = '<div class="qhd"><span class="atag">问</span><b>问题解析</b><span class="small" id="qst"></span><button type="button" class="btn" id="qgo">解析问题</button></div>' +
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
function qaWeigh(text, kw) {
  var w = {}, n = text.length;
  QY.forEach(function (y) { var m, re = QTERM[y]; re.lastIndex = 0; w[y] = 0; while ((m = re.exec(text))) w[y] += Math.exp((m.index - n) / 400); });
  if (kw) w[kw] += 0.3;
  return w;
}
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
  view.innerHTML = '<section class="block"><h1>卦典与课程</h1><p class="lede">点开任一卦查看经文、大小象、彖传与白话短释；绿色下划线表示你标记学过了。</p></section><div class="dictgrid" id="dg"></div><div id="dd"></div>';
  drawGrid(); drawDetail();
};
function drawGrid() {
  $('#dg').innerHTML = HEX.map(function (h) { return '<button type="button" class="dcell ' + (dictSel === h.kw ? 'sel' : '') + (S.learned[h.kw] ? ' done' : '') + '" data-k="' + h.kw + '">' + gua(h.bits, { size: 'mini' }) + h.name + '</button>'; }).join('');
  $$('#dg .dcell').forEach(function (b) { b.onclick = function () { dictSel = +b.getAttribute('data-k'); dictLine = 0; drawGrid(); drawDetail(); }; });
}
function fuBlock(h) {
  var eps = FU.filter(function (e) { return e.k === h.kw; }), n = FU_NOTES[h.kw], s = '';
  if (eps.length) s += '<div class="row"><b>《易经详解》第 ' + eps.map(function (e) { return e.ep; }).join('、') + ' 集</b><span class="chip on">' + eps[0].t + '</span></div>';
  else s += '<div class="small">这一讲的公开索引暂缺，可先参考上方白话短释。</div>';
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
  var yaos = t.lines.map(function (l, i) { return '<button type="button" class="yao ' + (i === sel ? 'on' : '') + '" data-y="' + i + '"><b>' + l.label + '</b><span>' + markVerdict(l.text) + '</span></button>'; }).reverse().join('');
  $('#dd').innerHTML = '<div class="surface block"><div class="row" style="justify-content:space-between"><div class="row">' + gua(h.bits, { size: 'lg', hot: sel < 6 ? [sel] : [], btn: false }) + '<div class="block" style="gap:4px"><span class="small">第 ' + h.kw + ' 卦 · ' + t.lower + '下' + t.upper + '上</span><div class="big">' + hexName(h.bits) + '</div><div>' + g[0] + '</div><div class="chips"><button type="button" class="chip ' + (S.learned[h.kw] ? 'g' : '') + '" id="lrn">' + (S.learned[h.kw] ? '已学完' : '标为已学') + '</button><button type="button" class="chip" id="trd">' + (showTrad ? '切到简体' : '看繁体') + '</button></div></div></div></div>' +
    '<div class="split"><div class="block"><div class="quote">' + markVerdict(t.judgment) + '</div><div class="small">' + esc(t.daxiang) + '</div><div class="target main"><div class="small">' + cur.label + ' · 小象</div><div class="quote">' + markVerdict(cur.text) + '</div><div>' + glossT + '</div><div class="small">' + esc(t.smallxiang[sel] || '') + '</div></div>' + fuBlock(h) + '<details><summary>彖传全文</summary><p class="quote">' + esc(t.tuan) + '</p></details></div><div class="block"><div>' + yaos + '</div><textarea id="note" placeholder="听课笔记，自动保存">' + esc(S.notes[h.kw] || '') + '</textarea></div></div></div>';
  $$('.yao').forEach(function (b) { b.onclick = function () { dictLine = +b.getAttribute('data-y'); drawDetail(); }; });
  $('#lrn').onclick = function () { if (S.learned[h.kw]) delete S.learned[h.kw]; else S.learned[h.kw] = Date.now(); save(); drawGrid(); drawDetail(); };
  $('#trd').onclick = function () { showTrad = !showTrad; drawDetail(); };
  $('#note').oninput = function (e) { S.notes[h.kw] = e.target.value; save(); };
}

// ---- 初学十二问 ----
views.qa = function () {
  var list = typeof DeepStudy !== 'undefined' ? DeepStudy.QA : [];
  var filtered = qaCat === 'all' ? list : list.filter(function (x) { return x.cat === qaCat; });
  var cats = [
    ['all', '全部（' + list.length + '）'],
    ['philosophy', '读经与哲学'],
    ['divination', '占卦与理性'],
    ['practice', '修身与心态']
  ];
  var allOpen = filtered.length > 0 && filtered.every(function (x) { return qaOpenMap[x.n]; });
  view.innerHTML =
    '<section class="block"><h1>初学十二问</h1><p class="lede">把读《周易》与学占卦最容易绕弯的十二个真实困惑集中说清。点击条目即可展开结论、原因与对应微课。</p></section>' +
    '<section class="block"><div class="row" style="justify-content:space-between"><div class="faq-tabs">' +
    cats.map(function (c) { return '<button type="button" class="chip' + (qaCat === c[0] ? ' on' : '') + '" data-fcat="' + c[0] + '">' + c[1] + '</button>'; }).join('') +
    '</div><button type="button" class="btn ghost" id="faq-all">' + (allOpen ? '全部收起' : '全部展开') + '</button></div>' +
    '<div class="faq-list">' + filtered.map(function (item) {
      var isOpen = !!qaOpenMap[item.n];
      return '<div class="surface faq-card' + (isOpen ? ' open' : '') + '" data-qn="' + item.n + '">' +
        '<button type="button" class="faq-head" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
        '<span class="rm-tag">' + (item.n < 10 ? '0' + item.n : item.n) + '</span>' +
        '<div class="block" style="gap:3px;flex:1;text-align:left"><div class="row" style="gap:6px"><span class="chip">' + esc(item.tag) + '</span></div><b>' + esc(item.q) + '</b></div>' +
        '<span class="faq-tog">' + (isOpen ? '−' : '+') + '</span></button>' +
        '<div class="faq-body"' + (isOpen ? '' : ' hidden') + '>' +
          '<div class="faq-short"><b>核心回答：</b>' + esc(item.short) + '</div>' +
          '<p>' + esc(item.detail) + '</p>' +
          '<div class="row"><a class="btn ghost" href="#' + esc(item.link) + '" style="text-decoration:none">前往「' + esc(item.linkNm) + '」延伸阅读 →</a></div>' +
        '</div></div>';
    }).join('') + '</div></section>';

  $$('[data-fcat]').forEach(function (b) {
    b.onclick = function () { qaCat = b.getAttribute('data-fcat'); views.qa(); };
  });
  $('#faq-all').onclick = function () {
    filtered.forEach(function (x) { if (allOpen) delete qaOpenMap[x.n]; else qaOpenMap[x.n] = true; });
    views.qa();
  };
  $$('.faq-card .faq-head').forEach(function (b) {
    b.onclick = function () {
      var card = b.closest('.faq-card'), n = +card.getAttribute('data-qn');
      if (qaOpenMap[n]) delete qaOpenMap[n]; else qaOpenMap[n] = true;
      var on = !!qaOpenMap[n];
      card.classList.toggle('open', on);
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
      $('.faq-tog', b).textContent = on ? '−' : '+';
      $('.faq-body', card).hidden = !on;
    };
  });
};

// ---- 五阶渐进分级练习 ----
var INTERVAL = [0, 1, 3, 7];
function dayNow() { return Math.floor(Date.now() / 86400000); }
function pickCard() {
  var due = HEX.map(function (h) { var b = S.box[h.kw] || { b: 0, next: 0 }; return { h: h, b: b }; }).filter(function (x) { return x.b.next <= dayNow(); });
  due.sort(function (a, b) { return a.b.b - b.b.b || Math.random() - .5; });
  return (due[0] || { h: HEX[Math.floor(Math.random() * 64)] }).h;
}
function shuffle(a) { return a.slice().sort(function () { return Math.random() - .5; }); }
function pickFrom(arr, n, exclude) { return shuffle(arr.filter(function (x) { return x !== exclude; })).slice(0, n); }

var TIERS = [
  { id: 1, nm: '1 阶 · 八卦认形', sub: '认八个单卦 · 口诀 · 乾坤六子 · 手画三画' },
  { id: 2, nm: '2 阶 · 先后天与数', sub: '先天数 1~8 · 对角和 9 · 后天方位季节' },
  { id: 3, nm: '3 阶 · 听名画卦', sub: '15 核心高频卦：先念上再画下 · 综错对' },
  { id: 4, nm: '4 阶 · 爻名与代表卦', sub: '初九六二 · 元亨利贞 · 11 锚点代表卦' },
  { id: 5, nm: '5 阶 · 64 卦全库', sub: '朱熹变爻规则 · 全 64 卦盲画 · 盒子间隔记忆' }
];

views.drill = function () {
  var rec = recommendedTier();
  var activeTier = S.drillTier || rec;
  view.innerHTML = '<section class="block"><h1>分级练习</h1><p class="lede">按你的学习进度分层练手，也可点下面任意一阶随时挑战。</p></section>' +
    '<section class="block"><div class="tier-bar">' + TIERS.map(function (t) {
      return '<button type="button" class="tier-btn' + (t.id === activeTier ? ' on' : '') + '" data-tier="' + t.id + '">' +
        '<div class="row" style="justify-content:space-between"><b>' + t.nm + '</b>' + (t.id === rec ? '<span class="chip m">推荐</span>' : t.id <= rec ? '<span class="chip g">已解锁</span>' : '') + '</div>' +
        '<span class="small">' + t.sub + '</span></button>';
    }).join('') + '</div></section>' +
    '<section class="block" id="drill-master-box" ' + (activeTier === 5 ? '' : 'hidden') + '><div class="surface"><div class="small" style="margin-bottom:6px">全 64 卦记忆盒子进度（浅绿→深绿）</div><div class="master" id="ms"></div></div></section>' +
    '<section class="surface q" id="q"></section>';
  $$('.tier-bar [data-tier]').forEach(function (b) {
    b.onclick = function () {
      S.drillTier = +b.getAttribute('data-tier');
      save();
      views.drill();
    };
  });
  nextQ(activeTier);
};
function drawMaster() { var ms = $('#ms'); if (ms) ms.innerHTML = HEX.map(function (h) { var b = (S.box[h.kw] || {}).b || 0; return '<i class="b' + b + '" title="' + h.name + '"></i>'; }).join(''); }

function nextQ(tier) {
  if (tier === 5) drawMaster();
  var box = $('#q'), type = Math.floor(Math.random() * 4);

  function choice(prompt, rightItem, wrongItems, explain) {
    var items = shuffle([{ html: rightItem, ok: true }].concat(wrongItems.map(function (w) { return { html: w, ok: false }; })));
    box.innerHTML = prompt + '<div class="opts">' + items.map(function (o) {
      return '<button type="button" class="opt" data-ok="' + (o.ok ? 1 : 0) + '">' + o.html + '</button>';
    }).join('') + '</div><div id="fb"></div>';
    $$('.opt', box).forEach(function (b) {
      b.onclick = function () {
        var ok = b.getAttribute('data-ok') === '1';
        $$('.opt', box).forEach(function (x) { x.onclick = null; if (x.getAttribute('data-ok') === '1') x.classList.add('y'); });
        if (!ok) b.classList.add('n');
        if (box._onMark) box._onMark(ok);
        $('#fb', box).innerHTML = (explain ? '<div class="small" style="margin-bottom:6px">' + explain + '</div>' : '') + '<button type="button" class="btn" id="go">下一题</button>';
        $('#go').onclick = function () { nextQ(tier); };
      };
    });
  }

  // ---- Tier 1: 八卦认形 ----
  if (tier === 1) {
    var t = Yi.TRI[Math.floor(Math.random() * 8)];
    if (type === 0) {
      var ans = t + ' · ' + Yi.IMG[t];
      var ws = pickFrom(Yi.TRI, 3, t).map(function (x) { return x + ' · ' + Yi.IMG[x]; });
      choice(tri(Yi.TB[t], { size: 'lg' }) + '<b>这是哪一经卦？</b>', ans, ws, Lessons.KOUJUE.filter(function (k) { return k[0] === t; })[0][1]);
    } else if (type === 1) {
      var ko = Lessons.KOUJUE.filter(function (k) { return k[0] === t; })[0][1];
      choice('<div class="big">' + ko + '</div><b>对应哪个自然物、家庭或身体象？</b>', Yi.IMG[t] + ' · ' + Lessons.TRI_INFO[t].body, pickFrom(Yi.TRI, 3, t).map(function (x) { return Yi.IMG[x] + ' · ' + Lessons.TRI_INFO[x].body; }));
    } else if (type === 2) {
      var six = Yi.TRI.filter(function (x) { return x !== '乾' && x !== '坤'; });
      var t6 = six[Math.floor(Math.random() * six.length)];
      choice(tri(Yi.TB[t6], { size: 'lg' }) + '<b>按“由下往上、以少为主”，它在家庭中是？</b>', Lessons.TRI_INFO[t6].fam + '（' + t6 + '）', pickFrom(six, 3, t6).map(function (x) { return Lessons.TRI_INFO[x].fam + '（' + x + '）'; }));
    } else {
      var tmp3 = '000';
      (function draw3() {
        box.innerHTML = '<div class="big">画出「' + t + '（' + Yi.IMG[t] + '）」</div><div class="small">记得由下往上画三根线</div>' + tri(tmp3, { size: 'lg', btn: true }) + '<button type="button" class="btn" id="dn">对答案</button>';
        $$('.ln', box).forEach(function (b) { b.onclick = function () { var a = tmp3.split(''), i = +b.getAttribute('data-i'); a[i] = a[i] === '1' ? '0' : '1'; tmp3 = a.join(''); draw3(); }; });
        $('#dn').onclick = function () {
          var ok = tmp3 === Yi.TB[t];
          box.innerHTML = '<span class="chip ' + (ok ? 'g' : 'b') + '">' + (ok ? '画对了！' : '正确是这样（' + Lessons.KOUJUE.filter(function (k) { return k[0] === t; })[0][1] + '）') + '</span>' + tri(Yi.TB[t], { size: 'lg' }) + '<button type="button" class="btn" id="go">下一题</button>';
          $('#go').onclick = function () { nextQ(tier); };
        };
      })();
    }
    return;
  }

  // ---- Tier 2: 先后天与数 ----
  if (tier === 2) {
    var idx = Math.floor(Math.random() * 8), tr = Yi.TRI[idx], num = idx + 1;
    if (type === 0) {
      choice('<div class="big">先天数 ' + num + '</div><b>对应哪个经卦？</b>', tr + '（' + Yi.IMG[tr] + '）', pickFrom(Yi.TRI, 3, tr).map(function (x) { return x + '（' + Yi.IMG[x] + '）'; }));
    } else if (type === 1) {
      choice(tri(Yi.TB[tr], { size: 'lg' }) + '<b>' + tr + '（' + Yi.IMG[tr] + '）的先天数是？</b>', String(num), pickFrom(['1', '2', '3', '4', '5', '6', '7', '8'], 3, String(num)));
    } else if (type === 2) {
      var partnerN = 9 - num, partnerT = Yi.TRI[partnerN - 1];
      choice('<div class="big">' + tr + '（' + num + '）的先天对角搭档是？</div>', partnerT + '（' + partnerN + '）', pickFrom(Yi.TRI, 3, partnerT).map(function (x) { return x + '（' + (Yi.TRI.indexOf(x) + 1) + '）'; }), '先天对角两数相加恒等于 9');
    } else {
      var seasons = [['震', '正东 · 春 · 木'], ['离', '正南 · 夏 · 火'], ['兑', '正西 · 秋 · 金'], ['坎', '正北 · 冬 · 水']];
      var sItem = seasons[Math.floor(Math.random() * seasons.length)];
      choice('<div class="big">' + sItem[1] + '</div><b>在后天八卦图上对应哪一卦？</b>', sItem[0] + '（' + Yi.IMG[sItem[0]] + '）', pickFrom(seasons, 3, sItem).map(function (x) { return x[0] + '（' + Yi.IMG[x[0]] + '）'; }));
    }
    return;
  }

  // ---- Tier 3: 听名画卦（15 核心卦） ----
  if (tier === 3) {
    var pool = Lessons.CORE_KW.map(function (k) { return HEX[k - 1]; });
    var hc = pool[Math.floor(Math.random() * pool.length)];
    if (type === 0) {
      choice('<div class="big">' + hexName(hc.bits) + '</div><b>下卦与上卦分别是？（前字在上，后字在下）</b>', hc.lower + '下' + hc.upper + '上', pickFrom(pool, 3, hc).map(function (x) { return x.lower + '下' + x.upper + '上'; }));
    } else if (type === 1) {
      choice(gua(hc.bits, { size: 'lg', cls: 'gap-mid' }) + '<b>这是核心 15 卦中的哪一卦？</b>', hexName(hc.bits), pickFrom(pool, 3, hc).map(function (x) { return hexName(x.bits); }));
    } else if (type === 2) {
      var tmpC = '000000';
      (function drawC() {
        box.innerHTML = '<div class="big">画出「' + hexName(hc.bits) + '」</div><div class="small">先画最底三爻（下卦），再画上面三爻（上卦）</div>' + gua(tmpC, { size: 'lg', btn: true, cls: 'gap-mid' }) + '<button type="button" class="btn" id="dn">对答案</button>';
        $$('.ln', box).forEach(function (b) { b.onclick = function () { tmpC = Yi.flip(tmpC, [+b.getAttribute('data-i')]); drawC(); }; });
        $('#dn').onclick = function () {
          var ok = tmpC === hc.bits;
          box.innerHTML = '<span class="chip ' + (ok ? 'g' : 'b') + '">' + (ok ? '画对了！' : '正确：' + hc.lower + '下' + hc.upper + '上') + '</span>' + gua(hc.bits, { size: 'lg', cls: 'gap-mid' }) + '<button type="button" class="btn" id="go">下一题</button>';
          $('#go').onclick = function () { nextQ(tier); };
        };
      })();
    } else {
      var zBits = Yi.zong(hc.bits);
      var useCuo = zBits === hc.bits;
      var targetBits = useCuo ? Yi.cuo(hc.bits) : zBits;
      var targetH = Yi.hex(targetBits);
      choice('<div class="big">' + hexName(hc.bits) + '</div><b>' + (useCuo ? '六爻全部黑白反转（错卦）' : '上下整体翻转过来（综卦）') + '会变成哪一卦？</b>', hexName(targetH.bits), pickFrom(HEX, 3, targetH).map(function (x) { return hexName(x.bits); }));
    }
    return;
  }

  // ---- Tier 4: 爻名、读辞与爻位 ----
  if (tier === 4) {
    var h4 = HEX[Math.floor(Math.random() * 64)], li = Math.floor(Math.random() * 6);
    if (type === 0) {
      var rightLbl = label(li, h4.bits[li] === '1');
      var allLbls = [];
      for (var k = 0; k < 6; k++) { allLbls.push(label(k, true)); allLbls.push(label(k, false)); }
      choice(gua(h4.bits, { size: 'lg', hot: [li] }) + '<b>蓝线高亮的这一爻（由下往上第 ' + (li + 1) + ' 根）怎么念？</b>', rightLbl, pickFrom(allLbls, 3, rightLbl), '初、上先写位置，二三四五先写九（阳）或六（阴）');
    } else if (type === 1) {
      var aqPool = (typeof DeepStudy !== 'undefined' && DeepStudy.ANCHOR_QUIZ) ? DeepStudy.ANCHOR_QUIZ : [];
      if (aqPool.length && Math.random() < 0.55) {
        var aq = aqPool[Math.floor(Math.random() * aqPool.length)];
        choice('<div class="big" style="font-size:21px;text-align:center">' + esc(aq.q) + '</div>', aq.ans, aq.bad, aq.tip);
      } else {
        var dict4 = [
          ['《系辞》对“无咎”的真正解释是？', '善于及时补救过失，免于灾祸', ['本来就完美无瑕', '不管怎么走都绝对平安', '必须靠占卜才能化解']],
          ['经文里出现“贞凶”，最准确的读法是？', '死守原本的路线不知变通，会有凶险', ['守正做好事反而一定倒霉', '占卜结果永远不准', '只能躺平不能行动']],
          ['“中胜于正”指的是哪两个位置最占优势？', '二爻与五爻（居中位）', ['初爻与上爻', '三爻与四爻', '只有五爻']],
          ['《文言传》专门解释哪两卦？', '只讲乾、坤两纯卦', ['解释全部 64 卦的文言语法', '只讲六十四卦的排列顺序', '专门记录古人占卜案例']]
        ];
        var q4 = dict4[Math.floor(Math.random() * dict4.length)];
        choice('<div class="big" style="font-size:22px;text-align:center">' + q4[0] + '</div>', q4[1], q4[2]);
      }
    } else if (type === 2) {
      var a4 = Yi.analyze(h4.bits)[li];
      var lbl4 = label(li, h4.bits[li] === '1');
      var okText = a4.dang ? '当位（阴阳与位置奇偶一致）' : '不当位（阴阳与位置奇偶相反）';
      var wrongText = a4.dang ? '不当位（阴阳与位置奇偶相反）' : '当位（阴阳与位置奇偶一致）';
      choice(gua(h4.bits, { size: 'lg', hot: [li] }) + '<b>' + h4.name + ' · ' + lbl4 + ' 是否当位？</b>', okText, [wrongText], '单数位（初三五）配阳、双数位（二四上）配阴才算当位');
    } else {
      var chosen4 = {};
      (function dq4(done) {
        var right4 = Yi.analyze(h4.bits).filter(function (x) { return x.dang; }).map(function (x) { return x.i; });
        var o4 = { size: 'lg', btn: !done, hot: done ? right4 : Object.keys(chosen4).map(Number) };
        var ok4 = done && Object.keys(chosen4).length === right4.length && right4.every(function (i) { return chosen4[i]; });
        box.innerHTML = '<div class="big">' + hexName(h4.bits) + '</div><div class="small">点出所有【当位】的爻（阳在初三五、阴在二四上）</div>' + gua(h4.bits, o4) +
          (done ? '<span class="chip ' + (ok4 ? 'g' : 'b') + '">' + (ok4 ? '答对了！' : '正确答案已标蓝') + '</span><button type="button" class="btn" id="go">下一题</button>' : '<button type="button" class="btn" id="dn">交卷</button>');
        if (done) $('#go').onclick = function () { nextQ(tier); };
        else {
          $('#dn').onclick = function () { dq4(true); };
          $$('.ln', box).forEach(function (x) { x.onclick = function () { var i = +x.getAttribute('data-i'); if (chosen4[i]) delete chosen4[i]; else chosen4[i] = 1; dq4(false); }; });
        }
      })(false);
    }
    return;
  }

  // ---- Tier 5: 全 64 卦与变爻 ----
  var h = pickCard();
  function others(prop) { return shuffle(HEX.filter(function (x) { return x !== h; })).slice(0, 3).map(prop); }
  box._onMark = function (ok) { var cur = S.box[h.kw] || { b: 0 }; var nb = ok ? Math.min(cur.b + 1, 3) : 0; S.box[h.kw] = { b: nb, next: dayNow() + INTERVAL[nb] }; save(); drawMaster(); };
  if (type === 0) choice(gua(h.bits, { size: 'lg' }) + '<b>这是哪一卦？</b>', h.name, others(function (x) { return x.name; }));
  else if (type === 1) choice('<div class="big">' + h.name + '</div><b>上下卦是？</b>', h.lower + '下' + h.upper + '上', others(function (x) { return x.lower + '下' + x.upper + '上'; }));
  else if (type === 2) {
    var r = Math.floor(Math.random() * 6) + 1, cases = { 1: '本卦变爻', 2: '本卦两变爻，取上爻', 3: '本卦、之卦卦辞', 4: '之卦两不变爻，取下爻', 5: '之卦唯一不变爻', 6: '之卦卦辞' };
    choice('<div class="big">' + r + ' 爻变</div><b>按朱熹，该读什么？</b>', cases[r], shuffle(Object.keys(cases).filter(function (k) { return +k !== r; })).slice(0, 3).map(function (k) { return cases[k]; }));
  } else {
    var tmp = '000000';
    (function draw() {
      box.innerHTML = '<div class="big">画出「' + h.name + '」</div>' + gua(tmp, { size: 'lg', btn: true }) + '<button type="button" class="btn" id="dn">对答案</button>';
      $$('.ln', box).forEach(function (b) { b.onclick = function () { tmp = Yi.flip(tmp, [+b.getAttribute('data-i')]); draw(); }; });
      $('#dn').onclick = function () { var ok = tmp === h.bits; box._onMark(ok); box.innerHTML = '<span class="chip ' + (ok ? 'g' : 'b') + '">' + (ok ? '画对了' : '正确是这样') + '</span>' + gua(h.bits, { size: 'lg' }) + '<button type="button" class="btn" id="go">下一题</button>'; $('#go').onclick = function () { nextQ(tier); }; };
    })();
  }
}

// ---- 路由与导航 ----
var ALIAS = { l1: 'c1', l2: 'c3', l3: 'c6', l4: 'c5' };
function nav(cur) {
  function step(l) {
    var isLesson = Lessons.LIST.some(function (x) { return x.id === l.id; }) || PRAC.some(function (x) { return x.id === l.id; });
    return '<a class="step ' + (cur === l.id ? 'on' : '') + '" href="#' + l.id + '"><span class="tag">' + l.tag + '</span><span class="nm">' + (l.short ? l.nm.replace(/^[^·]+·\s*/, '') : l.nm) + '</span>' + (isLesson ? '<span class="dot ' + (S.levels[l.id] ? 'done' : '') + '"></span>' : '<span></span>') + '</a>';
  }
  $('#ladder').innerHTML = Lessons.LIST.filter(function (l) { return l.stage <= 2; }).map(step).join('');
  var deepEl = $('#deep');
  if (deepEl) deepEl.innerHTML = Lessons.LIST.filter(function (l) { return l.stage === 3; }).map(step).join('');
  $('#prac').innerHTML = PRAC.map(step).join('');
  $('#tools').innerHTML = TOOLS.map(step).join('');
  $('#adv').innerHTML = ADV.map(step).join('');
  var advBox = $('#advbox');
  if (advBox && ADV.some(function (a) { return a.id === cur; })) advBox.open = true;
  $$('[data-qnav]').forEach(function (a) {
    var q = a.getAttribute('data-qnav');
    var active = q === cur || (q === 'home' && /^c\d+$/.test(cur));
    a.classList.toggle('on', active);
  });
}

function wireMobileNav() {
  var btn = $('#mnav-btn'), rail = $('.rail');
  if (!btn || !rail || btn._wired) return;
  btn._wired = true;
  btn.onclick = function () {
    var open = rail.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '收起' : '目录';
  };
}

function route() {
  cancelAnimationFrame(dayanRaf); tuiStop(); qaAbort();
  if (typeof Glossary !== 'undefined') Glossary.close();
  var rail = $('.rail'), mbtn = $('#mnav-btn');
  if (rail && rail.classList.contains('open')) {
    rail.classList.remove('open');
    if (mbtn) { mbtn.setAttribute('aria-expanded', 'false'); mbtn.textContent = '目录'; }
  }
  var rawId = location.hash.slice(1) || 'home';
  var id = ALIAS[rawId] || rawId;
  if (!views[id]) id = 'home';
  nav(id);
  views[id]();
  if (typeof Glossary !== 'undefined') Glossary.bind(view);
  var m = $('main'); if (m) window.scrollTo(0, 0);
}
wireMobileNav();
window.addEventListener('hashchange', route);
route();
connectStore();
})();
