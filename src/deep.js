// 二期进阶课程（07~10）、情境解卦对比案例、初学十二问与代表卦练习题库。
// 所有讲解均围绕公有领域经传原文独立编写，避免外部版权文本。
(function () {
  'use strict';

  function T(k, l) {
    return typeof Lessons !== 'undefined' && Lessons.T ? Lessons.T(k, l) : (l || k);
  }
  function safeStep(ctx, box, id, idx, okHtml, badPrefix) {
    if (typeof Lessons !== 'undefined' && Lessons.safeStep) {
      Lessons.safeStep(ctx, box, id, idx, okHtml, badPrefix);
    }
  }
  function hx(ctx, kw) {
    return ctx.HEX[kw - 1];
  }

  // ---- 第 07 课：立身三卦（乾、坤、谦） ----
  var QIAN_STAGES = [
    { idx: 0, tag: '初九 · 潜', phase: '积蓄潜伏期', text: '刚入门或刚进新环境，能力与时机都还没展开。这时的重点不是证明自己，而是沉住气把基本功练扎实。' },
    { idx: 1, tag: '九二 · 见', phase: '崭露头角期', text: '站到下卦居中的位置，开始有人注意到你的付出；适合主动请教前辈与同行（利见大人），在真事里磨练。' },
    { idx: 2, tag: '九三 · 惕', phase: '勤奋警醒期', text: '位置偏高又夹在下上交界，压力陡增。白天踏实推进，夜里反躬自省，就算险境环绕也能避开过失（无咎）。' },
    { idx: 3, tag: '九四 · 跃', phase: '犹豫试跳期', text: '进入上卦门坎，有机会跃升也有可能落空。可以试着跨步，但务必留好退路、自己扛得住结果。' },
    { idx: 4, tag: '九五 · 飞', phase: '盛年担当期', text: '阳居九五尊位又得中得正，能大展宏图；此时同样离不开同频贤才与团队支撑，才不至于孤掌难鸣。' },
    { idx: 5, tag: '上九 · 亢', phase: '盛极转折期', text: '走到最顶端还不肯留白、收手或交棒，盛势往往开始往下走。提醒自己高处留余地，及时换轨才不懊恼。' },
    { idx: 6, tag: '用九 · 无首', phase: '系统协同期', text: '乾卦独有的总收束：六条龙都很强，但人人守好本分、没有非抢头把交椅不可的傲气，团队反而整体大吉。' }
  ];

  var KUN_KEYS = [
    {
      li: 0, title: '初六 · 履霜',
      read: '脚下踩到第一层薄霜，就知道严寒要到了。小事刚露苗头时就及时收束调整，远比积重难返后再救火轻松得多。'
    },
    {
      li: 1, title: '六二 · 直方大',
      read: '处在坤卦下卦正中、柔顺当位：内心真诚（直）、行事有边界原则（方）、胸怀宽广能包容（大）。做到这三条，不必刻意讨巧也自然顺遂。'
    },
    {
      li: 4, title: '六五 · 黄裳元吉',
      read: '居上卦尊位却穿着谦和的下裳（黄色象征大地中正）：手里握着资源与地位，仍把姿态放平、衬托合作者，这是最高明的担当。'
    },
    {
      li: 5, title: '上六 · 龙战于野',
      read: '全阴走到尽头也不免激化对抗，胜负两方都跟着受损（其血玄黄）。哪怕习惯忍让，累积到极限也会反弹，因此贵在前面早早留出缓冲。'
    }
  ];

  var QIAN_SITUATIONS = [
    { q: '你刚换到一个全新行业，团队架构还没摸清，很想第一周就推大方案表现一下。', ans: '乾', why: '对应乾卦初九“潜龙勿用”：先沉潜观察、打好地基，别急着抢跑。' },
    { q: '项目终于上线拿了奖，大家都在夸核心骨干，你主动把功劳分给后勤与测试同事。', ans: '谦', why: '对应谦卦九三“劳谦君子”：有真功劳仍不居功独占，众人都乐于与你共事。' },
    { q: '最近发现项目周报连续两期出现隐瞒延期的苗头，虽是小事但决定立刻拉齐规则。', ans: '坤', why: '对应坤卦初六“履霜，坚冰至”：防微杜渐，看到薄霜就把冬天预案做好。' }
  ];

  // ---- 第 08 课：四大难卦（屯、坎、蹇、困） ----
  var HARD_FOUR = [
    {
      kw: 3, tag: '水雷屯', trap: '外部遇险、内心想动（上坎下震）',
      core: '难在“草创期秩序未立”。事情刚起步，资源缺、配合乱，越想一步登天越卡住。',
      breakthrough: '经文说“勿用有攸往，利建侯”：别急着单打独斗远征，先就地站稳脚跟、找齐靠谱搭档立规矩（经纶）。'
    },
    {
      kw: 29, tag: '习坎', trap: '内外皆险、接二连三（上下皆坎）',
      core: '难在“连续风波不断”。一波没平下一波又到，人最容易心态崩盘、胡乱投机。',
      breakthrough: '经文说“有孚，维心亨”：水流遇坑不逃避，先把坑填平再继续走；人靠守住内心诚信与日常节律（常德行）稳住阵脚。'
    },
    {
      kw: 39, tag: '水山蹇', trap: '前有大水、后背高山（上坎下艮）',
      core: '难在“前路确有硬障碍”。硬往前闯只会泥足深陷，所以连着几爻都劝“往蹇，来……”',
      breakthrough: '经文说“君子以反身修德”：看到走不通就先停步回身，检查自身短板、联系可靠同盟（朋来），别拿勇气硬撞死胡同。'
    },
    {
      kw: 47, tag: '泽无水困', trap: '水漏到泽底、资源枯竭（上兑下坎）',
      core: '难在“说话没人信、外援一时断档”。《卦辞》直指“有言不信”：处于低谷时越急着辩解，外人越当你在找借口。',
      breakthrough: '经文说“君子以致命遂志”：少说空话、守住原则做实事。提示：卦中“三岁”常按事务完整周期理解（如三天、三月或三季），并非死等三年。'
    }
  ];

  var HARD_QUIZ = [
    { s: '创业团队刚成立一个月，客户需求天天变、流程乱成一团，最想冲业绩却处处碰壁。', kw: 3, exp: '万事开头难但潜能还在，正是“水雷屯”：宜先立规矩、拉同盟（利建侯），不宜盲目冒进。' },
    { s: '这个季度家里和工作接连出状况，一个还没解决下一个又冒出来，心里快撑不住了。', kw: 29, exp: '重重险阻接连到来，是“习坎”：先靠诚信与日常功课把内心稳住（维心亨），只求小进不贪大功。' },
    { s: '新市场明显政策收紧、前路积水深不见底，继续加码只会赔得更多。', kw: 39, exp: '前面是险阻、自己脚下本是山，正是“水山蹇”：先撤回调整、反身修德、联结盟友再图后计。' },
    { s: '预算被砍、合作方临时撤资，越开会解释大家越不信，甚至觉得你在画饼。', kw: 47, exp: '资源匮乏且“有言不信”，最像“泽无水困”：少作无效口舌，安守志节把手里能做的事做到极致。' }
  ];

  var TURN_LINES = [
    { kw: 3, li: 0, note: '难局刚开始时唯一站在最底的阳爻，像打地基的桩：不急着出门，先找人建起秩序就能站住。' },
    { kw: 29, li: 3, note: '连大险之中也有通路：不必摆大排场，一壶朴素酒饭、从窗口递进一份真实诚意，照样能换来信任而无咎。' },
    { kw: 39, li: 4, note: '遇到极大阻滞时，个人力量肯定不够；守在九五中正位不自乱阵脚，真正可靠的朋友反而在困难时聚拢过来。' },
    { kw: 47, li: 5, note: '困到头其实已经快走出来了：被藤蔓缠得走不动，心里真正醒悟“再这么耗不行”并果断悔改前行，反而是转吉的起点。' }
  ];

  // ---- 第 09 课：修身四卦（损履井鼎）与三陈九卦 ----
  var CULTIVATE_FOUR = [
    {
      kw: 41, role: '损 · 减法智慧',
      modern: '减掉情绪与多余私欲（惩忿窒欲），看似吃亏让出一点利益，反而换来长久信任——“三人行则损一人”讲的也是聚焦与取舍。'
    },
    {
      kw: 10, role: '履 · 边界礼节',
      modern: '“履”是行走也是礼法边界。哪怕身后跟着老虎般棘手的局面，只要步步踩在规矩和分寸上（素履、愬愬），就不会轻易被反噬。'
    },
    {
      kw: 48, role: '井 · 公共积累',
      modern: '城池可以搬迁，好井的水脉却能一直养人。修好一口井后最忌盖起来独享（井收勿幕），把本事与成果分享出去才算圆满。'
    },
    {
      kw: 50, role: '鼎 · 承重鼎新',
      modern: '古时鼎既能煮食养贤，又象征责任平台。挑不起别硬扛（否则“鼎折足，覆公𫗧”），端稳架子、配合得当就能玉铉大吉。'
    }
  ];

  var NINE_HEX = [
    { kw: 10, nm: '履', step: '德之基', role: '行为与礼节的底盘', desc: '先守规矩、分清分寸，站稳脚跟才有资格谈后面的发展。' },
    { kw: 15, nm: '谦', step: '德之柄', role: '处世拿捏的手柄', desc: '本事再大也放低姿态，不招嫉、不膨胀，才能稳稳把事情拎起来。' },
    { kw: 24, nm: '复', step: '德之本', role: '知错回头的根本', desc: '发现方向偏了，“不远复”，趁早拐回正轨就是修养最实在的起点。' },
    { kw: 32, nm: '恒', step: '德之固', role: '不朝三暮四的定力', desc: '方向对之后耐得住日复一日，不被小风波吹散（小贴士：注意区分“恒久”与“死板不知变”）。' },
    { kw: 41, nm: '损', step: '德之修', role: '克制坏习惯的修剪', desc: '先做减法，管住急躁脾气和多余贪念，能力才有空间长出来。' },
    { kw: 42, nm: '益', step: '德之裕', role: '迁善改过的充裕', desc: '看到好榜样就跟进、发现自身错漏马上补，胸怀和能力就会越滚越宽。' },
    { kw: 47, nm: '困', step: '德之辨', role: '分辨真假底气的试金石', desc: '顺境谁都客气；只有被逼进低谷“有言不信”时，才能验出一个人是否真有原则。' },
    { kw: 48, nm: '井', step: '德之地', role: '不动摇的安身立足处', desc: '像老井一样不因外部换招牌就废弃自己，默默把水打清，让人长期受益。' },
    { kw: 57, nm: '巽', step: '德之制', role: '顺势入微的权变分寸', desc: '风能绕过障碍、随地形而入：既守住内心原则，又懂得看场合柔顺落地执行。' }
  ];

  var ANCHOR_LIST = [
    [1, '天行健 · 进程节奏'], [2, '厚德 · 顺承防微'], [15, '劳谦 · 六爻无凶'],
    [3, '草创 · 屯积立基'], [29, '重险 · 守信平心'], [39, '遇阻 · 反身修德'],
    [47, '资源枯竭 · 守志'], [41, '减法 · 惩忿窒欲'], [10, '守礼 · 如履虎尾'],
    [48, '积累 · 井收勿幕'], [50, '承重 · 正位凝命']
  ];

  // ---- 第 10 课：《系辞传》哲学总纲 ----
  var XICI_QUOTES = [
    {
      orig: '一阴一阳之谓道，继之者善也，成之者性也。',
      key: '关键词：一阴一阳 / 继之者善',
      explain: '万物从来不是单一力量独角戏，而是张与弛、进与退轮流交替（道）；人能顺应这股节奏、持续让生命与合作走下去（继），这就是“善”，久而久之长进自己的本性里。'
    },
    {
      orig: '易穷则变，变则通，通则久。',
      key: '关键词：穷则变，变则通',
      explain: '哪怕是当年最管用的办法，用到尽头没有空间（穷）时都必须调整（变）；转过弯道路打通（通），事业才能继续走得久。注意：变是为了通，不是为变而瞎折腾。'
    },
    {
      orig: '德薄而位尊，知小而谋大，力小而任重，鲜不及矣。',
      key: '关键词：量力而行',
      explain: '孔子点评鼎卦九四“鼎折足”时留下的警句：品行托不起名位、见识托不起大局、能力扛不住重担，几乎难免翻车。真正懂进退的人，不仅敢承担，也敢对不配位的事情说“不”。'
    }
  ];

  // ---- 同爻异境 · 情境解卦对比案例（供 #l6 使用） ----
  var CONTEXT_CASES = [
    {
      id: 'ctx-jie', title: '水泽节 · 九二「不出门庭，凶」',
      ben: '节', mv: [1],
      quote: '九二：不出门庭，凶。',
      hint: '二、三、四爻互卦为震（动）：本该行动的时候却缩在门内不动。',
      contexts: [
        {
          label: '情境 A：问“这辆车能买吗？”',
          take: '买车就是为了出门代步，占到九二却“不出门”，反过来提醒你买这辆车可以派上大用场，或者趁早把买车的事定下来动起来，别犹豫错过合适机会。',
          caution: '避坑：不能看见经文尾字有个“凶”就直接喊别买——得先把问题“买车拿来干嘛”套进去看。'
        },
        {
          label: '情境 B：问“现在适合买自住房吗？”',
          take: '房子恰恰是安居过日子的家，“不出门庭”原本安稳却得了个“凶”，说明房子本身条件、采光周边或长期入住意愿容易让人闷在家里不舒展，宜暂缓另看。',
          caution: '避坑：同样一句话换到安居问题上，本来宜静的事占到互震想动且判凶，就要小心判断。'
        }
      ]
    },
    {
      id: 'ctx-jie4', title: '雷水解 · 九四「解而拇，朋至斯孚」',
      ben: '解', mv: [3],
      quote: '九四：解而拇，朋至斯孚。',
      hint: '“拇”是大脚趾，“解而拇”＝解开脚上的束缚；上方是震（前进），动了就能和可信的朋友会合。',
      contexts: [
        {
          label: '情境 A：问“一段消耗人的旧关系该不该结束？”',
          take: '脚趾上的缠绕已经阻碍行动，把这段勉强的牵绊解开（解而拇），真正同频的伙伴和好机会反倒很快来到（朋至斯孚）。',
          caution: '避坑：重点是先理清不合理的牵扯，别因留恋而一直拖在原地。'
        },
        {
          label: '情境 B：问“重要物件或家人一时失联怎么办？”',
          take: '解开脚下卡顿的关键不在自己闭门干等，而在“朋至斯孚”——马上动用朋友人脉圈发消息一起找，往往很快传回线索。',
          caution: '避坑：如果机械照字面当成“要分手”，就会闹出牛头不对马嘴的大误会。'
        }
      ]
    },
    {
      id: 'ctx-jing1', title: '水风井 · 初六「井泥不食，旧井无禽」',
      ben: '井', mv: [0],
      quote: '初六：井泥不食，旧井无禽。',
      hint: '处于水井最底层（初爻）且柔弱无助，泥沙还没淘洗干净，连飞鸟都不肯停下来喝水。',
      contexts: [
        {
          label: '情境 A：问“要不要跳槽去一家看似老牌的公司？”',
          take: '表面看有招牌，内部其实早已老化淤塞、缺乏活水（旧井无禽），进去后施展空间很小，建议再多做背景调查或观望更佳选择。',
          caution: '避坑：别被老字号外表唬住，初爻已经点出底部淤泥还没清理。'
        },
        {
          label: '情境 B：问“打磨冷门旧手艺还有前途吗？”',
          take: '井的问题不在地点坏，而在“水还没淘净”。提醒你先别急着向外推广变现，眼下最该静下来做除泥、清淤、补齐基本功的苦活（四爻之后才会逐渐清冽）。',
          caution: '避坑：看时间线就知道初六还在最底，先把基础清理干净再看成效。'
        }
      ]
    }
  ];

  // ---- 初学十二问（供 #qa 使用，源自零基础最容易绕弯的思辨与实用问题） ----
  var QA = [
    {
      n: 1, cat: 'philosophy', tag: '入门认知',
      q: '如果要用最简洁的一句话，向朋友介绍《易经》是什么书？',
      short: '它不是算命秘籍，而是“通过观察自然与人事的变化规律，帮人安排自己进退选择”的智慧之书。',
      detail: '书名《易经》在英文常译作 I Ching 或 The Book of Changes。从“易之三名”（变易、不易、易简）看，最核心的不是神秘预测，而是让读者先认清万物都在变动中、变化背后有规律可循，进而在不同位置做出不失分寸的选择。',
      link: 'c0', linkNm: '第 0 课 · 破冰'
    },
    {
      n: 2, cat: 'philosophy', tag: '读经方法',
      q: '《易经》成书早于《易传》，后世多按儒家思路解读，会漏掉原始本义吗？',
      short: '确实有时代差异：先分清“经”与“传”，既借儒家《十翼》建立系统，也能独立回头看卦爻原本象意。',
      detail: '上古占筮起家的原文仅有二十来页、词简意古；战国至秦汉儒门编整的《十翼》把它提升成完整的人生哲学，才使它能跨越千年被后人读懂。学的时候只要记住“经归经、传归传”，先用《十翼》入门搭骨架，读熟后再对比原经文字，就不至于把两者混成一团。',
      link: 'c0', linkNm: '第 0 课 · 经传三层楼'
    },
    {
      n: 3, cat: 'philosophy', tag: '天人概念',
      q: '一边说“天道无吉凶”，一边又说“元者善之长也”，这矛盾吗？',
      short: '不矛盾：“无吉凶”讲自然的客观运行不偏心，“善之长”是从人的视角赞叹万物得以生发的根基。',
      detail: '如果天像人一样有喜怒偏私，那么风暴、冬寒与衰老就无法解释了。天地只是按阴阳节奏运行本身无所谓吉凶；真正产生“善恶”“吉凶”感受的，是有自由选择、有现实处境和欲望的“人”。把万物生机看作善的起点，是让人以顺应、成全生机的态度去立身。',
      link: 'c10', linkNm: '第 10 课 · 哲思总纲'
    },
    {
      n: 4, cat: 'philosophy', tag: '哲学思辨',
      q: '《系辞》说“一阴一阳之谓道，继之者善也，成之者性也”，怎么理解这里的“善”与“性”？',
      short: '“道”是阴阳交替的生生节奏，“继之者善”指人主动让这份正当秩序延续下去，久之养成稳固品性。',
      detail: '先秦谈善常指向“合适、能让生命与群体持续健康运转”。不是自然界替你做选择，而是人作为有自觉的主体，可以决定顺着自私贪婪去破坏平衡，还是自觉约束欲望、配合他人让关系长久通畅。反复这样选，品性也就由此长成。',
      link: 'c10', linkNm: '第 10 课 · 哲思三句'
    },
    {
      n: 5, cat: 'philosophy', tag: '价值准则',
      q: '从自然规律推导出人的“应当怎么活”，会不会陷入随时代乱变的相对主义？',
      short: '具体做法会随时代换壳，但背后“减损偏私、追求长久平衡”的方向相对稳定。',
      detail: '古人看水满则溢、月盈则亏，总结出谦卦“亏盈益谦”的做人尺度；不同年代对礼节的形式会有增减，例如繁琐旧俗会被淘汰，但“不过度膨胀、不侵占他人正常生存空间”这一基本内核并不轻易翻案。区分清“时代外衣”和“平衡内核”，就不会跌入虚无的相对论。',
      link: 'c7', linkNm: '第 7 课 · 谦卦智慧'
    },
    {
      n: 6, cat: 'practice', tag: '修身心态',
      q: '坤卦六二说“直方大，不习无不利”，难道养成好品质后就不用再努力了吗？',
      short: '“不习”是不需要额外做作、虚张声势；但要维持真诚端方不滑坡，平时仍得时时检视不松懈。',
      detail: '在日常与人打交道时，很多困难是因为心里拐弯太重、总想走捷径而惹出来的。一个人平时练好了内心正直、处事有方、能容人的底子，遇到事不用临时现学那些表面话术也能处理妥当；但这不是躺平执照，一旦放松警觉（比如滑向坤上六前的积累），照样会惹出风波。',
      link: 'c7', linkNm: '第 7 课 · 坤卦解读'
    },
    {
      n: 7, cat: 'divination', tag: '学易与占',
      q: '常听说《荀子》讲“善为易者不占”，是不是会《易经》的人就完全不能占卦？',
      short: '原话针对“把《易经》当成只用来算命”。真正懂易理的人不依赖占卜，但重大难断时仍可作为参考工具。',
      detail: '《荀子》同句还有“善为诗者不说，善为礼者不相”，意思是别把学问做死成表面仪式。学《易经》九成功夫在读义理、明处境；只有碰到自己想尽办法依然难测的重大路口，才偶尔借一套客观随机的符号帮自己跳出当局者迷——如果每天大事小事都占，反倒放弃了自己的思考和担当。',
      link: 'c10', linkNm: '第 10 课 · 居观动占'
    },
    {
      n: 8, cat: 'divination', tag: '三不占原则',
      q: '到底什么叫“不义不占”？关心公共新闻、或帮别人测算也不行吗？',
      short: '核心有两条：不合道义的事不能问，越位去替不归自己做主的他人或公共事件乱占也不合宜。',
      detail: '“不义不占”不是说你关心社会有错，而是看这件事是不是你的真实责任与实际关联。比如自己并未参与、只是拿热门人物或市场炒作当猎奇谈资去起卦，既不真诚也很难落回现实对照。如果是切实关系到自身后续移居、工作与安排的具体影响，把问题收窄回“对我自己的准备有何提醒”，才合理得多。',
      link: 'l5', linkNm: '起卦页 · 三不占体检'
    },
    {
      n: 9, cat: 'divination', tag: '多维视角',
      q: '起出一卦后，能同时结合综卦、错卦、互卦一起分析脉络吗？',
      short: '非常有效！本卦看眼前处境，互卦看内部隐线，综卦帮你站在对方视角换位看问题。',
      detail: '很多时候卡在自己执念里，换到综卦（上下翻过来）就像坐到谈判桌对面看局势，错卦（阴阳全反）提醒你最怕发生的对立面长什么样，互卦（2-4与3-5爻重组）拆出当前事情中间正在发酵的隐性推力。不过注意一条先后顺序：定吉凶基调还是以本卦、动爻和之卦为主，四面观照用来补全盲点、别喧宾夺主。',
      link: 'c3', linkNm: '第 3 课 · 一卦四面'
    },
    {
      n: 10, cat: 'divination', tag: '理性碰撞',
      q: '如果理性分析明明很合适，可占出来的卦辞却提醒很差，该信哪一边？',
      short: '不盲从任何一边：把坏卦辞当作一张“风险提示清单”，反过来查一查理性计划漏了哪些死角。',
      detail: '占卦不是替你取消思考的最高法院，而更像一位经验老到却说话含蓄的顾问给你泼一瓢冷水。遇到冲突时别立刻恐慌或放弃：去对照卦辞指向的具体隐患（比如合伙防内耗、时机防太急、细节防资金链断），如果仔细排查并补全预案后依然认为义所当为，承担起自己的选择便是。',
      link: 'l6', linkNm: '解卦页 · 情境工坊'
    },
    {
      n: 11, cat: 'divination', tag: '偶然与自由',
      q: '起卦靠随机抓数字或分蓍草，既说是“有意义的偶然”，难道不会跟“人有自由意志”打架吗？',
      short: '“偶然”指数字不是你刻意挑出来的；听到提醒后怎么回应、做不做决定，选择权始终在你手里。',
      detail: '打个比方：你正纠结一件事时，恰好朋友顺口说出一句切中要害的话——这话并不是命运脚本强制你照演，只是打破固有思路的提醒。卦象给出的处境镜像也是如此：真正决定结局的，是你在看清局面后愿意调整还是依然固执。',
      link: 'l5', linkNm: '起卦页 · 数字起卦'
    },
    {
      n: 12, cat: 'practice', tag: '面对凶卦',
      q: '万一真的占到极凶、极差的卦，但那件事现在又非做不可，该怎么办？',
      short: '两件事分开：心态上不侥幸、做好最坏承受与底线防守；行动上把大步拆小、该尽的本分照样做完。',
      detail: '面对凶卦最忌讳两件事：一是急着当场一占再占试图洗出一个好卦（再三渎则不告），二是慌着乱求偏方改运。更踏实的做法是承认未来三个月或这一步确实阻力重重，因此自觉收敛锋芒、砍掉不切实际的幻想、把风险隔离好；如果是问心无愧非扛不可的责任（知其不可而为之），知道前路艰难反而能让你准备更充足、走得更坦然。',
      link: 'c8', linkNm: '第 8 课 · 四大难卦'
    }
  ];

  // ---- 代表卦情境识卦题库（融合进 #drill 4 阶练习） ----
  var ANCHOR_QUIZ = [
    { q: '哪个卦常用来喻指“创业草创、外部险阻而内部急切想动，宜先立规矩找伙伴”？', ans: '屯（水雷屯）', bad: ['谦（地山谦）', '鼎（火风鼎）', '履（天泽履）'], tip: '水雷屯＝上坎下震，正是四大难卦的开头第一难。' },
    { q: '六十四卦中，哪一卦六爻皆无“凶”字，且讲“地中有山，有功不张扬”？', ans: '谦（地山谦）', bad: ['困（泽水困）', '蹇（水山蹇）', '屯（水雷屯）'], tip: '地山谦唯一阳爻在九三（劳谦君子），全卦天地人鬼神都助谦。' },
    { q: '哪一卦讲“泽里没有水、资源断流且有言不信，越解释别人越不信”？', ans: '困（泽水困）', bad: ['井（水风井）', '损（山泽损）', '坎（习坎）'], tip: '水在兑泽下面漏光了，就是“泽无水困”。' },
    { q: '哪一卦提醒“井水修好不要盖盖子独享，要像老井一样持续滋养众人”？', ans: '井（水风井）', bad: ['鼎（火风鼎）', '损（山泽损）', '履（天泽履）'], tip: '井卦上六“井收勿幕，有孚元吉”正是开放共享之心法。' },
    { q: '哪一卦的《大象》劝人“惩忿窒欲”（先减少脾气与多余私欲，损己利人）？', ans: '损（山泽损）', bad: ['履（天泽履）', '谦（地山谦）', '鼎（火风鼎）'], tip: '山下有泽、先减下方多出的部分去补上方，正是山泽损。' },
    { q: '哪一卦用“踩着老虎尾巴走路还不被咬”比喻做人处事守分寸、重礼节？', ans: '履（天泽履）', bad: ['蹇（水山蹇）', '屯（水雷屯）', '坤（坤为地）'], tip: '天泽履（上乾下兑），行止合度即使面虎也能平安通过。' },
    { q: '哪一卦讲“前路水深脚下又停在山边，发现硬冲必败时先反身修德、联结盟友”？', ans: '蹇（水山蹇）', bad: ['困（泽水困）', '坎（习坎）', '井（水风井）'], tip: '上坎下艮，“止于险前，反身修德”就是水山蹇。' },
    { q: '乾卦“用九”说“见群龙无首，吉”，最贴合哪一种现代含义？', ans: '各自独当一面又彼此配合，没人抢着争当头', bad: ['群龙陷入混乱没有指挥', '必须再找一个更强势的领袖压住所有人', '全员退隐不再做事'], tip: '“无首”并不是失控，而是每一爻都自觉成熟不抢风头。' },
    { q: '孔子讲到“德薄而位尊，知小而谋大，力小而任重”时，是在点评哪一卦的爻辞？', ans: '鼎卦九四（鼎折足）', bad: ['乾卦初九（潜龙勿用）', '谦卦九三（劳谦君子）', '履卦初九（素履）'], tip: '鼎足承重有限，硬扛超出自身德智力的重担就会“鼎折足”。' },
    { q: '坤卦初六“履霜，坚冰至”放到日常习惯或风险管理上，最接近哪个意思？', ans: '刚露出微小苗头就早早纠偏防微杜渐', bad: ['遇到困难就立刻彻底放弃', '只有等到大危机爆发才值得管', '凡事抢在所有人前面出头'], tip: '薄霜是寒冬最初的信号，在刚起头时最容易纠正。' }
  ];

  // ---- 向微课引擎注册第 07~10 课 ----
  var DEEP_LIST = [
    { id: 'c7', tag: '07', nm: '立身 · 乾、坤、谦', short: '乾坤谦', desc: '六龙进退 · 顺承防微 · 劳谦无凶', stage: 3, stageNm: '阶段三 · 代表卦精读与哲思', lede: '精读整本书最先确立的三块坐标：乾的自强节奏、坤的厚重承载，以及六爻无凶的谦卦。' },
    { id: 'c8', tag: '08', nm: '破局 · 四大难卦', short: '四难卦', desc: '屯、习坎、蹇、困的卡点与生门', stage: 3, stageNm: '阶段三 · 代表卦精读与哲思', lede: '低谷不是只有一种样子：把草创、重险、受阻和匮乏分清楚，才知道此刻该停、该守还是该联手。' },
    { id: 'c9', tag: '09', nm: '修身 · 损、履、井、鼎', short: '修身四卦', desc: '自求多福 · 三陈九卦 · 复盘笨功夫', stage: 3, stageNm: '阶段三 · 代表卦精读与哲思', lede: '把人生主动权拉回自己手里：学会做减法、守分寸、养一口好井并稳稳扛起担当，附三陈九卦忧患链。' },
    { id: 'c10', tag: '10', nm: '哲思 · 系辞传与生活', short: '系辞哲思', desc: '居观动占 · 生生与变通 · 安身崇德', stage: 3, stageNm: '阶段三 · 代表卦精读与哲思', lede: '串起整套课程的哲学底座：平常日子学义理修德，重要路口理性借象，安身之后再谈崇德。' }
  ];

  var DEEP_STEPS = {
    c7: [
      {
        title: '乾卦六龙曲线：从潜龙勿用到群龙无首',
        render: function (ctx) {
          var qian = hx(ctx, 1);
          return '<p>乾卦（' + qian.judgment + '）全由阳爻组成，' + T('大象传') + '说「' + qian.daxiang + '」。许多人只背过「自强不息」，却忽略了它把一条龙的成长拆成七步节律——该潜的时候盲目飞，照样跌下来。</p>' +
            '<p>点击下方七个阶段，看高亮的这一爻站在全卦哪个高度：</p>' +
            '<div class="dragon-track" role="tablist" aria-label="乾卦七阶段">' +
            QIAN_STAGES.map(function (st, i) {
              return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-di="' + i + '">' + st.tag + '</button>';
            }).join('') +
            '</div>' +
            '<div class="surface-sub split" id="qian-box"></div>' +
            '<div class="tip-box"><b>师友点拨 · 别把' + T('群龙无首') + '当成“没有领导”</b>' +
            '<p class="small">“见群龙无首，吉”不是混乱失序，恰恰相反：初到上每一爻都已看清自己的位阶与本分，没人非抢风头当头领，整个系统反而能顺畅协力往前走。</p></div>';
        },
        mount: function (box, ctx) {
          var qian = hx(ctx, 1);
          var btns = box.querySelectorAll('.dragon-track [data-di]');
          var host = box.querySelector('#qian-box');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-di') === i); });
            var st = QIAN_STAGES[i];
            var line = qian.lines[st.idx];
            var hot = i < 6 ? [i] : [0, 1, 2, 3, 4, 5];
            var sx = qian.smallxiang[i] ? '<div class="small">《小象传》：' + qian.smallxiang[i] + '</div>' : '';
            host.innerHTML = '<div class="block" style="align-items:center">' + ctx.gua(qian.bits, { size: 'lg', hot: hot }) +
              '<span class="chip">' + st.phase + '</span></div>' +
              '<div class="block"><div class="big">' + line.label + '：' + line.text + '</div>' + sx +
              '<div>' + st.text + '</div></div>';
          }
          btns.forEach(function (b) {
            b.onclick = function () {
              show(+b.getAttribute('data-di'));
              ctx.markStepDone('c7', 0);
            };
          });
          show(0);
          ctx.markStepDone('c7', 0);
        }
      },
      {
        title: '坤卦与顺承智慧：西南得朋、防微杜渐',
        render: function () {
          return '<p>坤卦紧跟在乾后面，专讲「承接、配合、包容」的工夫（' + T('厚德载物') + '）。顺承绝不是懦弱盲从——坤卦最怕的两件事：一是微小偏差没管住（' + T('防微杜渐') + '），二是自己想当头却看不清方向（先迷后得主）。</p>' +
            '<div class="deep-tabs" id="kun-tabs">' +
            KUN_KEYS.map(function (k, i) { return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-ki="' + i + '">' + k.title + '</button>'; }).join('') +
            '</div>' +
            '<div class="surface-sub split" id="kun-box"></div>' +
            '<div class="tip-box"><b>为什么经文说「利西南得朋，东北丧朋」？</b>' +
            '<p class="small">用第 2 课学过的' + T('后天八卦') + '一看就通：东南、正南、西南、正西连成一片，对应巽（长女）、离（中女）、坤（母）、兑（少女），全是阴卦“同类”；而正东、东北、正北、西北的震、艮、坎、乾全是阳卦。坤居其类所以得友；敢离开熟悉舒适圈去和不同角色合作（丧朋），最终才迎来更大喜庆。</p></div>' +
            '<div class="mcheck"><b>自检一题</b><div class="small">坤卦初六“履霜，坚冰至”最想提醒你什么？</div>' +
            '<div class="mopts">' +
            '<button type="button" class="mopt" data-ok="1">问题刚刚露一点苗头就及早收敛修正</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="等冻成坚冰再救往往已经两败俱伤（像坤上六龙战于野）。">一定要等到问题完全闹大再动手解决</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="恰恰相反，坤卦强调整装待发、不抢先冒头。">冬天到了要抢在所有人前面出头</button>' +
            '</div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          var kun = hx(ctx, 2);
          var btns = box.querySelectorAll('#kun-tabs [data-ki]');
          var host = box.querySelector('#kun-box');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-ki') === i); });
            var k = KUN_KEYS[i], line = kun.lines[k.li];
            host.innerHTML = '<div class="block" style="align-items:center">' + ctx.gua(kun.bits, { size: 'lg', hot: [k.li] }) +
              '<span class="small">小象：' + (kun.smallxiang[k.li] || '') + '</span></div>' +
              '<div class="block"><div class="big">' + line.label + '：' + line.text + '</div><div>' + k.read + '</div></div>';
          }
          btns.forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-ki')); }; });
          show(0);
          safeStep(ctx, box, 'c7', 1, '答对了！看见第一层薄霜就调整脚步，才不至于走到上六“龙战于野”。');
        }
      },
      {
        title: '谦卦：全书少见“六爻无凶”的破局坐标',
        render: function (ctx) {
          var qian15 = hx(ctx, 15);
          return '<p>地山谦（' + qian15.bits + '，上坤下艮）被看作《易经》最稳的一卦：<b>一座高山藏在平原地底之下</b>——有真才实学却从不张扬。更难得的是，从初六到上六全是吉、无不利或可守正，一条“凶”字也没有。</p>' +
            '<div class="split"><div class="surface-sub block" id="q15-view"></div>' +
            '<div class="block">' +
            '<div class="small">点选六爻看每一层的谦德表现（注意高亮的九三）：</div>' +
            '<div class="deep-tabs qian-btns">' +
            qian15.lines.map(function (ln, i) { return '<button type="button" class="chip' + (i === 2 ? ' on' : '') + '" data-qi="' + i + '">' + ln.label + (i === 2 ? ' ★主爻' : '') + '</button>'; }).join('') +
            '</div>' +
            '<div class="surface-sub block" id="q15-txt"></div>' +
            '</div></div>' +
            '<div class="mcheck"><b>自检一题</b><div class="small">按第 6 课学过的“物以稀为贵”，地山谦的' + T('主爻') + '是哪一爻？</div>' +
            '<div class="mopts">' +
            '<button type="button" class="mopt" data-ok="1">九三（全卦唯一阳爻，劳谦君子，有终吉）</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="初六是阴爻，不是“物以稀为贵”的那一爻。">初六（谦谦君子，用涉大川）</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="六五虽然尊贵，却是五条阴爻之一，全卦焦点集中在九三。">六五（不富以其邻）</button>' +
            '</div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          var h = hx(ctx, 15);
          var notes = [
            '还没掌实权时就谦虚自处，反倒能放心迈过坎坷（用涉大川，吉）。',
            '谦虚的名声自然流露，居中守正就能安稳吉祥。',
            '全卦唯一的阳爻，实在干活挑大梁（劳）还不自傲（谦），众阴都愿意配合，故有终吉。',
            '身处九三上面一点不压人，放低姿态发挥九三的作用，无不利。',
            '不靠撒钱讨好也能得邻人支持，必要时整肃团队亦无不利。',
            '哪怕走到最高位置仍保持谦和声名，但行师整顿只限于管好自家范围（征邑国）。'
          ];
          var btns = box.querySelectorAll('.qian-btns [data-qi]');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-qi') === i); });
            var ln = h.lines[i];
            box.querySelector('#q15-view').innerHTML = ctx.gua(h.bits, { size: 'lg', hot: [i], cls: 'gap-mid' }) +
              '<b>地山谦 · ' + h.judgment + '</b><span class="small">' + h.daxiang + '</span>' +
              '<span class="small">《彖传》四句：天道亏盈益谦、地道变盈流谦、鬼神害盈福谦、人道恶盈好谦。</span>';
            box.querySelector('#q15-txt').innerHTML = '<b>' + ln.label + '：' + ln.text + '</b><div class="small">' + notes[i] + '</div>' +
              '<div class="small">小象：' + (h.smallxiang[i] || '') + '</div>';
          }
          btns.forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-qi')); }; });
          show(2);
          safeStep(ctx, box, 'c7', 2, '没错！九三是地山谦唯一阳爻，“有功不炫、实在干事”，所以成为全卦核心。');
        }
      },
      {
        title: '三卦合参：日常处境怎么对号入座？',
        render: function () {
          return '<p>乾教人看清进程节奏（何时该藏、何时该进、何时停手），坤教人顺时承接、看住微末苗头，谦则给出了最稳妥的社会相处姿态。做完下面三道情景配对，把三块坐标刻进脑子里：</p>' +
            '<div class="block" id="q3-match">' +
            QIAN_SITUATIONS.map(function (it, idx) {
              return '<div class="surface-sub block sc-match" data-si="' + idx + '"><b>情景 ' + (idx + 1) + '：' + it.q + '</b>' +
                '<div class="mopts">' +
                ['乾', '坤', '谦'].map(function (name) {
                  return '<button type="button" class="mopt sm-opt" data-pick="' + name + '">对照「' + name + '卦」</button>';
                }).join('') +
                '</div><div class="mfb"></div></div>';
            }).join('') +
            '</div>' +
            '<div class="row"><a class="btn ghost" href="#dict" data-jump="1" style="text-decoration:none">在卦典读乾卦原文</a>' +
            '<a class="btn ghost" href="#dict" data-jump="2" style="text-decoration:none">在卦典读坤卦原文</a>' +
            '<a class="btn ghost" href="#dict" data-jump="15" style="text-decoration:none">在卦典读谦卦原文</a></div>';
        },
        mount: function (box, ctx) {
          var done = {};
          box.querySelectorAll('.sc-match').forEach(function (row) {
            var idx = +row.getAttribute('data-si'), item = QIAN_SITUATIONS[idx];
            var opts = row.querySelectorAll('.sm-opt'), fb = row.querySelector('.mfb');
            opts.forEach(function (b) {
              b.onclick = function () {
                var ok = b.getAttribute('data-pick') === item.ans;
                opts.forEach(function (x) { x.classList.remove('pick-y', 'pick-n'); });
                b.classList.add(ok ? 'pick-y' : 'pick-n');
                fb.className = 'mfb ' + (ok ? 'ok' : 'bad');
                fb.textContent = (ok ? '✓ 配对正确：' : '还差一点，再对照三卦特点想想：') + (ok ? item.why : '乾主进退节奏，坤主顺承防微，谦主有功不傲。');
                if (ok) {
                  done[idx] = true;
                  if (Object.keys(done).length === QIAN_SITUATIONS.length) ctx.markStepDone('c7', 3);
                }
              };
            });
          });
          box.querySelectorAll('[data-jump]').forEach(function (a) {
            a.onclick = function () { ctx.setDictSel(+a.getAttribute('data-jump')); };
          });
        }
      }
    ],

    c8: [
      {
        title: '一图看懂四大难卦：卡在哪里，为什么叫“难”？',
        render: function () {
          return '<p>人不可能永远顺风顺水。古人在《易经》里挑出四盘公认最磨人的局——合称' + T('四大难卦') + '。把它们并排摆在一起对比上下卦结构，你就能分辨自己眼下究竟属于哪种难，不至于乱开药方：</p>' +
            '<div class="deep-tabs" id="h4-tabs">' +
            HARD_FOUR.map(function (it, i) { return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-hi="' + i + '">' + it.tag + '</button>'; }).join('') +
            '</div>' +
            '<div class="surface-sub split" id="h4-box"></div>';
        },
        mount: function (box, ctx) {
          var btns = box.querySelectorAll('#h4-tabs [data-hi]');
          var host = box.querySelector('#h4-box');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-hi') === i); });
            var item = HARD_FOUR[i], h = hx(ctx, item.kw);
            host.innerHTML = '<div class="block" style="align-items:center">' + ctx.gua(h.bits, { size: 'lg', cls: 'gap-mid' }) +
              '<span class="chip m">' + item.trap + '</span>' +
              '<a class="btn ghost" href="#dict" data-hdict="' + item.kw + '" style="text-decoration:none">去卦典看完整原文</a></div>' +
              '<div class="block"><div class="big">' + item.tag + '（第 ' + item.kw + ' 卦）</div>' +
              '<div class="quote">' + h.judgment + '</div>' +
              '<div class="small">《大象》：' + h.daxiang + '</div>' +
              '<div><b>卡点在哪：</b>' + item.core + '</div>' +
              '<div><b>应对钥匙：</b>' + item.breakthrough + '</div></div>';
            host.querySelector('[data-hdict]').onclick = function () { ctx.setDictSel(item.kw); };
          }
          btns.forEach(function (b) {
            b.onclick = function () { show(+b.getAttribute('data-hi')); ctx.markStepDone('c8', 0); };
          });
          show(0);
          ctx.markStepDone('c8', 0);
        }
      },
      {
        title: '困境诊断台：遇到这种低谷，对上哪一卦？',
        render: function () {
          return '<p>试着用上面四个坐标系来给具体处境做体检。选出最贴近该场景的那一难卦：</p>' +
            '<div class="block" id="hard-quiz">' +
            HARD_QUIZ.map(function (q, i) {
              return '<div class="surface-sub block hq-item" data-qi="' + i + '"><b>病例 ' + (i + 1) + '：' + q.s + '</b>' +
                '<div class="mopts">' +
                HARD_FOUR.map(function (h) {
                  return '<button type="button" class="mopt hq-opt" data-kw="' + h.kw + '">' + h.tag + '</button>';
                }).join('') +
                '</div><div class="mfb"></div></div>';
            }).join('') +
            '</div>';
        },
        mount: function (box, ctx) {
          var solved = {};
          box.querySelectorAll('.hq-item').forEach(function (card) {
            var idx = +card.getAttribute('data-qi'), item = HARD_QUIZ[idx];
            var opts = card.querySelectorAll('.hq-opt'), fb = card.querySelector('.mfb');
            opts.forEach(function (b) {
              b.onclick = function () {
                var ok = +b.getAttribute('data-kw') === item.kw;
                opts.forEach(function (x) { x.classList.remove('pick-y', 'pick-n'); });
                b.classList.add(ok ? 'pick-y' : 'pick-n');
                fb.className = 'mfb ' + (ok ? 'ok' : 'bad');
                fb.textContent = ok ? ('✓ 诊断准确：' + item.exp) : '还差一点：看清它是“起步乱 / 连续险 / 前有死堵 / 资源枯竭”里的哪一种。';
                if (ok) {
                  solved[idx] = true;
                  if (Object.keys(solved).length >= 3) ctx.markStepDone('c8', 1);
                }
              };
            });
          });
        }
      },
      {
        title: '绝处生门：四大难卦里的转机之爻',
        render: function (ctx) {
          return '<p>难卦之所以还值得学，是因为它们从来不让人绝望到底——每盘困境里都藏着清醒的生门。点击查看四难卦中极具转机意义的一爻：</p>' +
            '<div class="deep-tabs turn-btns">' +
            TURN_LINES.map(function (t, i) {
              var h = hx(ctx, t.kw);
              return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-ti="' + i + '">' + h.name + ' · ' + h.lines[t.li].label + '</button>';
            }).join('') +
            '</div>' +
            '<div class="surface-sub split" id="turn-box"></div>' +
            '<div class="mcheck"><b>自检一题</b><div class="small">遇上“泽无水困”且“有言不信”时，哪种做法最贴近经文劝告？</div>' +
            '<div class="mopts">' +
            '<button type="button" class="mopt" data-ok="1">少做无谓辩解，安守正道把眼前能修补的实事扛住</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="经文恰恰先警告“有言不信”，口头急着辩解反而越描越黑。">每天发长文辩解，指望靠口才扭转信任</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="“三岁”指一个完整变化周期，并非让人干坐什么都不调整。">算了，原地躺平整整三年再看</button>' +
            '</div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          var btns = box.querySelectorAll('.turn-btns [data-ti]');
          var host = box.querySelector('#turn-box');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-ti') === i); });
            var t = TURN_LINES[i], h = hx(ctx, t.kw), ln = h.lines[t.li];
            host.innerHTML = '<div class="block" style="align-items:center">' + ctx.gua(h.bits, { size: 'lg', hot: [t.li], cls: 'gap-mid' }) + '</div>' +
              '<div class="block"><div class="big">' + h.name + ' ' + ln.label + '：' + ln.text + '</div>' +
              '<div class="small">小象：' + (h.smallxiang[t.li] || '') + '</div>' +
              '<div>' + t.note + '</div></div>';
          }
          btns.forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-ti')); }; });
          show(0);
          safeStep(ctx, box, 'c8', 2, '记牢了：困时少辩解、守实事（致命遂志），往往先守稳再等转机。');
        }
      }
    ],

    c9: [
      {
        title: '“自求多福”的四块基石：损、履、井、鼎',
        render: function () {
          return '<p>靠天不如靠己的底气从哪来？把这四卦拼在一起就是一份现代人的“自求多福清单”：先对自己的私心做减法（<b>损</b>），做事守住礼法边界（<b>履</b>），再把功夫修成众人可用的清泉（<b>井</b>），最后才有资格扛起共治的大器（<b>鼎</b>）。</p>' +
            '<div class="deep-tabs" id="s4-tabs">' +
            CULTIVATE_FOUR.map(function (it, i) { return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-si="' + i + '">' + it.role + '</button>'; }).join('') +
            '</div>' +
            '<div class="surface-sub split" id="s4-box"></div>';
        },
        mount: function (box, ctx) {
          var btns = box.querySelectorAll('#s4-tabs [data-si]');
          var host = box.querySelector('#s4-box');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-si') === i); });
            var it = CULTIVATE_FOUR[i], h = hx(ctx, it.kw);
            host.innerHTML = '<div class="block" style="align-items:center">' + ctx.gua(h.bits, { size: 'lg', cls: 'gap-mid' }) +
              '<a class="btn ghost" href="#dict" data-sdict="' + it.kw + '" style="text-decoration:none">进卦典细读</a></div>' +
              '<div class="block"><div class="big">' + h.name + '卦 · ' + it.role + '</div>' +
              '<div class="quote">' + h.judgment + '</div>' +
              '<div class="small">《大象》：' + h.daxiang + '</div>' +
              '<div>' + it.modern + '</div></div>';
            host.querySelector('[data-sdict]').onclick = function () { ctx.setDictSel(it.kw); };
          }
          btns.forEach(function (b) {
            b.onclick = function () { show(+b.getAttribute('data-si')); ctx.markStepDone('c9', 0); };
          });
          show(0);
          ctx.markStepDone('c9', 0);
        }
      },
      {
        title: '《系辞》“三陈九卦”：应对忧患的九把钥匙',
        render: function () {
          return '<p>为什么《系辞下传》不挑“泰”“大有”这些顺卦，偏偏连续三遍拆解下面这九卦（后世称' + T('三陈九卦') + '）？因为《易经》写于忧患之际——真遇到风浪时，靠这九套修德功课才能保身不乱。点击卡片逐个查看：</p>' +
            '<div class="nine-grid" id="nine-grid">' +
            NINE_HEX.map(function (g, i) {
              return '<button type="button" class="nine-card' + (i === 0 ? ' on' : '') + '" data-ni="' + i + '"><b>' + g.nm + '</b><span class="small">' + g.step + '</span></button>';
            }).join('') +
            '</div>' +
            '<div class="surface-sub block" id="nine-detail"></div>' +
            '<div class="mcheck"><b>自检一题</b><div class="small">在“三陈九卦”里，哪一卦被称为“德之柄”（有了它才能抓牢所有美德不发飘）？</div>' +
            '<div class="mopts">' +
            '<button type="button" class="mopt" data-ok="1">谦卦（劳而有功仍不自矜）</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="履卦是“德之基”（做人行走的基础边界），谦才是“德之柄”。">履卦（踩规矩而行）</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="井卦是“德之地”（稳固不迁的安身之地）。">井卦（修养泉源）</button>' +
            '</div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          var cards = box.querySelectorAll('#nine-grid [data-ni]');
          var host = box.querySelector('#nine-detail');
          function show(i) {
            cards.forEach(function (c) { c.classList.toggle('on', +c.getAttribute('data-ni') === i); });
            var item = NINE_HEX[i], h = hx(ctx, item.kw);
            host.innerHTML = '<div class="row">' + ctx.gua(h.bits, { size: 'mid' }) +
              '<div class="block" style="gap:4px"><b>第 ' + item.kw + ' 卦 · ' + item.nm + '（' + item.step + ' · ' + item.role + '）</b>' +
              '<span class="small">' + h.daxiang + '</span></div></div>' +
              '<div>' + item.desc + '</div>';
          }
          cards.forEach(function (c) { c.onclick = function () { show(+c.getAttribute('data-ni')); }; });
          show(0);
          safeStep(ctx, box, 'c9', 1, '答对了！《系辞》说“履，德之基也；谦，德之柄也”——谦逊让人时刻拿稳尺度。');
        }
      },
      {
        title: '不用死背记住 64 卦的笨功夫：锚点 + 复盘',
        render: function (ctx) {
          return '<p>初学者最常卡在一句话：“64 卦、384 爻怎么背得下来？”其实不需要死记硬背，靠下面两招笨功夫用上一两年，大部分常用卦自然会记住：</p>' +
            '<div class="split"><div class="surface-sub block"><b>1. 先认熟这 11 个锚点坐标</b><div class="small">把 07~09 课这 11 个代表卦当成城市主干道：</div>' +
            '<div class="chips">' + ANCHOR_LIST.map(function (a) {
              var h = hx(ctx, a[0]);
              return '<a class="chip" href="#dict" data-adict="' + a[0] + '" style="text-decoration:none">' + h.name + ' · ' + a[1] + '</a>';
            }).join('') + '</div></div>' +
            '<div class="surface-sub block"><b>2. 常写' + T('占卦复盘') + '</b>' +
            '<div class="small">每次认真问过一个问题并起卦，别看过就忘——在 <a href="#l6">解卦页复盘笔记</a> 记下四件事：当时问了什么、得哪一卦哪一爻、你最初怎么读、几个月后实际发生了什么。错解过的那一卦，下回一辈子都不会忘。</div>' +
            '<div class="row"><a class="btn" href="#l6" style="text-decoration:none">去解卦页写复盘笔记</a></div></div></div>';
        },
        mount: function (box, ctx) {
          box.querySelectorAll('[data-adict]').forEach(function (a) {
            a.onclick = function () { ctx.setDictSel(+a.getAttribute('data-adict')); };
          });
          ctx.markStepDone('c9', 2);
        }
      }
    ],

    c10: [
      {
        title: '平日读经 vs 难局占卦：《系辞》的“动静二分”',
        render: function () {
          return '<p>很多初学者把“学《易经》”和“每天算一卦”混在一起。《系辞上传》早给出了清楚的分工——平时安稳生活读它的文字义理，真正走到紧要关口、信息算不尽时再让符号辅助参照。</p>' +
            '<div class="deep-tabs mode-compare">' +
            '<button type="button" class="chip on" data-mc="0">居则观其象，而玩其辞（常态）</button>' +
            '<button type="button" class="chip" data-mc="1">动则观其变，而玩其占（转折）</button>' +
            '</div>' +
            '<div class="surface-sub block" id="mc-box"></div>' +
            '<div class="tip-box"><b>顺便正本清源：什么叫' + T('善为易者不占') + '？</b>' +
            '<p class="small">出自《荀子》，原意是“学通易理的人不必事事依赖占卜”，就好像真正懂礼的人不只是当司仪，真正懂诗的人不只是吊书袋——如果遇到生死两难或重大公私抉择，认真参考一卦提醒并不过分，但不该把它当日常拐杖。</p></div>';
        },
        mount: function (box, ctx) {
          var views2 = [
            {
              hd: '居则观其象，而玩其辞',
              list: [
                '对象：风平浪静的日常生活（九成时间）',
                '做法：翻读一卦卦象与经传文字，对照自己所处的位置、人际与工作阶段',
                '收获：把圣人总结过的高风险格局提前读过一遍，少交很多不必要的学费'
              ]
            },
            {
              hd: '动则观其变，而玩其占',
              list: [
                '对象：面临重大转折、理性推算已尽但仍难以落锤的事（一成关键时刻）',
                '做法：守住“三不占”，认真起一卦并按动爻细读提醒',
                '收获：换一只局外人的冷静眼睛，检查自己是不是被执念或贪心蒙蔽了死角'
              ]
            }
          ];
          var btns = box.querySelectorAll('.mode-compare [data-mc]');
          var host = box.querySelector('#mc-box');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-mc') === i); });
            var v = views2[i];
            host.innerHTML = '<b>' + v.hd + '</b><ul class="small" style="margin:0;padding-left:18px;display:grid;gap:6px">' +
              v.list.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
          }
          btns.forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-mc')); ctx.markStepDone('c10', 0); }; });
          show(0);
          ctx.markStepDone('c10', 0);
        }
      },
      {
        title: '读懂《系辞传》三句总纲',
        render: function () {
          return '<p>如果用最短篇幅概括' + T('系辞传') + '最打动人的哲学骨干，重点看清下面这三句名言——点击每张卡片拆解核心概念与常见误读：</p>' +
            '<div class="deep-tabs phil-tabs">' +
            XICI_QUOTES.map(function (q, i) { return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-pi="' + i + '">' + q.key + '</button>'; }).join('') +
            '</div>' +
            '<div class="surface-sub block" id="phil-box"></div>' +
            '<div class="small">关联词条：' + T('生生之谓易') + ' · ' + T('穷则变') + ' · ' + T('三易') + '</div>';
        },
        mount: function (box, ctx) {
          var btns = box.querySelectorAll('.phil-tabs [data-pi]');
          var host = box.querySelector('#phil-box');
          function show(i) {
            btns.forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-pi') === i); });
            var q = XICI_QUOTES[i];
            host.innerHTML = '<div class="quote">' + q.orig + '</div><div>' + q.explain + '</div>';
          }
          btns.forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-pi')); ctx.markStepDone('c10', 1); }; });
          show(0);
          ctx.markStepDone('c10', 1);
        }
      },
      {
        title: '天道无吉凶，吉凶在于人与选择（全课总结）',
        render: function () {
          return '<p>自然界的春夏秋冬与月圆月缺从不带个人私心——阳光晒坏庄稼不是天坏心，好雨让人丰收也不是天发奖。只有站到有自由意志的“人”这一边，得失、盼望与忧患才让处境显得有吉有凶。</p>' +
            '<div class="split">' +
            '<div class="surface-sub block"><b>自然（实然层）</b><span class="small">阴阳轮转、盛极必衰、过犹不及——它是客观条件，不听你情绪指挥。</span></div>' +
            '<div class="surface-sub block"><b>人道（安身与崇德）</b><span class="small">《系辞》还讲“利用安身，以崇德也”：先通过实事把日子安顿站稳，再顺势提升德行视野，不空谈清高。</span></div>' +
            '</div>' +
            '<div class="mcheck"><b>毕业自检</b><div class="small">学完 00~10 全部微课，关于《易经》的“吉”与“凶”，下面哪句理解最靠谱？</div>' +
            '<div class="mopts">' +
            '<button type="button" class="mopt" data-ok="1">天道只显趋势，吉凶是人在得失与抉择里走出来的，所以凶可因修德自救而避、吉也会因傲慢而丢</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="占出“吉”而得意忘形，像乾上九、泰上六照样会往下滑。">占出“吉”就保证躺赢，“凶”就彻底无药可救</button>' +
            '<button type="button" class="mopt" data-ok="0" data-why="看懂局势仍要落回自己的判断与行动，不能推给符号代劳。">以后任何日常决定都得先起一卦再说</button>' +
            '</div><div class="mfb"></div></div>' +
            '<div class="chain">' +
            '<a class="cnode" href="#qa" style="text-decoration:none;color:inherit"><b>初学十二问</b><span class="small">看哲学思辨与占卦现实困惑的 12 篇详答</span></a>' +
            '<a class="cnode" href="#l5" style="text-decoration:none;color:inherit"><b>起卦实操</b><span class="small">通过“三不占”后亲手排一次大衍或数字卦</span></a>' +
            '<a class="cnode" href="#l6" style="text-decoration:none;color:inherit"><b>情境解卦工坊</b><span class="small">体验“同爻异境”并用复盘笔记记录实战</span></a>' +
            '<a class="cnode" href="#drill" style="text-decoration:none;color:inherit"><b>分级练习（全 5 阶）</b><span class="small">把八卦、先后天、代表卦与变爻变成手感</span></a></div>';
        },
        mount: function (box, ctx) {
          safeStep(ctx, box, 'c10', 2, '通透！做到“见吉不骄、见凶不慌、重在自己安身与修德”，就是这整门入门课最值得带走的东西。');
        }
      }
    ]
  };

  if (typeof Lessons !== 'undefined' && Lessons.register) {
    Lessons.register(DEEP_LIST, DEEP_STEPS);
  }

  window.DeepStudy = {
    CONTEXT_CASES: CONTEXT_CASES,
    QA: QA,
    ANCHOR_QUIZ: ANCHOR_QUIZ
  };
})();
