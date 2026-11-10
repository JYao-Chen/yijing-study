// 易经演算引擎：纯函数，不碰 DOM。卦用 6 位字符串表示，从初爻到上爻，'1' 为阳。
var Yi = (function () {
  'use strict';
  var TRI = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤']; // 下标+1 即先天数
  var TB = { 乾: '111', 兑: '110', 离: '101', 震: '100', 巽: '011', 坎: '010', 艮: '001', 坤: '000' };
  var BT = {}; TRI.forEach(function (t) { BT[TB[t]] = t; });
  var IMG = { 乾: '天', 兑: '泽', 离: '火', 震: '雷', 巽: '风', 坎: '水', 艮: '山', 坤: '地' };
  var GONG_WX = { 乾: '金', 兑: '金', 离: '火', 震: '木', 巽: '木', 坎: '水', 艮: '土', 坤: '土' };
  var GAN = '甲乙丙丁戊己庚辛壬癸'.split('');
  var ZHI = '子丑寅卯辰巳午未申酉戌亥'.split('');
  var ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
  var WX = ['木', '火', '土', '金', '水']; // 相邻相生，隔一相克
  var SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
  var KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
  var NAJIA = {
    乾: ['甲', '壬', '子寅辰', '午申戌'], 坎: ['戊', '戊', '寅辰午', '申戌子'], 艮: ['丙', '丙', '辰午申', '戌子寅'], 震: ['庚', '庚', '子寅辰', '午申戌'],
    巽: ['辛', '辛', '丑亥酉', '未巳卯'], 离: ['己', '己', '卯丑亥', '酉未巳'], 坤: ['乙', '癸', '未巳卯', '丑亥酉'], 兑: ['丁', '丁', '巳卯丑', '亥酉未']
  };
  var SIX_GOD = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
  var GOD_START = { 甲: 0, 乙: 0, 丙: 1, 丁: 1, 戊: 2, 己: 3, 庚: 4, 辛: 4, 壬: 5, 癸: 5 };
  var HE = { 子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯', 辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午' };
  var JIN = { 亥: '子', 寅: '卯', 巳: '午', 申: '酉', 丑: '辰', 辰: '未', 未: '戌', 戌: '丑' };
  var CS = { 木: ['亥', '卯', '未', '申'], 火: ['寅', '午', '戌', '亥'], 金: ['巳', '酉', '丑', '寅'], 水: ['申', '子', '辰', '巳'], 土: ['申', '子', '辰', '巳'] };
  var XIAOXI = ['100000', '110000', '111000', '111100', '111110', '111111', '011111', '001111', '000111', '000011', '000001', '000000'];
  var XIAOXI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  var byBits = {}, byKw = {}, lunarTable = [];
  function init(hexes, lunar) {
    hexes.forEach(function (h) { byBits[h.bits] = h; byKw[h.kw] = h; });
    lunarTable = lunar || [];
  }
  function hex(bits) { return byBits[bits]; }

  // ---- 卦的结构 ----
  function flip(bits, idxs) {
    var a = bits.split('');
    idxs.forEach(function (i) { a[i] = a[i] === '1' ? '0' : '1'; });
    return a.join('');
  }
  function lower(b) { return BT[b.slice(0, 3)]; }
  function upper(b) { return BT[b.slice(3)]; }
  function cuo(b) { return flip(b, [0, 1, 2, 3, 4, 5]); }
  function zong(b) { return b.split('').reverse().join(''); }
  function hu(b) { return b.slice(1, 4) + b.slice(2, 5); }
  function fullName(b) {
    var l = lower(b), u = upper(b), n = byBits[b].name;
    if (l === u) return n + '为' + IMG[u];
    return IMG[u] + IMG[l] + n;
  }
  function yangCount(b) { return b.split('').filter(function (c) { return c === '1'; }).length; }

  // 爻位分析：当位、得中、正应、比、乘承
  function analyze(b) {
    var out = [];
    for (var i = 0; i < 6; i++) {
      var y = b[i] === '1', partner = i < 3 ? i + 3 : i - 3;
      out.push({
        i: i, yang: y,
        dang: (i % 2 === 0) === y,
        zhong: i === 1 || i === 4,
        partner: partner,
        ying: b[i] !== b[partner],
        chengGang: !y && i > 0 && b[i - 1] === '1', // 阴爻压在阳爻之上
        chengShang: !y && i < 5 && b[i + 1] === '1' // 阴爻托着上面的阳爻
      });
    }
    return out;
  }
  // 六爻中只有一个不同的爻，按“物以稀为贵”就是主爻
  function rareLine(b) {
    var c = yangCount(b);
    if (c === 1) return b.indexOf('1');
    if (c === 5) return b.indexOf('0');
    return -1;
  }
  // 一次换位可由哪个十二消息卦变来（中孚、小过这类变不出来）
  function fromXiaoxi(b) {
    if (XIAOXI.indexOf(b) >= 0) return [];
    return XIAOXI.filter(function (x) {
      if (yangCount(x) !== yangCount(b)) return false;
      var d = 0;
      for (var i = 0; i < 6; i++) if (x[i] !== b[i]) d++;
      return d === 2;
    });
  }

  // ---- 起卦 ----
  function randInt(n, rng) { return Math.floor((rng || Math.random)() * n); }
  // 一变：total 根蓍草分二、挂一、揲四、归奇
  function dayanChange(total, rng) {
    var left = 0;
    // 分二：双手随手一分，用二项分布模拟集中在中间、略有偏差的分法
    for (var i = 0; i < total; i++) if ((rng || Math.random)() < 0.5) left++;
    left = Math.min(Math.max(left, 1), total - 2);
    var right = total - left - 1; // 从右手挂一
    var lr = left % 4 || 4, rr = right % 4 || 4;
    var removed = 1 + lr + rr;
    return { total: total, left: left, right: right, leftRem: lr, rightRem: rr, removed: removed, rest: total - removed };
  }
  function dayanLine(rng) {
    var changes = [], total = 49;
    for (var k = 0; k < 3; k++) { var c = dayanChange(total, rng); changes.push(c); total = c.rest; }
    return { changes: changes, value: total / 4 };
  }
  function coinLine(rng) {
    var coins = [0, 1, 2].map(function () { return randInt(2, rng); }); // 1 = 背(3)，0 = 字(2)
    return { coins: coins, value: coins.reduce(function (s, c) { return s + (c ? 3 : 2); }, 0) };
  }
  function valuesToBits(v) { return v.map(function (x) { return x === 7 || x === 9 ? '1' : '0'; }).join(''); }
  function movingOf(v) { return v.reduce(function (a, x, i) { if (x === 6 || x === 9) a.push(i); return a; }, []); }
  // 傅佩荣数字卦：三组三位数，第一组下卦，第二组上卦，第三组动爻；除尽取 8 或 6
  function numberCast(a, b, c) {
    var lo = a % 8 || 8, up = b % 8 || 8, mv = c % 6 || 6;
    return fromTriNumbers(lo, up, mv);
  }
  function fromTriNumbers(lo, up, mv) {
    var bits = TB[TRI[lo - 1]] + TB[TRI[up - 1]];
    var v = bits.split('').map(function (c, i) {
      var y = c === '1';
      if (i === mv - 1) return y ? 9 : 6;
      return y ? 7 : 8;
    });
    return { lowerN: lo, upperN: up, move: mv, values: v };
  }
  // 梅花易数年月日时起例：年支数+农历月+农历日为上卦，加时支数为下卦，总数除六取动爻
  function meihuaTimeCast(t) {
    var base = ZHI.indexOf(t.year[1]) + 1 + t.lunar.month + t.lunar.day;
    var hour = ZHI.indexOf(t.hour[1]) + 1;
    var up = base % 8 || 8, lo = (base + hour) % 8 || 8, mv = (base + hour) % 6 || 6;
    var r = fromTriNumbers(lo, up, mv);
    r.base = base; r.hourN = hour; r.yearN = ZHI.indexOf(t.year[1]) + 1;
    return r;
  }

  // ---- 变爻读法（朱熹《易学启蒙·考变占》） ----
  function reading(values) {
    var m = movingOf(values), ben = valuesToBits(values), zhi = flip(ben, m);
    var still = [0, 1, 2, 3, 4, 5].filter(function (i) { return m.indexOf(i) < 0; });
    var n = m.length, r = { ben: ben, zhi: zhi, moving: m, n: n, targets: [] };
    if (n === 0) { r.rule = '六爻皆不变，占本卦卦辞'; r.targets = [{ hex: 'ben', type: 'judgment', main: true }]; }
    else if (n === 1) { r.rule = '一爻变，占本卦变爻爻辞'; r.targets = [{ hex: 'ben', type: 'line', i: m[0], main: true }]; }
    else if (n === 2) { r.rule = '二爻变，占本卦两变爻，以上面一爻为主'; r.targets = [{ hex: 'ben', type: 'line', i: m[1], main: true }, { hex: 'ben', type: 'line', i: m[0] }]; }
    else if (n === 3) { r.rule = '三爻变，占本卦与之卦卦辞，本卦为贞、之卦为悔'; r.targets = [{ hex: 'ben', type: 'judgment', main: true }, { hex: 'zhi', type: 'judgment' }]; }
    else if (n === 4) { r.rule = '四爻变，占之卦两不变爻，以下面一爻为主'; r.targets = [{ hex: 'zhi', type: 'line', i: still[0], main: true }, { hex: 'zhi', type: 'line', i: still[1] }]; }
    else if (n === 5) { r.rule = '五爻变，占之卦唯一不变爻'; r.targets = [{ hex: 'zhi', type: 'line', i: still[0], main: true }]; }
    else if (ben === '111111' || ben === '000000') { r.rule = '六爻全变，乾坤占用九、用六'; r.targets = [{ hex: 'ben', type: 'line', i: 6, main: true }]; }
    else { r.rule = '六爻全变，占之卦卦辞'; r.targets = [{ hex: 'zhi', type: 'judgment', main: true }]; }
    return r;
  }

  // ---- 干支与历法（输入按北京时间） ----
  function jdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function sunLongitude(jd) {
    var T = (jd - 2451545.0) / 36525, r = Math.PI / 180;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * r;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
    var om = (125.04 - 1934.136 * T) * r;
    var lon = L0 + C - 0.00569 - 0.00478 * Math.sin(om);
    return ((lon % 360) + 360) % 360;
  }
  function gz(i) { i = ((i % 60) + 60) % 60; return GAN[i % 10] + ZHI[i % 12]; }
  function lunarOf(j) {
    for (var k = lunarTable.length - 1; k >= 0; k--) {
      var row = lunarTable[k];
      if (j >= row[1]) {
        var off = j - row[1], bits = row[2], leap = row[3], mi = 0;
        while (mi < bits.length) {
          var len = bits[mi] === '1' ? 30 : 29;
          if (off < len) break;
          off -= len; mi++;
        }
        if (mi >= bits.length) continue;
        var month, isLeap = false;
        if (leap && mi >= leap) { if (mi === leap) { month = leap; isLeap = true; } else month = mi; }
        else month = mi + 1;
        return { year: row[0], month: month, day: off + 1, leap: isLeap };
      }
    }
    return null;
  }
  function ganzhi(y, m, d, h, min) {
    min = min || 0;
    var j = jdn(y, m, d);
    var dayJ = h >= 23 ? j + 1 : j; // 23 点起算次日子时
    var dayIdx = (dayJ + 49) % 60;
    var jd = j - 0.5 + (h + min / 60 - 8) / 24;
    var lon = sunLongitude(jd);
    var mi = Math.floor((((lon - 315) % 360 + 360) % 360) / 30); // 0 = 寅月
    var Y = y;
    if (m <= 2 && mi >= 10) Y = y - 1;
    var yearIdx = Y - 4;
    var yearStem = ((yearIdx % 10) + 10) % 10;
    var mBranch = (mi + 2) % 12;
    var mStem = ((yearStem % 5) * 2 + 2 + mi) % 10;
    var hBranch = Math.floor((h + 1) / 2) % 12;
    var hStem = ((dayIdx % 10) % 5 * 2 + hBranch) % 10;
    var dIdx = dayIdx;
    return {
      year: gz(yearIdx), month: GAN[mStem] + ZHI[mBranch], day: gz(dIdx), hour: GAN[hStem] + ZHI[hBranch],
      sunLon: lon, lunar: lunarOf(dayJ), dayIdx: dIdx
    };
  }
  function xunKong(dayIdx) {
    var startBranch = ((dayIdx - (dayIdx % 10)) % 12 + 12) % 12; // 本旬甲日的地支
    return [ZHI[(startBranch + 10) % 12], ZHI[(startBranch + 11) % 12]];
  }

  // ---- 五行 ----
  function relation(a, b) { // a 对 b
    if (a === b) return '比和';
    if (SHENG[a] === b) return '生';
    if (KE[a] === b) return '克';
    if (SHENG[b] === a) return '被生';
    return '被克';
  }
  function wangShuai(wx, monthWx) {
    if (wx === monthWx) return '旺';
    if (SHENG[monthWx] === wx) return '相';
    if (SHENG[wx] === monthWx) return '休';
    if (KE[wx] === monthWx) return '囚';
    return '死';
  }

  // ---- 梅花易数 ----
  function meihua(bits, mv, monthZhi) {
    var moveInLower = mv <= 3;
    var tiT = moveInLower ? upper(bits) : lower(bits), yongT = moveInLower ? lower(bits) : upper(bits);
    var bian = flip(bits, [mv - 1]), huB = hu(bits);
    var ti = GONG_WX[tiT], yong = GONG_WX[yongT];
    function rate(t) {
      var w = GONG_WX[t], r = relation(w, ti);
      var map = { 比和: ['比和', 1], 生: ['生体', 2], 克: ['克体', -2], 被生: ['泄体', -1], 被克: ['受体克', 1] };
      return { tri: t, wx: w, rel: map[r][0], score: map[r][1] };
    }
    var bianYongT = moveInLower ? lower(bian) : upper(bian);
    var chain = [
      { stage: '用卦 · 起因', r: rate(yongT) },
      { stage: '互卦 · 过程', r: rate(lower(huB)), r2: rate(upper(huB)) },
      { stage: '变卦 · 结果', r: rate(bianYongT) }
    ];
    return {
      bits: bits, move: mv, ti: tiT, yong: yongT, tiWx: ti, yongWx: yong, hu: huB, bian: bian, chain: chain,
      tiState: monthZhi ? wangShuai(ti, ZHI_WX[monthZhi]) : null
    };
  }

  // ---- 八宫与纳甲 ----
  var palaceMap = {};
  (function () {
    var shi = [6, 1, 2, 3, 4, 5, 4, 3];
    var names = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'];
    TRI.forEach(function (p) {
      var b = TB[p] + TB[p], seq = [b];
      for (var k = 0; k < 5; k++) { b = flip(b, [k]); seq.push(b); }
      b = flip(b, [3]); seq.push(b);
      b = flip(b, [0, 1, 2]); seq.push(b);
      seq.forEach(function (x, i) { palaceMap[x] = { palace: p, order: i, shi: shi[i], level: names[i], wx: GONG_WX[p] }; });
    });
  })();
  function najiaLine(bits, i) {
    var inner = i < 3, t = inner ? lower(bits) : upper(bits), n = NAJIA[t];
    var zhi = (inner ? n[2] : n[3])[inner ? i : i - 3];
    return { gan: inner ? n[0] : n[1], zhi: zhi, wx: ZHI_WX[zhi] };
  }
  function liuqin(palaceWx, wx) {
    return { 比和: '兄弟', 生: '子孙', 克: '妻财', 被生: '父母', 被克: '官鬼' }[relation(palaceWx, wx)];
  }
  function chong(z) { return ZHI[(ZHI.indexOf(z) + 6) % 12]; }
  function isChongHex(b) { return [0, 1, 2].every(function (i) { return najiaLine(b, i).zhi === chong(najiaLine(b, i + 3).zhi); }); }
  function isHeHex(b) { return [0, 1, 2].every(function (i) { return najiaLine(b, i).zhi === HE[najiaLine(b, i + 3).zhi]; }); }

  function dayRelation(line, monthZhi, dayZhi, moving) {
    var mWx = ZHI_WX[monthZhi], dWx = ZHI_WX[dayZhi];
    var ws = wangShuai(line.wx, mWx);
    var monthBreak = chong(line.zhi) === monthZhi;
    var strong = ws === '旺' || ws === '相' || line.zhi === monthZhi || HE[line.zhi] === monthZhi || SHENG[mWx] === line.wx;
    var res = { state: ws, monthBreak: monthBreak, dayRel: relation(dWx, line.wx), dayHe: HE[line.zhi] === dayZhi, dayChong: chong(line.zhi) === dayZhi, dayZhi: line.zhi === dayZhi };
    res.anDong = res.dayChong && !moving && strong && !monthBreak;
    res.dayBreak = res.dayChong && !moving && !strong;
    var cs = CS[line.wx];
    res.cs = dayZhi === cs[0] ? '长生' : dayZhi === cs[1] ? '帝旺' : dayZhi === cs[2] ? '墓' : dayZhi === cs[3] ? '绝' : '';
    return res;
  }

  function chart(values, t) {
    var bits = valuesToBits(values), m = movingOf(values), bian = flip(bits, m);
    var pal = palaceMap[bits], palBian = palaceMap[bian];
    var mz = t.month[1], dz = t.day[1], kong = xunKong(t.dayIdx);
    var godStart = GOD_START[t.day[0]];
    var lines = [], present = {};
    for (var i = 0; i < 6; i++) {
      var nj = najiaLine(bits, i), q = liuqin(pal.wx, nj.wx), moving = m.indexOf(i) >= 0;
      present[q] = true;
      var L = { i: i, yang: bits[i] === '1', value: values[i], moving: moving, gan: nj.gan, zhi: nj.zhi, wx: nj.wx, qin: q };
      L.god = SIX_GOD[(godStart + i) % 6];
      L.shi = pal.shi === i + 1;
      L.ying = ((pal.shi + 2) % 6 + 1) === i + 1;
      L.kong = kong.indexOf(nj.zhi) >= 0;
      L.dr = dayRelation(nj, mz, dz, moving);
      if (moving) {
        var v = najiaLine(bian, i);
        L.bian = { gan: v.gan, zhi: v.zhi, wx: v.wx, qin: liuqin(pal.wx, v.wx), kong: kong.indexOf(v.zhi) >= 0 };
        var r = relation(v.wx, nj.wx), tags = [];
        if (JIN[nj.zhi] === v.zhi) tags.push('化进神');
        else if (JIN[v.zhi] === nj.zhi) tags.push('化退神');
        if (r === '生') tags.push('回头生');
        else if (r === '克') tags.push('回头克');
        if (chong(nj.zhi) === v.zhi) tags.push('化冲');
        if (HE[nj.zhi] === v.zhi) tags.push('化合');
        var c = CS[nj.wx];
        if (v.zhi === c[3]) tags.push('化绝');
        else if (v.zhi === c[2]) tags.push('化墓');
        if (L.bian.kong) tags.push('化空');
        L.tags = tags;
      }
      lines.push(L);
    }
    // 伏神：本卦六亲不全时，到本宫首卦同位找缺的那一亲
    var home = TB[pal.palace] + TB[pal.palace], hidden = [];
    ['父母', '兄弟', '子孙', '妻财', '官鬼'].forEach(function (q) {
      if (present[q]) return;
      for (var i = 0; i < 6; i++) {
        var nj = najiaLine(home, i);
        if (liuqin(pal.wx, nj.wx) === q) hidden.push({ i: i, qin: q, gan: nj.gan, zhi: nj.zhi, wx: nj.wx });
      }
    });
    return {
      bits: bits, bian: bian, moving: m, palace: pal, palaceBian: palBian, lines: lines, hidden: hidden, kong: kong, t: t,
      chongHex: isChongHex(bits), heHex: isHeHex(bits)
    };
  }
  // 用神生克链：元神生用神，忌神克用神，仇神克元神
  function yongChain(qin) {
    var order = ['父母', '兄弟', '子孙', '妻财', '官鬼']; // 依次相生
    var i = order.indexOf(qin);
    return { yong: qin, yuan: order[(i + 4) % 5], ji: order[(i + 3) % 5], chou: order[(i + 2) % 5], xie: order[(i + 1) % 5] };
  }
  function lineScore(L) {
    var s = 0, why = [], d = L.dr;
    var pts = { 旺: 2, 相: 1, 休: -1, 囚: -1, 死: -2 }[d.state];
    s += pts; why.push('月令' + d.state + (pts > 0 ? ' +' : ' ') + pts);
    if (d.monthBreak) { s -= 2; why.push('月破 -2'); }
    if (d.dayRel === '被生' || d.dayRel === '比和') { }
    var dr = { 生: 1, 比和: 1, 克: -1 }[d.dayRel];
    if (dr) { s += dr; why.push('日辰' + (dr > 0 ? '助 +1' : '克 -1')); }
    if (d.dayBreak) { s -= 2; why.push('日破 -2'); }
    if (d.anDong) { s += 1; why.push('暗动 +1'); }
    if (d.dayHe) { s += 1; why.push('日合 +1'); }
    if (L.kong) { s -= 1; why.push('旬空 -1'); }
    if (L.moving) {
      (L.tags || []).forEach(function (t) {
        var p = { 回头生: 2, 化进神: 1, 回头克: -2, 化退神: -1, 化绝: -1, 化墓: -1, 化空: -1 }[t];
        if (p) { s += p; why.push(t + (p > 0 ? ' +' : ' ') + p); }
      });
    }
    return { score: s, why: why };
  }

  return {
    TRI: TRI, TB: TB, BT: BT, IMG: IMG, GONG_WX: GONG_WX, GAN: GAN, ZHI: ZHI, ZHI_WX: ZHI_WX, WX: WX, SHENG: SHENG, KE: KE, SIX_GOD: SIX_GOD, XIAOXI: XIAOXI, XIAOXI_ZHI: XIAOXI_ZHI, HE: HE, CS: CS, JIN: JIN, liuqin: liuqin,
    init: init, hex: hex, flip: flip, lower: lower, upper: upper, cuo: cuo, zong: zong, hu: hu, fullName: fullName, yangCount: yangCount,
    analyze: analyze, rareLine: rareLine, fromXiaoxi: fromXiaoxi,
    dayanChange: dayanChange, dayanLine: dayanLine, coinLine: coinLine, valuesToBits: valuesToBits, movingOf: movingOf, numberCast: numberCast, fromTriNumbers: fromTriNumbers, meihuaTimeCast: meihuaTimeCast,
    reading: reading, ganzhi: ganzhi, jdn: jdn, lunarOf: lunarOf, xunKong: xunKong, relation: relation, wangShuai: wangShuai, meihua: meihua,
    palaceMap: palaceMap, najiaLine: najiaLine, chart: chart, chong: chong, isChongHex: isChongHex, isHeHex: isHeHex, yongChain: yongChain, lineScore: lineScore
  };
})();
if (typeof module !== 'undefined') module.exports = Yi;
