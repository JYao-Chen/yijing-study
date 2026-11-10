// 六爻断卦推理：按《增删卜易》野鹤法，把排盘结果一步步推到结论与应期。纯函数，依赖 Yi。
// 每一步记录 { phase, text, rule, eff, lines, arrows }，eff 为 +1 生扶 / -1 克害 / 0 说明。
var YiInfer = (function () {
  'use strict';
  var Y = typeof Yi !== 'undefined' ? Yi : require('./engine.js');
  var ZHI = Y.ZHI, ZW = Y.ZHI_WX, SHENG = Y.SHENG, KE = Y.KE, HE = Y.HE, CS = Y.CS, chong = Y.chong, rel = Y.relation;
  var Z = '增删卜易·';
  var RULES = {
    yong: { t: '按所问之事取用神', src: Z + '用神章第八', q: '占父母卽以卦中之父母爻爲神' },
    yongShi: { t: '自占、占吉凶以世爻为用神', src: Z + '用神章第八', q: '占吉凶者以世爻爲用神' },
    liangxian: { t: '用神两现：舍静取动，舍衰取旺，舍破取不破，舍空取不空', src: Z + '兩現章第三十二', q: '捨其休囚，用其旺相，捨其靜爻，而用動爻' },
    liangxianYq: { t: '两现者应期多应在空破之爻填实', src: Z + '兩現章第三十二', q: '應乎旬空月破，捨其不空而用旬空' },
    riyueYong: { t: '用神不上卦，先以日月为用神', src: Z + '飛伏神章第二十八', q: '若用神不現，卽以日月爲用神' },
    fushen: { t: '日月亦非用神，到本宫首卦寻伏神', src: Z + '飛伏神章第二十八', q: '倘日月非用神者，則本宮首卦尋之' },
    fuYou: { t: '伏神有用：得日月生、旺相、飞神生、动爻生、日月冲克飞神、飞神空破休囚', src: Z + '飛伏神章第二十八', q: '伏神有用者有六' },
    fuWu: { t: '伏神无用：休囚、被日月冲克、被旺飞克、墓绝于日月、休囚又空破', src: Z + '飛伏神章第二十八', q: '伏神終不得出者有五' },
    yuejian: { t: '月建能生合扶助衰爻，冲克刑破旺爻', src: Z + '月將章第十六', q: '爻逢月合而有用，爻逢月破而無功' },
    yuepo: { t: '月建冲爻为月破；动而破者出月不破', src: Z + '月破章第二十七', q: '目下雖破，出月則不破' },
    richen: { t: '日辰四时俱旺，能生克冲合诸爻', src: Z + '日辰章第十七', q: '日辰爲六爻之主宰' },
    andong: { t: '静爻旺相被日冲为暗动，休囚被冲为日破', src: Z + '暗動章第二十二', q: '靜爻旺相日辰沖之爲暗動，靜爻休囚日辰沖之爲破' },
    dongsan: { t: '动爻逢冲，旺相有气者不散', src: Z + '動散章第二十三', q: '旺相者沖之不散，有气者沖之不散' },
    swmj: { t: '只验生旺墓绝：长生帝旺为扶，墓绝为损', src: Z + '生旺墓絕章第又二十六', q: '只驗生旺墓絕，其餘不驗' },
    xunkong: { t: '旬内为空，出旬不空；旺动不为真空，春土夏金秋木冬火为真空', src: Z + '旬空章第二十六', q: '旺不爲空，動不爲空' },
    dongbian: { t: '变爻只生克本位动爻；日月能制动变诸爻', src: Z + '動變生克沖合章第十五', q: '變出之爻能生克沖合本位之動爻，不能生克他爻' },
    huaJi: { t: '化回头生、化进神、化长生帝旺、化日月为化吉', src: Z + '各門類題頭總注章第又二十六', q: '凡用神元神動化回頭生、化長生、化帝旺、化扶助、化日月皆爲化吉' },
    huaXiong: { t: '化回头克、化绝、化墓、化空、化鬼、化退神为化凶', src: Z + '各門類題頭總注章第又二十六', q: '凡用神元神動化回頭克、化絕、化墓、化空、化鬼、化退神皆爲化凶' },
    jingSheng: { t: '旺相静爻亦能生克休囚之爻', src: Z + '動靜生克章第十四', q: '六爻安靜旺相之爻，可以生得休囚之爻' },
    yuanYou: { t: '元神有力方能生用神', src: Z + '元神忌神衰旺章第十', q: '元神雖生用神，須要旺相，方可生得用神' },
    jiYou: { t: '忌神有力方能克用神', src: Z + '元神忌神衰旺章第十', q: '忌神動而克害用神者有五' },
    xiangsheng: { t: '元神忌神同动，接续相生，化凶为吉', src: Z + '元神忌神衰旺章第十', q: '忌神未土反生元神之酉金，金生亥水，接續相生，化凶而爲吉' },
    heZhu: { t: '动而化合，合住不能生克', src: Z + '用神元神忌神仇神章第九', q: '午與未合，午未相合不生辰土' },
    wugen: { t: '用神无根，元神有力亦难生', src: Z + '元神忌神衰旺章第十', q: '此謂之用神無根，元神有力亦難生' },
    keshao: { t: '克少生多为吉，克多生少为凶', src: Z + '克處逢生章第十三', q: '大凡用神、元神克少生多爲吉' },
    guaBian: { t: '卦化回头克，不论用神衰旺以凶推', src: Z + '卦變生克墓絕章第二十四', q: '凡遇卦化克者，不論用神之衰旺皆以凶推' },
    yqJing: { t: '静而逢值逢冲', src: Z + '各門類應期總注章第又二十六', q: '靜而逢值逢沖' },
    yqDong: { t: '动而逢合逢值', src: Z + '各門類應期總注章第又二十六', q: '動而逢合逢值' },
    yqTaiwang: { t: '太旺者逢墓逢冲', src: Z + '各門類應期總注章第又二十六', q: '太旺者逢墓逢沖' },
    yqShuai: { t: '衰绝者遇生遇旺', src: Z + '各門類應期總注章第又二十六', q: '衰絕者，遇生遇旺' },
    yqMu: { t: '入三墓俱喜冲开', src: Z + '各門類應期總注章第又二十六', q: '入三墓俱喜沖開' },
    yqHe: { t: '遇六合宜相击（冲开）', src: Z + '各門類應期總注章第又二十六', q: '遇六合亦宜相擊' },
    yqPo: { t: '月破喜填（值）或逢合', src: Z + '各門類應期總注章第又二十六', q: '月破喜塡' },
    yqKong: { t: '旬空最爱填冲', src: Z + '各門類應期總注章第又二十六', q: '旬空最愛塡沖' },
    yqKeJi: { t: '大象吉而受克，待克神受克', src: Z + '各門類應期總注章第又二十六', q: '大象吉而受克，須待克神受克' },
    yqKeXiong: { t: '大象凶而受克，防克者逢生', src: Z + '各門類應期總注章第又二十六', q: '大象凶而受克，須防克者逢生' },
    yqJin: { t: '化进神逢值逢合', src: Z + '各門類應期總注章第又二十六', q: '化進神、逢值逢合' },
    yqTui: { t: '化退神忌值忌冲', src: Z + '各門類應期總注章第又二十六', q: '化退神、忌值忌沖' },
    yqBian: { t: '应于动爻或变爻', src: Z + '各門類應期總注章第又二十六', q: '問有應於變爻動爻' },
    yqYuan: { t: '世空元动待元神逢值，世衰元静待元神逢冲', src: Z + '各門類應期總注章第又二十六', q: '世空元動，須待元神逢值' }
  };

  // 问事分类：先认人伦关系，再认事项；返回用神六亲或世/应。仅作默认，可人工改。
  var CLASSES = [
    [/对方|對方|他人|别人|別人|合作方|对手|對手/, '应', '问他人之事'],
    [/父|母|爸|妈|媽|爹|娘|祖|师|師|长辈|長輩|公婆|岳|伯|叔|姑|姨|主人/, '父母', '父母辈与尊长'],
    [/女朋友|女友|未婚妻|妻|老婆|妾|仆|僕|婢|员工|員工|下属|下屬/, '妻财', '妻妾与使唤之人'],
    [/男朋友|男友|未婚夫|丈夫|老公|夫(?!人)/, '官鬼', '妻占夫'],
    [/兄|弟|姐|妹|朋友|同事|伙伴|夥伴|同学|同學/, '兄弟', '兄弟朋友'],
    [/子|女|孙|孫|儿|兒|孩|侄|甥|门生|門生|学生|學生/, '子孙', '子孙晚辈'],
    [/医|醫|药|藥|畜|猫|貓|狗|宠物|寵物|晴/, '子孙', '医药、六畜、天晴'],
    [/功名|官|升|陞|职|職|工作|仕|选|選|考核|讼|訟|官司|盗|盜|贼|賊|贵|貴|雷/, '官鬼', '功名官府、讼盗'],
    [/文书|文書|书信|書信|信|合同|契|证|證|考试|考試|房|屋|宅|车|車|船|衣|雨|雪|雲|云/, '父母', '文书房车、雨雪'],
    [/财|財|钱|錢|欠|款|买卖|買賣|生意|货|貨|借|债|債|收入|工资|工資|投资|投資|股|店|铺|鋪|婚/, '妻财', '财物买卖'],
    [/自|我|己|病|吉凶|出行|运|運|前程|平安/, '世', '自占']
  ];
  var QIN = { 父母: 1, 兄弟: 1, 子孙: 1, 妻财: 1, 官鬼: 1 };
  function classify(q) {
    q = String(q || '');
    for (var i = 0; i < CLASSES.length; i++) {
      var m = q.match(CLASSES[i][0]);
      if (m) return { yong: CLASSES[i][1], why: CLASSES[i][2], hit: m[0] };
    }
    return { yong: '世', why: '未识别，按自占取世爻', hit: '' };
  }

  function step(out, phase, text, rule, eff, lines, arrows) {
    out.push({ phase: phase, text: text, rule: rule, eff: eff || 0, lines: lines || [], arrows: arrows || [] });
  }
  function season(wx, mz) {
    var mw = ZW[mz];
    return wx === mw ? '旺' : SHENG[mw] === wx ? '相' : '休囚';
  }
  // 一爻是否“有气”：当令旺相，或临、合、生、扶于日月
  function hasQi(x, mz, dz) {
    var s = season(x.wx, mz), mr = rel(ZW[mz], x.wx), dr = rel(ZW[dz], x.wx);
    return s !== '休囚' || x.zhi === mz || x.zhi === dz || HE[x.zhi] === mz || mr === '生' || dr === '生' || dr === '比和';
  }
  function isBreak(x, mz) { return chong(x.zhi) === mz; }

  // 动爻（含暗动）是否有力去生克他爻：元神忌神衰旺章的有力/无力判据
  function power(s, c) {
    var mz = c.t.month[1], dz = c.t.day[1], tags = s.tags || [], qi = hasQi(s, mz, dz), cs = CS[s.wx];
    var bad = tags.filter(function (t) { return /化退神|化绝|化墓|回头克/.test(t); });
    if (bad.length && !qi) return { ok: false, why: '休囚又' + bad.join('、') };
    if (isBreak(s, mz) && !s.moving) return { ok: false, why: '月破' };
    if (dz === cs[2] && !qi) return { ok: false, why: '入日墓' };
    if (qi) return { ok: true, why: season(s.wx, mz) === '休囚' ? '得日月生扶' : '当令' + season(s.wx, mz) };
    if (tags.indexOf('回头生') >= 0 || tags.indexOf('化进神') >= 0) return { ok: true, why: tags.join('、') };
    if (dz === cs[0] || dz === cs[1]) return { ok: true, why: dz === cs[0] ? '长生于日' : '帝旺于日' };
    return { ok: false, why: '休囚无助' };
  }

  // 月建日辰对一爻：返回生扶与克害各条
  function riyue(x, c, out, label) {
    var mz = c.t.month[1], dz = c.t.day[1], plus = 0, minus = 0, i = x.fu ? [] : [x.i];
    var mr = rel(ZW[mz], x.wx), dr = rel(ZW[dz], x.wx), s = season(x.wx, mz), flags = {};
    if (x.zhi === mz) { plus++; step(out, '月建', label + '临月建，当权得令', 'yuejian', 1, i); }
    else if (isBreak(x, mz)) {
      minus++; flags.po = true;
      step(out, '月建', label + '被月建' + mz + '冲，为月破' + (x.moving ? '；但动而逢破，出月不破' : ''), 'yuepo', -1, i);
    } else if (HE[x.zhi] === mz) { plus++; flags.he = mz; step(out, '月建', label + '与月建' + mz + '相合，爻逢月合而有用', 'yuejian', 1, i); }
    else if (mr === '生') { plus++; step(out, '月建', '月建' + mz + ZW[mz] + '生' + label + '，当令为相', 'yuejian', 1, i); }
    else if (mr === '比和') { plus++; step(out, '月建', '月建' + mz + '与' + label + '同属' + x.wx + '，为扶', 'yuejian', 1, i); }
    else if (mr === '克') { minus++; step(out, '月建', '月建' + mz + ZW[mz] + '克' + label, 'yuejian', -1, i); }
    else step(out, '月建', label + '在' + mz + '月休囚', 'yuejian', 0, i);

    if (x.zhi === dz) { plus++; step(out, '日辰', label + '临日辰，逢破不破', 'richen', 1, i); }
    else if (chong(x.zhi) === dz) {
      if (x.moving) step(out, '日辰', label + '动而逢日冲，' + (hasQi(x, mz, dz) ? '有气不散' : '休囚，间有冲散'), 'dongsan', 0, i);
      else if (hasQi(x, mz, dz) && !flags.po) { plus++; flags.andong = true; step(out, '日辰', '日辰' + dz + '冲旺相静爻' + label + '，为暗动', 'andong', 1, i); }
      else { minus++; flags.ripo = true; step(out, '日辰', '日辰' + dz + '冲休囚静爻' + label + '，为日破', 'andong', -1, i); }
    } else if (HE[x.zhi] === dz) { plus++; flags.he = flags.he || dz; step(out, '日辰', label + '与日辰' + dz + '相合', 'richen', 1, i); }
    else if (dr === '生') { plus++; step(out, '日辰', '日辰' + dz + ZW[dz] + '生' + label, 'richen', 1, i); }
    else if (dr === '比和') { plus++; step(out, '日辰', '日辰' + dz + '与' + label + '同属' + x.wx + '，为扶', 'richen', 1, i); }
    else if (dr === '克') { minus++; step(out, '日辰', '日辰' + dz + ZW[dz] + '克' + label, 'richen', -1, i); }
    var cs = CS[x.wx], qi = hasQi(x, mz, dz);
    if (dz === cs[0] && x.zhi !== dz) { plus++; step(out, '日辰', label + '长生于' + dz + '日', 'swmj', 1, i); }
    else if (dz === cs[1] && x.zhi !== dz) { plus++; step(out, '日辰', label + '帝旺于' + dz + '日', 'swmj', 1, i); }
    else if (dz === cs[2]) { minus++; flags.mu = true; step(out, '日辰', label + '入' + dz + '日墓', 'swmj', -1, i); }
    else if (dz === cs[3] && !qi) { minus++; step(out, '日辰', label + '休囚又绝于' + dz + '日', 'swmj', -1, i); }

    var kong = c.kong.indexOf(x.zhi) >= 0;
    if (kong) {
      flags.kong = true;
      var trueKong = !x.moving && KE[ZW[mz]] === x.wx && !qi;
      if (trueKong) { minus++; flags.trueKong = true; step(out, '旬空', label + '旬空，又春土夏金秋木冬火之类，为真空', 'xunkong', -1, i); }
      else step(out, '旬空', label + '值旬空（' + c.kong.join('') + '），' + (x.moving ? '动不为空' : qi ? '有气，出旬即实' : '旬内为空') + '，待出空填实', 'xunkong', 0, i);
    }
    return { plus: plus, minus: minus, flags: flags, season: s, qi: qi };
  }

  function infer(c, opt) {
    opt = opt || {};
    var out = [], mz = c.t.month[1], dz = c.t.day[1], L = c.lines;
    var want = opt.yong || classify(opt.question).yong, x = null, label, others = [];
    var palWx = c.palace.wx;
    // 一、取用神
    if (want === '世' || want === '应') {
      x = L.filter(function (l) { return want === '世' ? l.shi : l.ying; })[0];
      label = want + '爻' + x.zhi + x.wx;
      step(out, '取用', (want === '世' ? '问自身之事，取世爻' : '问他人之事，取应爻') + x.zhi + x.wx + '为用神', want === '世' ? 'yongShi' : 'yong', 0, [x.i]);
    } else {
      var cand = L.filter(function (l) { return l.qin === want; });
      if (cand.length) {
        if (cand.length > 1) {
          var rank = function (l) {
            var q = hasQi(l, mz, dz) ? 2 : 0, k = c.kong.indexOf(l.zhi) >= 0 ? 1 : 0, p = isBreak(l, mz) ? 1 : 0;
            return (l.moving ? 8 : 0) + q * 2 - k - p + (l.shi ? 0.5 : 0);
          };
          cand.sort(function (a, b) { return rank(b) - rank(a); });
          others = cand.slice(1);
          step(out, '取用', want + '两现（' + cand.map(function (l) { return l.zhi + l.wx; }).join('、') + '），取' + cand[0].zhi + cand[0].wx + (cand[0].moving ? '（动）' : hasQi(cand[0], mz, dz) ? '（旺）' : ''), 'liangxian', 0, cand.map(function (l) { return l.i; }));
        } else step(out, '取用', '所问属' + want + '，取' + cand[0].zhi + cand[0].wx + want + '为用神', 'yong', 0, [cand[0].i]);
        x = cand[0]; label = '用神' + x.zhi + x.wx;
      } else {
        var my = Y.liuqin(palWx, ZW[mz]) === want ? mz : Y.liuqin(palWx, ZW[dz]) === want ? dz : null;
        if (my) {
          x = { i: -1, zhi: my, wx: ZW[my], qin: want, moving: false, riyue: true };
          label = '用神' + my + ZW[my];
          step(out, '取用', want + '不上卦，' + (my === mz ? '月建' : '日辰') + my + '即是' + want + '，以之为用神', 'riyueYong', 0, []);
        } else {
          var h = c.hidden.filter(function (f) { return f.qin === want; })[0];
          x = { i: h.i, gan: h.gan, zhi: h.zhi, wx: h.wx, qin: want, moving: false, fu: true };
          var fei = L[h.i], fr = rel(fei.wx, h.wx);
          label = '伏神' + h.zhi + h.wx;
          step(out, '取用', want + '不上卦，日月亦非' + want + '；本宫首卦' + h.zhi + h.wx + '伏于' + (h.i + 1) + '爻' + fei.zhi + fei.wx + '之下', 'fushen', 0, [h.i]);
          var fy = [], fw = [];
          if (rel(ZW[mz], h.wx) === '生' || rel(ZW[dz], h.wx) === '生') fy.push('得日月生');
          if (season(h.wx, mz) !== '休囚') fy.push('伏神旺相');
          if (fr === '生') fy.push('飞来生伏');
          if (L.some(function (l) { return l.moving && rel(l.wx, h.wx) === '生'; })) fy.push('得动爻生');
          if (c.kong.indexOf(fei.zhi) >= 0 || isBreak(fei, mz)) fy.push('飞神空破，伏神易出');
          if (fr === '克' && hasQi(fei, mz, dz)) fw.push('被旺相飞神克');
          if (rel(ZW[mz], h.wx) === '克' || rel(ZW[dz], h.wx) === '克' || chong(h.zhi) === mz || chong(h.zhi) === dz) fw.push('被日月冲克');
          if (dz === CS[h.wx][2] || dz === CS[h.wx][3]) fw.push('墓绝于日');
          var useful = fy.length > fw.length;
          step(out, '取用', '伏神' + (useful ? '有用：' + fy.join('、') : '难出：' + (fw.join('、') || '休囚无助')), useful ? 'fuYou' : 'fuWu', useful ? 1 : -1, [h.i],
            [{ from: h.i, to: h.i, kind: fr === '生' ? '生' : fr === '克' ? '克' : '伏' }]);
        }
      }
    }
    var chain = Y.yongChain(want === '世' || want === '应' ? x.qin : want);

    // 二、月建日辰定强弱
    var R = riyue(x, c, out, label), plus = R.plus, minus = R.minus, flags = R.flags;

    // 三、动爻、暗动对用神的生克
    var sources = L.filter(function (l) { return l.i !== x.i && (l.moving || (l.dr && l.dr.anDong)); });
    var yuanOn = null, jiOn = null, yuanHe = null;
    sources.forEach(function (s) {
      var r = rel(s.wx, x.wx);
      if (r !== '生' && r !== '克') return;
      var kind = r === '生' ? '元神' : '忌神', pw = power(s, c), how = s.moving ? '动' : '暗动';
      if ((s.tags || []).indexOf('化合') >= 0) {
        if (r === '生') yuanHe = s;
        step(out, '动变', (s.i + 1) + '爻' + s.zhi + s.wx + kind + how + '而化合，合住不' + r, 'heZhu', 0, [s.i, x.i]); return;
      }
      if (!pw.ok) { step(out, '动变', (s.i + 1) + '爻' + s.zhi + s.wx + kind + how + '，但' + pw.why + '，无力' + r + '用', r === '生' ? 'yuanYou' : 'jiYou', 0, [s.i, x.i]); return; }
      if (r === '生') yuanOn = s; else jiOn = s;
      step(out, '动变', (s.i + 1) + '爻' + s.zhi + s.wx + kind + how + '（' + pw.why + '），' + r + label, r === '生' ? 'yuanYou' : 'jiYou', r === '生' ? 1 : -1, [s.i, x.i], [{ from: s.i, to: x.i, kind: r }]);
      if (r === '生') plus++; else minus++;
    });
    if (yuanOn && jiOn) {
      minus--;
      step(out, '动变', '元神忌神同动：' + jiOn.zhi + jiOn.wx + '生' + yuanOn.zhi + yuanOn.wx + '，' + yuanOn.zhi + yuanOn.wx + '生用，接续相生，忌神不克反助', 'xiangsheng', 1, [jiOn.i, yuanOn.i, x.i],
        [{ from: jiOn.i, to: yuanOn.i, kind: '生' }, { from: yuanOn.i, to: x.i, kind: '生' }]);
    }
    if (!sources.length) {
      L.forEach(function (s) {
        if (s.i === x.i || s.moving) return;
        var r = rel(s.wx, x.wx);
        if ((r === '生' || r === '克') && season(s.wx, mz) === '旺' && !R.qi)
          step(out, '动变', '卦无动爻；' + (s.i + 1) + '爻' + s.zhi + s.wx + '当令而静，亦能' + r + '休囚之用神', 'jingSheng', r === '生' ? 1 : -1, [s.i, x.i], [{ from: s.i, to: x.i, kind: r }]);
      });
    }
    // 用神自身发动
    if (x.moving) {
      var tags = x.tags || [];
      step(out, '动变', label + '发动，化出' + x.bian.zhi + x.bian.wx, 'dongbian', 0, [x.i]);
      tags.forEach(function (t) {
        var good = /回头生|化进神/.test(t), badT = /回头克|化退神|化绝|化墓/.test(t);
        if (good) plus++; if (badT) minus++;
        if (good || badT || /化空/.test(t)) step(out, '动变', label + t, good ? 'huaJi' : 'huaXiong', good ? 1 : badT ? -1 : 0, [x.i]);
      });
      if (x.bian.zhi === mz || x.bian.zhi === dz) { plus++; step(out, '动变', label + '化出日月', 'huaJi', 1, [x.i]); }
      if (x.bian.qin === '官鬼' && x.qin !== '官鬼') { minus++; step(out, '动变', label + '化鬼', 'huaXiong', -1, [x.i]); }
      if (isBreak(x.bian, mz)) step(out, '动变', '变爻' + x.bian.zhi + '值月破', 'huaXiong', 0, [x.i]);
    }
    // 卦化回头克
    var pb = c.palaceBian && c.palaceBian.wx;
    if (c.moving.length && pb && rel(pb, palWx) === '克') { minus++; step(out, '动变', '本卦属' + palWx + '，变卦属' + pb + '，卦化回头克', 'guaBian', -1, c.moving); }

    // 四、结论
    var noRoot = (flags.po || rel(ZW[mz], x.wx) === '克') && !R.qi && !yuanOn;
    var verdict, wait = flags.kong || flags.he || (flags.po && x.moving) || (x.moving && (x.tags || []).indexOf('化空') >= 0);
    if (noRoot) { verdict = '凶'; step(out, '结论', label + '月令不扶、日辰不助，又无元神来生：用神无根', 'wugen', -1, [x.i]); }
    else verdict = plus > minus ? '吉' : plus < minus ? '凶' : '平';
    step(out, '结论', '生扶 ' + plus + ' 条，克害 ' + minus + ' 条：' + (verdict === '吉' ? '克少生多，主吉' : verdict === '凶' ? '克多生少，主凶' : '生克相当，吉凶未定，看应期') + (wait ? '；用神有空、合或破，须待时而应' : ''), 'keshao', 0, x.i >= 0 ? [x.i] : []);

    // 五、应期候选
    var yq = [];
    function add(z, why, rule) {
      var e = yq.filter(function (y) { return y.zhi === z; })[0];
      if (e) { if (e.why.indexOf(why) < 0) e.why.push(why); }
      else yq.push({ zhi: z, why: [why], rule: rule });
    }
    var cs = CS[x.wx], z = x.zhi;
    if (x.moving) { add(HE[z], '动而逢合', 'yqDong'); add(z, '动而逢值', 'yqDong'); }
    else { add(z, '静而逢值', 'yqJing'); add(chong(z), '静而逢冲', 'yqJing'); }
    if (x.zhi === mz && x.zhi === dz || plus - minus >= 3) { add(cs[2], '太旺逢墓', 'yqTaiwang'); add(chong(z), '太旺逢冲', 'yqTaiwang'); }
    if (!R.qi) ZHI.forEach(function (k) { if (SHENG[ZW[k]] === x.wx) add(k, '衰者遇生', 'yqShuai'); });
    if (!R.qi) add(cs[1], '衰者遇旺', 'yqShuai');
    if (flags.mu || (x.tags || []).indexOf('化墓') >= 0) add(chong(cs[2]), '入墓冲开', 'yqMu');
    if (flags.he) add(chong(z), '逢合待冲开', 'yqHe');
    if ((x.tags || []).indexOf('化合') >= 0) add(chong(x.bian.zhi), '化合待冲开', 'yqHe');
    if (flags.po) { add(z, '月破填实', 'yqPo'); add(HE[z], '破而逢合', 'yqPo'); }
    if (flags.kong) { add(z, '出空填实', 'yqKong'); add(chong(z), '冲空则实', 'yqKong'); }
    if (x.moving && (x.tags || []).indexOf('化空') >= 0) add(x.bian.zhi, '变爻出空', 'yqKong');
    // 克神：动来克用的忌神，或用神化出的回头克之变爻
    var keShen = jiOn && !(yuanOn && jiOn) ? { zhi: jiOn.zhi, wx: jiOn.wx } : null;
    if (!keShen && x.moving && (x.tags || []).indexOf('回头克') >= 0) keShen = { zhi: x.bian.zhi, wx: x.bian.wx };
    if (keShen) {
      if (verdict !== '凶') { ZHI.forEach(function (k) { if (KE[ZW[k]] === keShen.wx) add(k, '克神受克', 'yqKeJi'); }); add(chong(keShen.zhi), '克神逢冲', 'yqKeJi'); }
      else { add(keShen.zhi, '克者逢值', 'yqKeXiong'); ZHI.forEach(function (k) { if (SHENG[ZW[k]] === keShen.wx) add(k, '克者逢生', 'yqKeXiong'); }); }
    }
    if (yuanHe) add(chong(yuanHe.bian.zhi), '元神合住，待冲开', 'yqHe');
    if (yuanOn && (yuanOn.tags || []).indexOf('化空') >= 0) add(yuanOn.bian.zhi, '元神化空，待出空', 'yqKong');
    if (verdict === '凶' && yuanOn) add(chong(yuanOn.zhi), '冲去元神', 'yqKeXiong');
    if (x.moving) {
      var tg = x.tags || [];
      if (tg.indexOf('化进神') >= 0) { add(z, '进神逢值', 'yqJin'); add(HE[z], '进神逢合', 'yqJin'); }
      if (tg.indexOf('化退神') >= 0) { add(x.bian.zhi, '退神逢值', 'yqTui'); add(chong(x.bian.zhi), '退神逢冲', 'yqTui'); }
      add(x.bian.zhi, '应于变爻', 'yqBian');
    }
    if (yuanOn && (flags.kong || !R.qi)) add(yuanOn.zhi, '元神逢值', 'yqYuan');
    var yuanStill = L.filter(function (l) { return l.qin === chain.yuan && !l.moving; })[0];
    if (!yuanOn && yuanStill && !R.qi) add(chong(yuanStill.zhi), '世衰元静，元神逢冲', 'yqYuan');
    others.forEach(function (o) {
      if (c.kong.indexOf(o.zhi) >= 0) add(o.zhi, '另一用神出空', 'liangxianYq');
      if (isBreak(o, mz)) add(o.zhi, '另一用神填破', 'liangxianYq');
    });
    step(out, '应期', '应期候选：' + yq.map(function (y) { return y.zhi + '（' + y.why.join('、') + '）'; }).join('；'), 'yqJing', 0, x.i >= 0 ? [x.i] : []);
    return { yong: x, want: want, label: label, chain: chain, plus: plus, minus: minus, verdict: verdict, wait: !!wait, steps: out, yingqi: yq };
  }

  // 任一爻在月日下的强弱明细，供智能体按需查询
  function assess(c, i) {
    var out = [], x = c.lines[i], r = riyue(x, c, out, (i + 1) + '爻' + x.zhi + x.wx);
    return { line: i + 1, zhi: x.zhi, wx: x.wx, qin: x.qin, season: r.season, qi: r.qi, plus: r.plus, minus: r.minus, flags: r.flags, power: x.moving || (x.dr && x.dr.anDong) ? power(x, c) : null, steps: out };
  }

  return { RULES: RULES, classify: classify, infer: infer, assess: assess, season: season };
})();
if (typeof module !== 'undefined') module.exports = YiInfer;
