// 零基础双模式微课引擎（闯关模式 / 全览模式）与第 0~6 课完整教学内容。
var Lessons = (function () {
  'use strict';

  var LIST = [
    { id: 'c0', tag: '00', nm: '破冰 · 何为易经', short: '破冰', desc: '先破误区，看懂经与传', stage: 1, stageNm: '阶段一 · 破冰与符号语法', lede: '先拿掉神秘面纱：原经其实只有二十来页，教你用一套符号格局观察变化、安排进退。' },
    { id: 'c1', tag: '01', nm: '符号 · 从一画到八卦', short: '八卦', desc: '三才铁律 · 以少为主 · 象形联想', stage: 1, stageNm: '阶段一 · 破冰与符号语法', lede: '不必死背八张图：掌握“由下往上”和“以少为主”两条规律，就能自己推出全家八个卦。' },
    { id: 'c2', tag: '02', nm: '图阵 · 先天与后天八卦', short: '图阵', desc: '对角相加 9 · 四季五行 · 洛书 15', stage: 1, stageNm: '阶段一 · 破冰与符号语法', lede: '同一套八卦有两张图：先天管宇宙对称与数字编码，后天管四季流转与现实方位。' },
    { id: 'c3', tag: '03', nm: '成卦 · 重卦、念法与卦序', short: '成卦', desc: '叠卦 · 听名画卦 · 序卦故事链 · 四面', stage: 1, stageNm: '阶段一 · 破冰与符号语法', lede: '两个单卦上下一叠，成 64 种处境。专治初学头号大坑：念从上往下，画必须从下往上。' },
    { id: 'c4', tag: '04', nm: '经传 · 看懂一页《周易》', short: '经传', desc: '初九六二 · 十翼分工 · 活卦初读', stage: 2, stageNm: '阶段二 · 读经解码器', lede: '翻开《周易》不再晕：先分清爻名规矩，再把卦辞、彖传、大小象逐段对齐，最后跟读一整卦。' },
    { id: 'c5', tag: '05', nm: '读辞 · 元亨利贞与吉凶词', short: '读辞', desc: '四德正反 · 无咎补过 · 全书吉凶图', stage: 2, stageNm: '阶段二 · 读经解码器', lede: '读懂判断词的准确温度：无咎不是天然没错，而是善于补过；“贞”也不全是占卜。' },
    { id: 'c6', tag: '06', nm: '爻位 · 读爻四把尺子', short: '爻位', desc: '当位 · 得中 · 正应 · 乘承 · 主爻', stage: 2, stageNm: '阶段二 · 读经解码器', lede: '先看真实卦例热身，再用四把尺子量一量：为什么常说“中胜于正”？谁是全卦主角？' }
  ];

  // 阶段练手用的 15 个核心锚点卦（乾坤谦、四大难卦、常用代表卦）
  var CORE_KW = [1, 2, 3, 4, 5, 10, 11, 12, 14, 15, 29, 30, 41, 47, 50];

  var TRI_INFO = {
    乾: { xing: '健', body: '首', fam: '父', ani: '马', xian: '南', hou: '西北', why: '三条不断开，刚健奔行不停，好比天体运转与日行千里的马（注意：八卦象里乾是马，龙是震，六龙比喻来自乾卦爻辞）。' },
    坤: { xing: '顺', body: '腹', fam: '母', ani: '牛', xian: '北', hou: '西南', why: '三条皆断，中空能容纳，像大地承载万物、母腹孕育生命，以及温顺负重、默默付出的牛。' },
    震: { xing: '动', body: '足', fam: '长男', ani: '龙', xian: '东北', hou: '东', why: '一阳从最底动起、上承两阴，像雷从地底震出；长男担起行动与开拓（足），能潜能飞潜能无限（龙）。' },
    巽: { xing: '入', body: '股', fam: '长女', ani: '鸡', xian: '西南', hou: '东南', why: '一阴贴在最下、上方双阳流动，像风无孔不入；如大腿（股）衔接上下行动，如欧洲屋顶指风向的风鸡。' },
    坎: { xing: '陷', body: '耳', fam: '中男', ani: '豕', xian: '西', hou: '北', why: '一阳陷在两阴之中，竖着看就像古体“水”字；低陷处能聚水也能聚声（耳），水深处常伴危机与陷阱。' },
    离: { xing: '丽', body: '目', fam: '中女', ani: '雉', xian: '东', hou: '南', why: '外实而中虚，“丽”是附着——火必须附在木柴上才能发光，象征明亮的眼睛（目）和羽毛鲜艳的野鸡（雉）。' },
    艮: { xing: '止', body: '手', fam: '少男', ani: '狗', xian: '西北', hou: '东北', why: '最上一阳像连绵山顶棱线，下虚如山脚；山挡住去路（止），对应伸手阻拦（手）与看门犬（狗）。“兄弟如手足”即出自震足与艮手。' },
    兑: { xing: '说', body: '口', fam: '少女', ani: '羊', xian: '东南', hou: '西', why: '上面开口的沼泽，聚水而不溢，让人欣喜（悦）；对应说话的口舌与温顺令人愉悦的羊。' }
  };

  var KOUJUE = [
    ['乾', '乾三连'], ['坤', '坤六断'], ['震', '震仰盂'], ['艮', '艮覆碗'],
    ['离', '离中虚'], ['坎', '坎中满'], ['兑', '兑上缺'], ['巽', '巽下断']
  ];

  var HOUTIAN_SEQ = [
    { tri: '震', dir: '正东', season: '春 · 生发', wx: '木', animal: '青龙', note: '帝出乎震：万物从东方破土而出，生意勃发。' },
    { tri: '巽', dir: '东南', season: '春夏之交', wx: '木', animal: '青龙', note: '齐乎巽：春风吹拂，万物整齐舒展、长得匀称。' },
    { tri: '离', dir: '正南', season: '夏 · 繁盛', wx: '火', animal: '朱雀', note: '相见乎离：阳光灿烂，万物彼此清晰相见。' },
    { tri: '坤', dir: '西南', season: '长夏', wx: '土', animal: '中土', note: '致役乎坤：大地默默输送养分，全力养育万物。' },
    { tri: '兑', dir: '正西', season: '秋 · 喜悦', wx: '金', animal: '白虎', note: '说言乎兑：果实成熟，万物迎来收获与喜悦。' },
    { tri: '乾', dir: '西北', season: '秋冬之交', wx: '金', animal: '白虎', note: '战乎乾：阳气与渐盛的阴气交锋整理、收敛威严。' },
    { tri: '坎', dir: '正北', season: '冬 · 藏伏', wx: '水', animal: '玄武', note: '劳乎坎：万物辛劳一年后在冬日水乡休息归藏。' },
    { tri: '艮', dir: '东北', season: '冬春交替', wx: '土', animal: '中土', note: '成言乎艮：旧周期在此画下句号，同时孕育下一轮开始。' }
  ];

  // 《卦名次序歌》（朱熹，公有领域），按教学分为 8 组，配易错字注音与原创《序卦》因果串联
  var SONG_GROUPS = [
    {
      verse: '乾坤屯蒙需讼师，比小畜兮履泰否',
      ruby: [
        { w: '屯', p: 'zhūn（勿读 tún）' }, { w: '比', p: 'bì（亲近）' },
        { w: '畜', p: 'xù（积蓄）' }, { w: '否', p: 'pǐ（闭塞，勿读 fǒu）' }
      ],
      chain: [
        [1, '天地开篇：纯阳创造'], [2, '大地承接：厚德化育'], [3, '万物初生，草创维艰'],
        [4, '幼苗蒙昧，需要启蒙'], [5, '成长须养，耐心等待'], [6, '为需争执，引发诉讼'],
        [7, '争端扩大，兴师统众'], [8, '战后求稳，择善亲比'], [9, '亲近积蓄，以小畜大'],
        [10, '群居立规，谨慎守礼'], [11, '秩序通畅，天地交泰'], [12, '顺境久必傲慢，转入闭塞']
      ],
      tip: '背前两句就能掌握前 12 卦：从天地诞生一路演进到社会秩序与“泰极否来”。'
    },
    {
      verse: '同人大有谦豫随，蛊临观兮噬嗑贲',
      ruby: [
        { w: '噬嗑', p: 'shì hé（咬合）' }, { w: '贲', p: 'bì（文饰，勿读 bēn）' }
      ],
      chain: [
        [13, '闭塞之中，志同道合'], [14, '众人聚力，大有所获'], [15, '大有而不骄，谦卑自守'],
        [16, '谦虚自得，和乐愉悦'], [17, '愉悦招人，彼此追随'], [18, '盲随积弊，整顿改革'],
        [19, '整顿有功，气象盛大'], [20, '居高临下，观察自省'], [21, '发现障碍，咬合除障（明法）'],
        [22, '法度既立，外加文采修饰']
      ],
      tip: '“噬嗑”意为上下颌咬碎硬物、让人心相合；“贲”是适度包装与文饰。'
    },
    {
      verse: '剥复无妄大畜颐，大过坎离三十备',
      ruby: [
        { w: '剥', p: 'bō（剥落）' }, { w: '无妄', p: 'wú wàng（不妄为）' },
        { w: '颐', p: 'yí（保养）' }
      ],
      chain: [
        [23, '过度修饰，本质反被剥蚀'], [24, '剥到极点，一阳从下复归'], [25, '回归正轨，切忌妄动'],
        [26, '脚踏实地，蓄积大能量'], [27, '能量既足，懂得自养与养人'], [28, '非常格局，须非常担当'],
        [29, '担当难免涉险，重重考验'], [30, '险境之中，寻找光明依附']
      ],
      tip: '到此刚好凑足《上经》30 卦：从天地（乾坤）走到日月水火（坎离），交代自然宇宙大势。'
    },
    {
      verse: '咸恒遁兮及大壮，晋与明夷家人睽',
      ruby: [
        { w: '遁', p: 'dùn（退避）' }, { w: '明夷', p: 'míng yí（光明受伤）' },
        { w: '睽', p: 'kuí（乖离背离）' }
      ],
      chain: [
        [31, '下经开篇：少男少女互相感应'], [32, '感动不能只是一阵，贵在恒久'], [33, '该退即退，不恋栈位置'],
        [34, '退而蓄力，适度壮大'], [35, '壮大之后，如日升前进'], [36, '一味冒进反受挫伤，韬光养晦'],
        [37, '外面受伤，回到家庭安顿'], [38, '家道不修，内部也会分歧乖离']
      ],
      tip: '《下经》从“咸（感应）”“恒（长久）”讲起，重心从天地转到人间情感、家庭与处世。'
    },
    {
      verse: '蹇解损益夬姤萃，升困井革鼎震继',
      ruby: [
        { w: '蹇', p: 'jiǎn（艰难阻滞）' }, { w: '夬', p: 'guài（决断，勿读 jué）' },
        { w: '姤', p: 'gòu（不期而遇）' }, { w: '萃', p: 'cuì（聚集）' }
      ],
      chain: [
        [39, '彼此乖离，行路寸步难行'], [40, '难不能久拖，找关键点解除'], [41, '解难须先减损私欲'],
        [42, '损己反能真受益'], [43, '收益满溢时，果断清障'], [44, '清走隐患后，重新相遇整合'],
        [45, '志同再聚，人心凝聚'], [46, '众人同心，顺势上升'], [47, '不断上升终遇瓶颈而困'],
        [48, '困在上面，回到基层水井找资源'], [49, '井久积泥，唯有除旧革新'], [50, '革旧之后，立鼎开启新气象'],
        [51, '托付给有行动力的震（长男）']
      ],
      tip: '这 13 卦像一部事业起伏录：先克服难关（蹇解），懂舍得（损益），困顿后回基层淘井革新立鼎！'
    },
    {
      verse: '艮渐归妹丰旅巽，兑涣节兮中孚至',
      ruby: [
        { w: '艮', p: 'gèn（止）' }, { w: '渐', p: 'jiàn（循序渐进）' },
        { w: '巽', p: 'xùn（顺入）' }, { w: '中孚', p: 'zhōng fú（内心诚信）' }
      ],
      chain: [
        [52, '震动不能不停，该止则止'], [53, '止后重出发，循序渐进'], [54, '依礼进退，成就归宿'],
        [55, '踏实积累，迎来盛大丰收'], [56, '盛大易生骄，转入旅途自省'], [57, '在外行旅，须谦逊融入'],
        [58, '真心沟通，彼此喜悦'], [59, '太散漫欢喜易离散，须凝聚'], [60, '防止离散，立下适度节制'],
        [61, '有节度才生出互信']
      ],
      tip: '动（震）与止（艮）永远成对；真正的好关系不是无底线妥协，而是有“节”制才有“中孚”互信。'
    },
    {
      verse: '小过既济兼未济，是为下经三十四',
      ruby: [
        { w: '既济', p: 'jì jì（已经渡过）' }, { w: '未济', p: 'wèi jì（尚未完成）' }
      ],
      chain: [
        [62, '诚信过于执着，反而小有过越'], [63, '过越之后调整，事情终于达成'], [64, '《周易》故意收在“尚未完成”，生生不息']
      ],
      tip: '为什么全书最后不是“大功告成（既济）”，而是“未济”？因为完成只是新周期的起点，变化永不封顶。'
    }
  ];

  function T(key, label) {
    return typeof Glossary !== 'undefined' ? Glossary.term(key, label) : (label || key);
  }

  function safeStep(ctx, box, id, stepIdx, okHtml, badPrefix) {
    // 随堂自检统一绑在 box 容器内，支持闯关模式和全览模式并存，且允许安全试错
    var opts = box.querySelectorAll('.mcheck .mopt');
    var fb = box.querySelector('.mcheck .mfb');
    if (!opts.length || !fb) return;
    opts.forEach(function (b) {
      b.onclick = function () {
        var right = b.getAttribute('data-ok') === '1';
        opts.forEach(function (x) { x.classList.remove('pick-y', 'pick-n'); });
        if (right) {
          b.classList.add('pick-y');
          fb.className = 'mfb ok';
          fb.innerHTML = '✓ ' + okHtml;
          ctx.markStepDone(id, stepIdx);
        } else {
          b.classList.add('pick-n');
          fb.className = 'mfb bad';
          fb.innerHTML = (badPrefix || '还差一点：') + (b.getAttribute('data-why') || '再结合上面动手区想一想，随时可以重选。');
        }
      };
    });
  }

  function buildSceneSVG(t) {
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

  // ==================== 7 课教案 ====================
  var DATA_LESSONS = {
    c0: [
      {
        title: '先破误区：生活中的《易经》与三个常见误会',
        render: function () {
          var myths = [
            { q: '误区一：《易经》主要是古人拿来算命测吉凶的书？', a: '其实是“以自然变化观照做人抉择”的哲学书', b: '算命书', right: 0, why: '占卜只是它四种功用之一。《易经》核心是“观天之道以立人之道”：先看清万物变化的规律，再让人决定自己该怎么修养、如何进退。' },
            { q: '误区二：书店里几百页的大部头《易经》，全都是上古原文？', a: '最早的“经”其实只有二十来页，其余多为后人导读', b: '几百页全是上古经文', right: 0, why: '原始《周易》只含 64 个卦图、64 句卦辞、384 句爻辞，印出来也就二十来页。今天看到的厚书，是加上了孔子及后学写的十篇《易传》和历代注解。' },
            { q: '误区三：占到“吉”就能躺赢，占到“凶”就一定倒霉？', a: '天道无吉凶：吉是提醒保持正道，凶是提醒避坑改弦', b: '卦象写吉凶就彻底注定了', right: 0, why: '六十四卦没有一卦绝对不好。顺境傲慢会把好牌打烂；看到逆境若及时修德止步，照样可以逢凶化吉。' }
          ];
          return '<p>其实我们日常早就用着《易经》的语言：过年常说的“三阳开泰”、校训里的“自强不息、厚德载物”、逆境鼓劲用的“否极泰来”，甚至武侠小说里的“潜龙勿用、飞龙在天”，统统出自这里。</p>' +
            '<p>零基础起步前，先点选下面三张卡片，把最容易卡住新手的偏见拿掉：</p>' +
            '<div class="myth-grid">' + myths.map(function (m, i) {
              return '<div class="myth-card" data-mi="' + i + '"><b>' + m.q + '</b>' +
                '<div class="chips"><button type="button" class="chip mopt-myth" data-ok="' + (m.right === 0 ? 1 : 0) + '">' + m.a + '</button>' +
                '<button type="button" class="chip mopt-myth" data-ok="' + (m.right === 1 ? 1 : 0) + '">' + m.b + '</button></div>' +
                '<div class="small myth-ans" hidden>' + m.why + '</div></div>';
            }).join('') + '</div>' +
            '<div class="tip-box"><b>师友点拨</b><span>学《易经》有一句老话很实在：<b>不学一定不会，学了不一定会，学会终身受用</b>。越能看清处境和边界，人越不会慌。</span></div>';
        },
        mount: function (box) {
          box.querySelectorAll('.myth-card').forEach(function (card) {
            var ans = card.querySelector('.myth-ans');
            card.querySelectorAll('.mopt-myth').forEach(function (b) {
              b.onclick = function () {
                card.querySelectorAll('.mopt-myth').forEach(function (x) { x.classList.remove('g', 'b'); });
                b.classList.add(b.getAttribute('data-ok') === '1' ? 'g' : 'b');
                ans.hidden = false;
              };
            });
          });
        }
      },
      {
        title: '一本书的三层楼：经、传、易学',
        render: function () {
          return '<p>很多人翻开《周易》一头雾水，是因为分不清哪句话是上古“原文”，哪句话是后来的“导读”。点击下面三层切换看清骨架：</p>' +
            '<div class="chips layer-tabs"><button type="button" class="chip on" data-ly="0">第一层 · 原经（二十来页）</button><button type="button" class="chip" data-ly="1">第二层 · 易传（十翼）</button><button type="button" class="chip" data-ly="2">第三层 · 易学双线</button></div>' +
            '<div class="surface-sub layer-panel"></div>' +
            '<div class="row" style="margin-top:4px"><span class="small">古人说《易经》有四种用法（圣人之道四焉）：</span>' +
            '<span class="chip">以言者尚其辞（练说话分寸）</span><span class="chip">以动者尚其变（看局势推进）</span><span class="chip">以制器者尚其象（看图造器物）</span><span class="chip">以卜筮者尚其占（决疑明方向）</span></div>';
        },
        mount: function (box) {
          var panels = [
            '<b>《周易》原经：全书最核心的“二十页”</b><p>相传夏代有《连山》、商代有《归藏》，都已失传；今天留存的是周代的' + T('周易', '《周易》') + '（含伏羲画卦、周文王及周公/史官系辞）。全经只有三样东西：① 64 张六画卦图；② 64 句' + T('卦辞') + '；③ 384 句' + T('爻辞') + '（加乾用九、坤用六）。</p>',
            '<b>' + T('易传') + '（又叫“' + T('十翼') + '”）：十只托起原经的翅膀</b><p>单看原经像天书，所以孔子及其后学写了七种共十篇解读：《彖传》（上下）、《象传》（上下）、《' + T('系辞传', '系辞传') + '》（上下）、《文言传》、《说卦传》、《序卦传》、《杂卦传》。汉代以来经与传合编在一起，这才变得厚实好读。</p>',
            '<b>两千年易学分出两大流派</b><p>① <b>义理派</b>（重修养与处事，讲“居安思危，乐天知命”）：玄理看王弼、儒理看程颐、史事看杨万里。<br>② <b>象数派</b>（重符号演算与生活决疑）：含传统占卜、纳甲干支派（京房/焦延寿）与河洛图书派（邵雍）。本网站前六课先打通符号与义理基础，进阶工坊再带你体验象数算法。</p>'
          ];
          var panel = box.querySelector('.layer-panel');
          var btns = box.querySelectorAll('.layer-tabs [data-ly]');
          function show(idx) {
            btns.forEach(function (b, i) { b.classList.toggle('on', i === idx); });
            panel.innerHTML = panels[idx];
          }
          btns.forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-ly')); }; });
          show(0);
        }
      },
      {
        title: '破译密码：记号 vs 符号，与“易、卦、爻”三字',
        render: function () {
          return '<p>为什么同一个卦辞，换一件事看意思就变了？先点击切换<b>记号</b>与<b>符号</b>，打破“一个词死板对应一个意思”的应试习惯：</p>' +
            '<div class="split">' +
            '<div class="surface-sub"><div class="chips"><button type="button" class="chip on sig-btn" data-sg="0">记号（Sign）</button><button type="button" class="chip sig-btn" data-sg="1">符号（Symbol）</button></div><div class="sig-body" style="margin-top:8px"></div></div>' +
            '<div class="surface-sub block"><b>一分钟认清三个核心字</b>' +
            '<div><b>① ' + T('三易', '易（三名）') + '：</b>含“' + T('易简') + '（乾主动创始叫易、坤顺承完成叫简）”“变易（万物皆变）”“不易（规律本身不变）”。记住“先变再化”：变是主动改变，化是消化吸收。</div>' +
            '<div><b>② 卦（挂）：</b>像把眼前自然变化挂成一张简笔画，定出格局（大势）。</div>' +
            '<div><b>③ 爻（效）：</b>效仿事物一动一静的交互：' + T('阳爻') + '代表主动力，' + T('阴爻') + '代表受动力。</div></div></div>' +
            '<div class="tip-box"><b>师友点拨 · 别曲解“善为易者不占”</b><span>荀子说“善为易者不占”，原文前头连着“善为诗者不说、善为礼者不相”，提醒人看重内在精神、别变成只顾算命的机器；《礼记》称赞易教是“絜静精微而不贼”——心思清静深入，绝不疑神疑鬼。</span></div>' +
            '<div class="mcheck"><b>随堂小检：以下哪句话更符合《易经》对符号和“阴阳”的理解？</b>' +
            '<div class="opts"><button type="button" class="opt mopt" data-ok="0" data-why="阳爻阴爻指主动与承受两种动力，职场里的女主管同样代表阳爻的主动力，不要拿性别套死。">阳爻固定只代表男人，阴爻只代表女人</button>' +
            '<button type="button" class="opt mopt" data-ok="1">阳爻表主动力、阴爻表受动力，同一符号随处境延伸多义</button></div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          var bodies = [
            '<b>记号：一一对应，死板不变</b><p>就像路口的红绿灯——红停绿行，连聪明的小狗都能学会。一个记号只绑死一件事，最怕我们平时读书养成“一字一义”的死记习惯。</p>',
            '<b>符号：一画多义，靠联想打通</b><p>好比一面国旗或一个“坎”卦：同一张图在不同的人、不同的事情上，能映出“水、耳朵、陷阱、月亮、困境”。学《易经》正是训练让僵硬的脑筋变得灵活起来。</p>'
          ];
          var bd = box.querySelector('.sig-body'), btns = box.querySelectorAll('.sig-btn');
          function set(i) { btns.forEach(function (b, j) { b.classList.toggle('on', i === j); }); bd.innerHTML = bodies[i]; }
          btns.forEach(function (b) { b.onclick = function () { set(+b.getAttribute('data-sg')); }; });
          set(0);
          safeStep(ctx, box, 'c0', 2, '答对了！放下“一字一义”，把阴阳看成主动与承受的两种张力，整本书一下子就活起来。');
        }
      },
      {
        title: '零基础怎么学才不劝退？本站三步学习路线',
        render: function () {
          return '<p>学《易经》不用一头扎进几千年的晦涩考据。我们把整套学习拆成三条最顺的台阶，你现在就在第一级上：</p>' +
            '<div class="chain">' +
            '<div class="cnode"><b>1 · 过符号关</b><span class="small">第 1~3 课</span><span>用逻辑推出八卦、先天数、念画顺序和 64 卦串烧，不再硬背。</span></div>' +
            '<div class="cnode"><b>2 · 懂读经语法</b><span class="small">第 4~6 课</span><span>分清经与传、吉凶词分寸与四把尺子，能自己看懂陌生一卦。</span></div>' +
            '<div class="cnode"><b>3 · 实操与工具</b><span class="small">起卦 · 解卦 · 练习</span><span>在分级练习巩固肌肉记忆，再用“三不占”心态试着用卦映照现实困惑。</span></div>' +
            '<div class="cnode"><b>4 · 进阶工坊</b><span class="small">选修 · 随时可玩</span><span>梅花易数、纳甲六爻、多智能体规则推演，学扎实后再玩更有底气。</span></div></div>' +
            '<div class="tip-box"><b>关于本网站的学习习惯建议</b><span>遇到带虚线的专业词（比如' + T('彖传') + '、' + T('无咎') + '）随时点开看大白话解释；右上角随时切换<b>闯关模式</b>（一屏一步慢慢嚼）或<b>全览模式</b>（整课摊开速览）。</span></div>';
        },
        mount: function (box, ctx) { ctx.markStepDone('c0', 3); }
      }
    ],

    c1: [
      {
        title: '天地人三才与铁律：画卦一律“由下往上”',
        render: function () {
          return '<p>万事万物最初如何表达？古人结绳记事时，拿一根树藤按手肘一截一截往上比：中间不打结表示推进（' + T('阳爻') + ' <b>—</b>），打个结断开表示承接（' + T('阴爻') + ' <b>--</b>）。每叠满三画就成了基础的' + T('经卦', '三画单卦') + '。</p>' +
            '<div class="split"><div class="surface-sub block"><b>点击下面三层，体验“' + T('三才') + '”顺序</b>' +
            '<div class="sancai-demo">' +
            '<button type="button" class="sc-bar" data-sc="2"><span>第 3 画 · 上</span><b>天</b><em>（外在天候大势）</em></button>' +
            '<button type="button" class="sc-bar" data-sc="1"><span>第 2 画 · 中</span><b>人</b><em>（居中协调的人事）</em></button>' +
            '<button type="button" class="sc-bar on" data-sc="0"><span>第 1 画 · 初</span><b>地</b><em>（脚下根基，永远先画！）</em></button>' +
            '</div><div class="small sc-note">人站立在天地之间，大树从土里往上长——所以无论是画卦、读卦还是数爻位，铁律都是<b>由下往上</b>。</div></div>' +
            '<div class="surface-sub block"><b>一分为二：从两仪到六十四卦</b>' +
            '<input class="js-tn" type="range" min="1" max="6" value="3" aria-label="分裂层数">' +
            '<div class="js-tree"></div><div class="small js-treehint">把鼠标移到色块上，从下往上读这一列</div></div></div>' +
            '<div class="tip-box"><b>师友点拨 · 二进制的小故事</b><span>18 世纪德国哲学家莱布尼茨看到《易经》图，惊叹阳阴两符号叠 3 层得 8（2³）、叠 6 层得 64（2⁶）与二进制完全一致——不过古代先民只是为了归纳宇宙变化格局，可别夸张成“古人早就发明了计算机”哦。</span></div>';
        },
        mount: function (box, ctx) {
          var notes = [
            '第 1 画（初爻）象征“地”：做任何事都先立脚下根基，画卦第一笔从最下面开始。',
            '第 2 画（中爻）象征“人”：上承天下接地，人在天地之间扮演关键的协调角色。',
            '第 3 画（上爻）象征“天”：盖在最上方代表大环境。三才齐备，才成完整经卦。'
          ];
          box.querySelectorAll('.sc-bar').forEach(function (b) {
            b.onclick = function () {
              var idx = +b.getAttribute('data-sc');
              box.querySelectorAll('.sc-bar').forEach(function (x) { x.classList.toggle('on', x === b); });
              box.querySelector('.sc-note').textContent = notes[idx];
            };
          });
          var tn = box.querySelector('.js-tn'), treeEl = box.querySelector('.js-tree'), hintEl = box.querySelector('.js-treehint');
          function drawTree(n) {
            var names = ['', '两仪', '四象', '八卦', '十六', '三十二', '六十四卦'], rows = '';
            for (var k = 1; k <= n; k++) {
              var cells = '', cols = Math.pow(2, n);
              for (var i = 0; i < cols; i++) {
                var yang = Math.floor(i / Math.pow(2, n - k)) % 2 === 0;
                cells += '<span class="' + (yang ? '' : 'y') + '" data-c="' + i + '"></span>';
              }
              rows += '<div class="tr" style="animation-delay:' + (k - 1) * 50 + 'ms">' + cells + '</div>';
            }
            treeEl.innerHTML = '<div class="row small" style="justify-content:space-between"><span>底层先分阳阴，逐层往上叠加</span><b style="font:900 19px var(--serif);color:var(--ink)">' + Math.pow(2, n) + ' · ' + names[n] + '</b></div><div class="tree">' + rows + '</div>';
            treeEl.querySelector('.tree').onmousemove = function (e) {
              var c = e.target.getAttribute && e.target.getAttribute('data-c'); if (c == null) return;
              c = +c; var bits = '';
              for (var k = 1; k <= n; k++) bits += Math.floor(c / Math.pow(2, n - k)) % 2 === 0 ? '1' : '0';
              var hint = n === 6 ? ctx.hexName(bits) : n === 3 ? Yi.BT[bits] + ' · ' + Yi.IMG[Yi.BT[bits]] : '第 ' + (c + 1) + ' 列';
              hintEl.textContent = hint + (n >= 3 ? '（从下往上读这一列）' : '');
              treeEl.querySelectorAll('.hl').forEach(function (x) { x.classList.remove('hl'); });
              treeEl.querySelectorAll('.tr').forEach(function (r) { r.children[c].classList.add('hl'); });
            };
          }
          tn.oninput = function () { drawTree(+tn.value); };
          drawTree(+tn.value);
        }
      },
      {
        title: '“乾坤生六子”：用“以少为主”推全八个卦',
        render: function (ctx) {
          return '<p>不用死记硬背！古代一家八口是“父母 + 三男三女”。只要记住两条规则：<b>① 物以稀为贵（谁少就听谁的）</b>；<b>② 由下往上数（排在初为长、中为中、上为少）</b>。</p>' +
            '<div class="six-child-lab">' +
            '<div class="surface-sub row" style="justify-content:space-around">' +
            '<div class="row">' + ctx.tri('111', { size: 'mid' }) + '<div><b>乾 · 父</b><div class="small">三阳纯粹</div></div></div>' +
            '<div class="row">' + ctx.tri('000', { size: 'mid' }) + '<div><b>坤 · 母</b><div class="small">三阴纯粹</div></div></div></div>' +
            '<div class="split">' +
            '<div class="surface-sub block"><b>以阴为底，放入 1 根阳爻 → 生出三男</b>' +
            '<div class="chips"><button type="button" class="chip on son-btn" data-bits="100">初位阳（震）</button><button type="button" class="chip son-btn" data-bits="010">中位阳（坎）</button><button type="button" class="chip son-btn" data-bits="001">上位阳（艮）</button></div>' +
            '<div class="row son-out"></div></div>' +
            '<div class="surface-sub block"><b>以阳为底，放入 1 根阴爻 → 生出三女</b>' +
            '<div class="chips"><button type="button" class="chip on dau-btn" data-bits="011">初位阴（巽）</button><button type="button" class="chip dau-btn" data-bits="101">中位阴（离）</button><button type="button" class="chip dau-btn" data-bits="110">上位阴（兑）</button></div>' +
            '<div class="row dau-out"></div></div></div></div>' +
            '<div class="tip-box"><b>师友点拨 · 为什么不直接叫“天、地、水、火”？</b><span>如果直接叫“天地水火”，就容易锁死成死板的物质名词；用“乾坤坎离”当符号名字，才方便在后面代表父母、器官、动物和性格。</span></div>' +
            '<div class="mcheck"><b>随堂小检：看这个三画卦 ' + ctx.tri('001', { size: 'mini' }) + '（最上一画是阳爻，下面两画是阴爻），按“以少为主”它是谁？</b>' +
            '<div class="opts"><button type="button" class="opt mopt" data-ok="0" data-why="三根里只有 1 根阳爻，所以属于阳卦（男）；再从下往上数到第 3 位才出现阳，所以不是长男。">长女 · 巽</button>' +
            '<button type="button" class="opt mopt" data-ok="1">少男 · 艮（山）</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="少女（兑）应该是一根阴爻少见且落在最上面（110）。">少女 · 兑</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="长男（震）是唯一的阳爻在最底一位（100）。">长男 · 震</button></div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          var desc = {
            '100': ['震', '长男 · 雷', '唯一阳爻在最底（初位），刚从地底发动。'],
            '010': ['坎', '中男 · 水', '唯一阳爻被夹在中间（二位），正是中男。'],
            '001': ['艮', '少男 · 山', '唯一阳爻跑到最顶（三位），即老小少男。'],
            '011': ['巽', '长女 · 风', '唯一阴爻落在最底（初位），即大姐长女。'],
            '101': ['离', '中女 · 火', '唯一阴爻居于正中（二位），即是二姐中女。'],
            '110': ['兑', '少女 · 泽', '唯一阴爻开口在最上（三位），活泼少女。']
          };
          function bindGroup(sel, outSel, rareChar) {
            var out = box.querySelector(outSel), btns = box.querySelectorAll(sel);
            function show(b) {
              btns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-bits') === b); });
              var d = desc[b];
              out.innerHTML = ctx.tri(b, { size: 'mid', hot: [b.indexOf(rareChar)] }) +
                '<div><b>' + d[0] + ' · ' + d[1] + '</b><div class="small">' + d[2] + '</div></div>';
            }
            btns.forEach(function (btn) { btn.onclick = function () { show(btn.getAttribute('data-bits')); }; });
            show(btns[0].getAttribute('data-bits'));
          }
          bindGroup('.son-btn', '.son-out', '1');
          bindGroup('.dau-btn', '.dau-out', '0');
          safeStep(ctx, box, 'c1', 1, '答对了！三根里一根阳爻在最上（3位），由下往上排正是“少男 · 艮”。');
        }
      },
      {
        title: '八卦实验室：点击三根线，记住自然与生活联想',
        render: function () {
          return '<p>点左边任意一根线切换阴阳，右边会同步画出自然现象，并告诉你《' + T('说卦传') + '》为什么这样联想（只列最常用的 5 个领域）：</p>' +
            '<div class="surface-sub split"><div class="block"><div class="row" style="justify-content:center;gap:24px"><div id="trilab"></div><div><div class="big" id="triname"></div><div class="small" id="trikou"></div></div></div><div class="small" id="triwhy"></div></div>' +
            '<div class="block"><div id="triscene"></div><div class="chips" id="trichips"></div></div></div>';
        },
        mount: function (box, ctx) {
          var lab = '111';
          function drawLab() {
            box.querySelector('#trilab').innerHTML = ctx.tri(lab, { size: 'lg', btn: true });
            var t = Yi.BT[lab], i = TRI_INFO[t], ko = KOUJUE.filter(function (k) { return k[0] === t; })[0][1];
            box.querySelector('#triname').textContent = t + ' · ' + Yi.IMG[t];
            box.querySelector('#trikou').textContent = ko;
            box.querySelector('#triwhy').textContent = i.why;
            box.querySelector('#triscene').innerHTML = buildSceneSVG(t);
            box.querySelector('#trichips').innerHTML = [['性', i.xing], ['身', i.body], ['家', i.fam], ['物', i.ani], ['五行', Yi.GONG_WX[t]]].map(function (x) {
              return '<span class="chip">' + x[0] + ' <b>' + x[1] + '</b></span>';
            }).join('');
            box.querySelectorAll('#trilab .ln').forEach(function (b) {
              b.onclick = function () {
                var a = lab.split(''), n = +b.getAttribute('data-i');
                a[n] = a[n] === '1' ? '0' : '1';
                lab = a.join('');
                drawLab();
              };
            });
          }
          drawLab();
        }
      },
      {
        title: '口诀翻牌与过关检验',
        render: function (ctx) {
          return '<p>古人编了 8 句三字口诀帮你一眼认出画法。先在脑子里默画，再点开每张牌核对：</p>' +
            '<div class="cases">' + KOUJUE.map(function (k) {
              return '<button type="button" class="case" data-k="' + k[0] + '"><b style="font:900 18px var(--serif)">' + k[1] + '</b><div class="reveal-tri" hidden>' + ctx.tri(Yi.TB[k[0]], { size: 'mid' }) + '<span class="small">' + k[0] + ' · ' + Yi.IMG[k[0]] + '</span></div></button>';
            }).join('') + '</div>' +
            '<div class="mcheck" style="margin-top:8px"><b>随堂小检：以下哪一组“口诀—自然物—身体部位”完全对应？</b>' +
            '<div class="opts"><button type="button" class="opt mopt" data-ok="0" data-why="离中虚是外实中虚（101），自然为火、身体为目；耳是坎中满。">离中虚 — 水 — 耳</button>' +
            '<button type="button" class="opt mopt" data-ok="1">艮覆碗 — 山 — 手</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="震仰盂（100）自然是雷、身体是足；口和泽属于兑上缺。">震仰盂 — 泽 — 口</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="坎中满（010）是水也是耳，腹是坤六断。">坎中满 — 山 — 腹</button></div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          box.querySelectorAll('[data-k]').forEach(function (b) {
            b.onclick = function () {
              var r = b.querySelector('.reveal-tri'); r.hidden = !r.hidden;
              if (!r.hidden) { r.style.display = 'flex'; r.style.gap = '10px'; r.style.alignItems = 'center'; }
            };
          });
          safeStep(ctx, box, 'c1', 3, '完全正确！“艮覆碗”倒扣如山峰，阻拦即手，“震足艮手”正好合为“兄弟如手足”。');
        }
      }
    ],

    c2: [
      {
        title: '为什么同一套八卦有两张图？先记住“上南下北”',
        render: function (ctx) {
          return '<p>在很多书或老门楼上见过八卦圆图？其实分清两张图就够了：<b>' + T('先天八卦') + '</b>（相传伏羲绘）讲宇宙对称与数字编码；<b>' + T('后天八卦') + '</b>（相传周文王绘）讲春夏秋冬时间流转与五行生克。</p>' +
            '<div class="split"><div class="surface-sub block"><b>阅读古图的“第一条规矩”</b>' +
            '<div class="chips"><button type="button" class="chip on dir-btn" data-d="0">现代地图视角（上北下南）</button><button type="button" class="chip dir-btn" data-d="1">易经古图视角（上南下北）</button></div>' +
            '<div class="dir-box" style="margin-top:6px"></div></div>' +
            '<div class="surface-sub block"><b>看圆环八卦的“黄金法则”：别画反震和艮！</b>' +
            '<p>民间门楼上的先天图最常把左下角（震）与右下角（艮）画反！因为看图时必须记住：<b>永远从圆心朝外看，才等于由下往上读</b>——离近圆心的那一画才是初爻，朝外那一画是上爻。</p>' +
            '<div class="row">' + ctx.tri('100', { size: 'mid', hot: [0] }) + '<span class="small">震：初阳贴近圆心</span>' + ctx.tri('001', { size: 'mid', hot: [2] }) + '<span class="small">艮：上阳朝向圆外</span></div></div></div>';
        },
        mount: function (box) {
          var txt = [
            '现代印刷地图习惯“上北、下南、左西、右东”，这和古代八卦图的方位正好倒了 180 度——若拿现代地图往八卦图上硬套，东西南北全会认反。',
            '古代天子“坐北朝南”听政：面对正南方（火/日），身后是北方（水/月），左手是东方太阳升起（青龙/木），右手是西方（白虎/金）。因此所有先天与后天八卦图，一律是<b>上南下北、左东右西</b>。'
          ];
          var bd = box.querySelector('.dir-box'), btns = box.querySelectorAll('.dir-btn');
          function set(i) { btns.forEach(function (b, j) { b.classList.toggle('on', i === j); }); bd.innerHTML = '<p>' + txt[i] + '</p>'; }
          btns.forEach(function (b) { b.onclick = function () { set(+b.getAttribute('data-d')); }; });
          set(1);
        }
      },
      {
        title: '先天八卦数字探秘：对角相加都是 9，阴阳各和 18',
        render: function () {
          return '<p>点击圆环上任意一卦，观察它的<b>对角搭档</b>与先天数字关系。这套 1~8 编号就是后面“数字起卦法”的编码表：</p>' +
            '<div class="surface-sub split xiantian-box"><div class="xt-svg"></div><div class="block">' +
            '<div class="big xt-name"></div><div class="chips xt-eq"></div><p class="xt-quote small"></p>' +
            '<div style="border-top:1px solid var(--line);padding-top:10px">' +
            '<button type="button" class="btn ghost xt-sum-btn">验证阴阳分组对称（和皆 18）</button>' +
            '<div class="small xt-sum-out" style="margin-top:8px" hidden></div></div></div></div>';
        },
        mount: function (box) {
          var sel = '乾';
          var pairs = { 乾: ['坤', '天地定位'], 坤: ['乾', '天地定位'], 兑: ['艮', '山泽通气'], 艮: ['兑', '山泽通气'], 离: ['坎', '水火不相射'], 坎: ['离', '水火不相射'], 震: ['巽', '雷风相薄'], 巽: ['震', '雷风相薄'] };
          var dir = { 南: 0, 东南: 1, 东: 2, 东北: 3, 北: 4, 西北: 5, 西: 6, 西南: 7 };
          function pos(t) { var a = dir[TRI_INFO[t].xian] * Math.PI / 4; return [180 + 130 * Math.sin(a), 180 - 130 * Math.cos(a)]; }
          function draw() {
            var partner = pairs[sel][0], p1 = pos(sel), p2 = pos(partner);
            var nodes = Yi.TRI.map(function (t, n) {
              var p = pos(t), bits = Yi.TB[t], r = '';
              for (var i = 0; i < 3; i++) {
                var y = 18 - i * 11;
                r += bits[i] === '1' ? '<rect x="-22" y="' + y + '" width="44" height="7" rx="1"/>' : '<rect x="-22" y="' + y + '" width="18" height="7" rx="1"/><rect x="4" y="' + y + '" width="18" height="7" rx="1"/>';
              }
              return '<g class="ring-node ' + (sel === t ? 'sel' : '') + '" data-t="' + t + '" style="transform:translate(' + p[0] + 'px,' + p[1] + 'px)">' + r + '<text y="-10">' + t + '</text><text class="n" x="33" y="12">' + (n + 1) + '</text></g>';
            }).join('');
            box.querySelector('.xt-svg').innerHTML = '<svg viewBox="0 0 360 360" style="width:100%;max-width:340px;display:block;margin:auto" role="img" aria-label="先天八卦对角关系图">' +
              '<circle cx="180" cy="180" r="96" fill="none" stroke="var(--line)" stroke-dasharray="3 6"/>' +
              '<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + p2[0] + '" y2="' + p2[1] + '" stroke="var(--move)" stroke-width="2.5" stroke-dasharray="5 4"/>' +
              '<text x="180" y="186" text-anchor="middle" style="font:900 20px var(--serif);fill:var(--muted)">先天</text>' + nodes + '</svg>';
            var n1 = Yi.TRI.indexOf(sel) + 1, n2 = Yi.TRI.indexOf(partner) + 1;
            box.querySelector('.xt-name').textContent = sel + '（' + n1 + '） ⇄ ' + partner + '（' + n2 + '）';
            box.querySelector('.xt-eq').innerHTML = '<span class="chip m">' + n1 + ' + ' + n2 + ' = 9</span><span class="chip on">' + pairs[sel][1] + '</span><span class="chip">' + TRI_INFO[sel].xian + ' ↔ ' + TRI_INFO[partner].xian + '</span>';
            box.querySelector('.xt-quote').textContent = '记忆顺序：从南“乾1”顺左走“兑2、离3、震4”，再跳回“巽5、坎6、艮7、坤8”。';
            box.querySelectorAll('.xt-svg .ring-node').forEach(function (g) { g.onclick = function () { sel = g.getAttribute('data-t'); draw(); }; });
          }
          draw();
          var sumBtn = box.querySelector('.xt-sum-btn'), sumOut = box.querySelector('.xt-sum-out');
          sumBtn.onclick = function () {
            sumOut.hidden = !sumOut.hidden;
            sumOut.innerHTML = '阳卦（父与三男）：乾<b>1</b> + 震<b>4</b> + 坎<b>6</b> + 艮<b>7</b> = <b>18</b><br>阴卦（母与三女）：坤<b>8</b> + 巽<b>5</b> + 离<b>3</b> + 兑<b>2</b> = <b>18</b>（正反对称，丝毫不差）。';
          };
        }
      },
      {
        title: '后天八卦四季轮转、五行四象与洛书 15',
        render: function () {
          return '<p>后天八卦图把八卦安放在<b>四季与真实方位</b>上，让易经能和中医、时令、五行对话。下方是《说卦传》“帝出乎震”八站轮转与' + T('洛书') + '九宫：</p>' +
            '<div class="split"><div class="surface-sub block houtian-box"><div class="row" style="justify-content:space-between"><b>后天四季轮转（点一站看看）</b><button type="button" class="chip on ht-next">下一站 →</button></div>' +
            '<div class="chips ht-btns">' + HOUTIAN_SEQ.map(function (h, i) { return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-hi="' + i + '">' + h.tri + ' · ' + h.dir + '</button>'; }).join('') + '</div>' +
            '<div class="ht-detail"></div>' +
            '<div class="small">口诀对照：左东青龙（木·春·震巽）、前南朱雀（火·夏·离）、右西白虎（金·秋·兑乾）、后北玄武（水·冬·坎）、中土（坤艮）。</div></div>' +
            '<div class="surface-sub block"><b>' + T('洛书') + '九宫：点选任意一条线，相加全等于 15</b>' +
            '<div class="chips luoshu-lines"></div><div class="luoshu"></div><div class="chip on luoshu-eq" style="align-self:flex-start">点击横竖斜或数字体验</div></div></div>';
        },
        mount: function (box) {
          var hi = 0;
          function drawHT() {
            var h = HOUTIAN_SEQ[hi];
            box.querySelectorAll('.ht-btns [data-hi]').forEach(function (b, i) { b.classList.toggle('on', i === hi); });
            box.querySelector('.ht-detail').innerHTML = '<div class="row"><span class="chip m">' + h.season + '</span><span class="chip">五行 ' + h.wx + '</span><span class="chip">四象 ' + h.animal + '</span></div><p style="margin-top:6px">' + h.note + '</p>';
          }
          box.querySelectorAll('.ht-btns [data-hi]').forEach(function (b) { b.onclick = function () { hi = +b.getAttribute('data-hi'); drawHT(); }; });
          box.querySelector('.ht-next').onclick = function () { hi = (hi + 1) % 8; drawHT(); };
          drawHT();

          // 洛书：戴九履一、左三右七、二四为肩、六八为足、五居中央
          var grid = [
            { n: 4, t: '巽' }, { n: 9, t: '离' }, { n: 2, t: '坤' },
            { n: 3, t: '震' }, { n: 5, t: '中' }, { n: 7, t: '兑' },
            { n: 8, t: '艮' }, { n: 1, t: '坎' }, { n: 6, t: '乾' }
          ];
          var lines = [
            ['上横', [0, 1, 2]], ['中横', [3, 4, 5]], ['下横', [6, 7, 8]],
            ['左竖', [0, 3, 6]], ['中竖', [1, 4, 7]], ['右竖', [2, 5, 8]],
            ['主斜', [0, 4, 8]], ['副斜', [2, 4, 6]]
          ];
          var curLine = 0;
          box.querySelector('.luoshu-lines').innerHTML = lines.map(function (l, i) {
            return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-ll="' + i + '">' + l[0] + '</button>';
          }).join('');
          function drawLuoshu() {
            var idxs = lines[curLine][1];
            box.querySelectorAll('.luoshu-lines [data-ll]').forEach(function (b, i) { b.classList.toggle('on', i === curLine); });
            box.querySelector('.luoshu').innerHTML = grid.map(function (c, i) {
              var hit = idxs.indexOf(i) >= 0;
              return '<div class="ls-cell' + (hit ? ' hl' : '') + '"><b>' + c.n + '</b><span class="small">' + c.t + '</span></div>';
            }).join('');
            var nums = idxs.map(function (i) { return grid[i].n; });
            box.querySelector('.luoshu-eq').textContent = lines[curLine][0] + '：' + nums.join(' + ') + ' = 15';
          }
          box.querySelectorAll('.luoshu-lines [data-ll]').forEach(function (b) { b.onclick = function () { curLine = +b.getAttribute('data-ll'); drawLuoshu(); }; });
          drawLuoshu();
        }
      },
      {
        title: '随堂过关检验',
        render: function () {
          return '<div class="mcheck"><b>第 1 题：在' + T('先天八卦') + '数字编码中，如果记住“离（火）”是 3，那和它对角相加等于 9 的 6 号卦是哪一卦？</b>' +
            '<div class="opts"><button type="button" class="opt mopt" data-ok="0" data-why="先天数 1~4 为乾兑离震，5~8 为巽坎艮坤；7 号才是艮。">艮（山）</button>' +
            '<button type="button" class="opt mopt" data-ok="1">坎（水）</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="坤是 8 号，和 1 号乾配对成“天地定位”。">坤（地）</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="巽是 5 号，和 4 号震配对成“雷风相薄”。">巽（风）</button></div><div class="mfb"></div></div>' +
            '<div class="mcheck" style="margin-top:12px"><b>第 2 题：后天八卦把“坎”放在北方、配冬天和黑色玄武。这反映的是哪张图的用法？</b>' +
            '<div class="opts"><button type="button" class="opt mopt2" data-ok="1">后天八卦（管时空方位与五行生克）</button>' +
            '<button type="button" class="opt mopt2" data-ok="0">先天八卦（管对称结构与数字卦编号）</button></div><div class="mfb2 mfb"></div></div>';
        },
        mount: function (box, ctx) {
          safeStep(ctx, box, 'c2', 3, '完全正确！水火不相射，离 3 + 坎 6 = 9。记住这一套数，后面起数字卦直接就能查表成卦。');
          var o2 = box.querySelectorAll('.mopt2'), fb2 = box.querySelector('.mfb2');
          o2.forEach(function (b) {
            b.onclick = function () {
              o2.forEach(function (x) { x.classList.remove('pick-y', 'pick-n'); });
              if (b.getAttribute('data-ok') === '1') {
                b.classList.add('pick-y'); fb2.className = 'mfb2 mfb ok';
                fb2.textContent = '✓ 对了！先天看对称编码（宇宙本体），后天看季节方位与五行运转。';
                ctx.markStepDone('c2', 3);
              } else {
                b.classList.add('pick-n'); fb2.className = 'mfb2 mfb bad';
                fb2.textContent = '还差一点：先天八卦中坎在正西、坤在正北；按春夏秋冬顺转“震东离南兑西坎北”的是后天八卦。';
              }
            };
          });
        }
      }
    ],

    c3: [
      {
        title: '叠卦机：下卦为“自己/内部”，上卦为“环境/外部”',
        render: function () {
          return '<p>两张八卦上下一叠，就构成一种六画处境（' + T('重卦') + '，共 64 种）。点下面三组经典一键对比，体会上下交互的意义：</p>' +
            '<div class="chips tg-presets"><button type="button" class="chip" data-l="乾" data-u="坤">地天泰（交融通畅）</button><button type="button" class="chip" data-l="坤" data-u="乾">天地否（闭塞不交）</button><button type="button" class="chip" data-l="震" data-u="坎">水雷屯（动乎险中）</button></div>' +
            '<div class="surface-sub split tiegua-box"><div class="block"><div class="small">上卦 · ' + T('外卦', '外在环境') + '</div><div class="chips js-pu"></div><div class="small">下卦 · ' + T('内卦', '自己与起点') + '</div><div class="chips js-pl"></div></div>' +
            '<div class="row" style="justify-content:center;gap:22px"><div class="js-bg"></div><div><div class="big js-bn"></div><div class="small js-bk"></div><div class="js-bgl" style="max-width:240px"></div><a class="btn ghost js-bl" href="#dict" style="display:inline-block;margin-top:8px;text-decoration:none">去卦典看全文</a></div></div></div>' +
            '<div class="tip-box"><b>师友点拨 · 破除成语倒读误区</b><span>成语常说“否极泰来”，其实《周易》先有第 11 卦<b>泰</b>、再有第 12 卦<b>否</b>（“泰极否来”）；真正先坏后好的是第 23 卦<b>剥</b>极而第 24 卦<b>复</b>来（一阳从下复起）。</span></div>';
        },
        mount: function (box, ctx) {
          var bL = '乾', bU = '坤';
          function pick(sel, val, setter) {
            var el = box.querySelector(sel);
            el.innerHTML = Yi.TRI.map(function (t) { return '<button type="button" class="chip ' + (t === val ? 'on' : '') + '" data-t="' + t + '">' + t + ' ' + Yi.IMG[t] + '</button>'; }).join('');
            el.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { setter(b.getAttribute('data-t')); draw(); }; });
          }
          function draw() {
            var bits = Yi.TB[bL] + Yi.TB[bU], h = Yi.hex(bits);
            pick('.js-pu', bU, function (v) { bU = v; });
            pick('.js-pl', bL, function (v) { bL = v; });
            box.querySelector('.js-bg').innerHTML = ctx.gua(bits, { size: 'lg', cls: 'gap-mid' });
            var ln = box.querySelector('.js-bg .gua'); ln.style.setProperty('--split', '26px'); requestAnimationFrame(function () { ln.style.setProperty('--split', '0px'); });
            box.querySelector('.js-bn').textContent = ctx.hexName(bits);
            box.querySelector('.js-bk').textContent = '第 ' + h.kw + ' 卦 · ' + bL + '下' + bU + '上';
            box.querySelector('.js-bgl').textContent = ctx.GLOSS[h.kw - 1][0];
            box.querySelector('.js-bl').onclick = function () { ctx.setDictSel(h.kw); };
          }
          box.querySelectorAll('.tg-presets [data-l]').forEach(function (b) {
            b.onclick = function () { bL = b.getAttribute('data-l'); bU = b.getAttribute('data-u'); draw(); };
          });
          draw();
        }
      },
      {
        title: '攻克头号易错坑：“念法从上往下，画法从下往上”',
        render: function () {
          return '<p>这是初学者翻车率最高的一关！报卦名时，古人<b>先念上卦、再念下卦</b>（例如<b>地山谦</b>：地在上＝坤，山在下＝艮）。可你亲笔画爻时，必须<b>先画下面的艮，再画上面的坤</b>。</p>' +
            '<div class="surface-sub split draw-coach"><div class="block" style="align-items:center"><div class="chips dc-pick"></div><div class="big dc-title"></div><div class="small dc-sub">点下面六根横线拼出这一卦（记得最底是第 1 画！）</div><div class="dc-gua"></div><div class="row"><button type="button" class="btn dc-check">核对画法</button><button type="button" class="btn ghost dc-reset">重置全阴</button></div><div class="mfb dc-fb"></div></div>' +
            '<div class="block"><b>拆解三步不出错</b><ol class="small" style="padding-left:18px;margin:0;line-height:1.8">' +
            '<li>先拆卦名：前一个自然字是<b>上卦</b>（画在上面三根），后一个字是<b>下卦</b>（画在下面三根）。</li>' +
            '<li>手从底部起：先填第 1、2、3 根（下卦），再填第 4、5、6 根（上卦）。</li>' +
            '<li>若是重卦（如《震为雷》《坎为水》），上下两卦一样，各画一遍即可。</li></ol></div></div>';
        },
        mount: function (box, ctx) {
          var pool = [15, 3, 11, 14, 63, 37]; // 谦、屯、泰、大有、既济、家人
          var curKw = 15, tmp = '000000';
          box.querySelector('.dc-pick').innerHTML = pool.map(function (kw) {
            var h = ctx.HEX[kw - 1];
            return '<button type="button" class="chip' + (kw === curKw ? ' on' : '') + '" data-kw="' + kw + '">' + ctx.hexName(h.bits) + '</button>';
          }).join('');
          function draw() {
            var h = ctx.HEX[curKw - 1];
            box.querySelectorAll('.dc-pick [data-kw]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-kw') === curKw); });
            box.querySelector('.dc-title').textContent = ctx.hexName(h.bits);
            box.querySelector('.dc-gua').innerHTML = ctx.gua(tmp, { size: 'lg', btn: true, cls: 'gap-mid' });
            box.querySelectorAll('.dc-gua .ln').forEach(function (b) {
              b.onclick = function () { tmp = Yi.flip(tmp, [+b.getAttribute('data-i')]); box.querySelector('.dc-fb').textContent = ''; draw(); };
            });
          }
          box.querySelectorAll('.dc-pick [data-kw]').forEach(function (b) {
            b.onclick = function () { curKw = +b.getAttribute('data-kw'); tmp = '000000'; box.querySelector('.dc-fb').textContent = ''; draw(); };
          });
          box.querySelector('.dc-reset').onclick = function () { tmp = '000000'; box.querySelector('.dc-fb').textContent = ''; draw(); };
          box.querySelector('.dc-check').onclick = function () {
            var h = ctx.HEX[curKw - 1], fb = box.querySelector('.dc-fb');
            if (tmp === h.bits) {
              fb.className = 'mfb dc-fb ok';
              fb.textContent = '✓ 画对啦！下卦 ' + h.lower + '（' + Yi.IMG[h.lower] + '）在底，上卦 ' + h.upper + '（' + Yi.IMG[h.upper] + '）在顶。';
            } else {
              fb.className = 'mfb dc-fb bad';
              fb.textContent = '再检查一下上下顺序：' + ctx.hexName(h.bits) + ' 念法虽先念上卦“' + Yi.IMG[h.upper] + '（' + h.upper + '）”，但底部三画要先画“' + Yi.IMG[h.lower] + '（' + h.lower + '）”，顶上三画再画“' + h.upper + '”。';
            }
          };
          draw();
        }
      },
      {
        title: '《卦名次序歌》与《序卦传》因果故事链（附易错字正音）',
        render: function () {
          return '<p>死背 64 个卦名很难，但古人用《' + T('序卦传') + '》串成了一部“物极必反、螺旋上升”的连续剧。先点一句朱熹《卦名次序歌》，顺带把常念错的字音纠准：</p>' +
            '<div class="xugua-box"><div class="chips sg-tabs">' + SONG_GROUPS.map(function (g, i) {
              return '<button type="button" class="chip' + (i === 0 ? ' on' : '') + '" data-sg="' + i + '">' + g.verse + '</button>';
            }).join('') + '</div><div class="surface-sub sg-panel"></div></div>' +
            '<details style="margin-top:8px"><summary>工具箱：展开 64 卦全矩阵与卦序环</summary><div class="block" style="margin-top:10px">' +
            '<div class="chips js-mm">' + [['none', '不标记'], ['up', '上经 30 卦'], ['down', '下经 34 卦'], ['pure', '八纯卦'], ['xi', '十二消息'], ['pal', '同宫八卦']].map(function (x) { return '<button type="button" class="chip" data-m="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
            '<div class="split"><div class="js-matrix"></div><div class="block"><div class="js-seq"></div><div class="big js-seqn"></div><div class="small js-seqd"></div></div></div></div></details>';
        },
        mount: function (box, ctx) {
          var sgIdx = 0;
          function drawSG() {
            var g = SONG_GROUPS[sgIdx];
            box.querySelectorAll('.sg-tabs [data-sg]').forEach(function (b, i) { b.classList.toggle('on', i === sgIdx); });
            var rubyHtml = g.ruby.map(function (r) { return '<span class="chip m">' + r.w + ' · ' + r.p + '</span>'; }).join('');
            var chainHtml = g.chain.map(function (c) {
              var h = ctx.HEX[c[0] - 1];
              return '<a class="sc-node" href="#dict" data-kw="' + h.kw + '">' + ctx.gua(h.bits, { size: 'mini' }) + '<b>' + h.kw + '. ' + h.name + '</b><span class="small">' + c[1] + '</span></a>';
            }).join('');
            box.querySelector('.sg-panel').innerHTML = '<div class="chips"><span class="small">易错字正音：</span>' + rubyHtml + '</div>' +
              '<div class="story-chain">' + chainHtml + '</div><div class="small">' + g.tip + '（点击任意卦卡可去卦典查全文）</div>';
            box.querySelectorAll('.sg-panel [data-kw]').forEach(function (a) { a.onclick = function () { ctx.setDictSel(+a.getAttribute('data-kw')); }; });
          }
          box.querySelectorAll('.sg-tabs [data-sg]').forEach(function (b) { b.onclick = function () { sgIdx = +b.getAttribute('data-sg'); drawSG(); }; });
          drawSG();

          // 折叠工具：64 卦矩阵与卦序一圈
          var matMode = 'none', matSel = ctx.HEX[0].bits;
          function drawMat() {
            var head1 = '<span></span>' + Yi.TRI.map(function (t) { return '<span class="ax">' + t + '</span>'; }).join('');
            var body = Yi.TRI.map(function (lo) {
              return '<span class="ax">' + lo + '</span>' + Yi.TRI.map(function (up) {
                var b = Yi.TB[lo] + Yi.TB[up], h = Yi.hex(b), hl = '';
                if (matMode === 'up' && h.kw <= 30) hl = 'hl';
                if (matMode === 'down' && h.kw > 30) hl = 'hl';
                if (matMode === 'pure' && lo === up) hl = 'hl';
                if (matMode === 'xi' && Yi.XIAOXI.indexOf(b) >= 0) hl = 'hl';
                if (matMode === 'pal' && Yi.palaceMap[b].palace === Yi.palaceMap[matSel].palace) hl = 'hl';
                return '<button type="button" class="cell ' + hl + (b === matSel ? ' sel' : '') + '" data-b="' + b + '" title="' + h.kw + ' ' + ctx.hexName(b) + '">' + ctx.gua(b, { size: 'mini' }) + '</button>';
              }).join('');
            }).join('');
            box.querySelector('.js-matrix').innerHTML = '<div class="matrix">' + head1 + body + '</div>';
            box.querySelectorAll('.js-mm [data-m]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-m') === matMode); });
            var pts = ctx.HEX.map(function (h, i) { var a = i / 64 * 2 * Math.PI - Math.PI / 2; return [180 + 158 * Math.cos(a), 180 + 158 * Math.sin(a)]; }), lines = '';
            for (var i = 0; i < 64; i += 2) {
              var fan = Yi.zong(ctx.HEX[i].bits) === ctx.HEX[i + 1].bits;
              lines += '<line x1="' + pts[i][0] + '" y1="' + pts[i][1] + '" x2="' + pts[i + 1][0] + '" y2="' + pts[i + 1][1] + '" stroke="' + (fan ? 'var(--accent)' : 'var(--move)') + '" stroke-width="' + (ctx.HEX[i].bits === matSel || ctx.HEX[i + 1].bits === matSel ? 5 : 2.5) + '"/>';
            }
            var dots = ctx.HEX.map(function (h, i) { return '<circle class="seqd" data-b="' + h.bits + '" cx="' + pts[i][0] + '" cy="' + pts[i][1] + '" r="' + (h.bits === matSel ? 8 : 4.5) + '" fill="' + (h.bits === matSel ? 'var(--accent)' : (i < 30 ? 'var(--ink)' : 'var(--muted)')) + '" style="cursor:pointer"><title>' + (i + 1) + ' ' + h.name + '</title></circle>'; }).join('');
            box.querySelector('.js-seq').innerHTML = '<svg viewBox="0 0 360 360" style="width:100%;max-width:300px;display:block;margin:auto" role="img" aria-label="六十四卦序环">' + lines + dots + '</svg>';
            var curH = Yi.hex(matSel), k = curH.kw - 1, partner = ctx.HEX[k % 2 ? k - 1 : k + 1], isFan = Yi.zong(curH.bits) === partner.bits;
            box.querySelector('.js-seqn').textContent = curH.name + ' ⇄ ' + partner.name;
            box.querySelector('.js-seqd').textContent = (isFan ? '蓝线翻转成对（综卦）' : '黄线全变成对（错卦）') + '。记住一半，另一半顺带记住。';
            box.querySelectorAll('.js-matrix .cell, .js-seq .seqd').forEach(function (c) { c.onclick = function () { matSel = c.getAttribute('data-b'); drawMat(); }; });
          }
          box.querySelectorAll('.js-mm [data-m]').forEach(function (x) { x.onclick = function () { matMode = x.getAttribute('data-m'); drawMat(); }; });
          drawMat();
        }
      },
      {
        title: '一卦四面（本/综/错/互）与实战透视',
        render: function () {
          return '<p>六十四卦之所以两两成对，规律是<b>“非覆即变”</b>（要么上下倒过来看，要么全部黑白反转）。解卦遇到卡壳时，常借' + T('综卦') + '、' + T('错卦') + '和' + T('互卦') + '从不同角度看穿局势：</p>' +
            '<div class="chips rel-picks">' + [['111000', '地天泰'], ['100010', '水雷屯'], ['001000', '地山谦'], ['110001', '山泽损']].map(function (x) { return '<button type="button" class="chip" data-b="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
            '<div class="relgrid rels-box"></div>' +
            '<div class="surface-sub block" style="margin-top:6px"><div class="row" style="justify-content:space-between"><b>看互卦妙用：《水雷屯》六三为何说“追鹿没向导，走进树林里”？</b><button type="button" class="chip on zhun-hu-btn">透视水雷屯互卦</button></div>' +
            '<div class="zhun-hu-out small" hidden></div></div>' +
            '<div class="mcheck"><b>随堂小检：打算手动画出“地山谦”的六画卦，下面哪一步动作最先做？</b>' +
            '<div class="opts"><button type="button" class="opt mopt" data-ok="1">先画下面三根“艮（山）” ☶，再往上面画“坤（地）” ☷</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="千万别被念法带偏！地山谦先念的是上卦地（坤），画图一定要从底部的山（艮）画起。">先画下面三根“坤（地）”，再画“艮（山）”</button></div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          var sel = '100010';
          function drawRels() {
            var h = Yi.hex(sel);
            box.querySelectorAll('.rel-picks [data-b]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-b') === sel); });
            var rel = [
              ['变卦 · ' + T('错卦'), '六爻全变，看反面警示', Yi.cuo(sel), 'flipc'],
              ['覆卦 · ' + T('综卦'), '上下翻转，换对方视角', Yi.zong(sel), 'spin'],
              [T('互卦'), '234作下、345作上，看暗流', Yi.hu(sel), 'flipc']
            ];
            box.querySelector('.rels-box').innerHTML = '<div class="rel">' + ctx.gua(sel, { size: 'mid' }) + '<b>' + h.name + '</b><span class="small">本卦 · 当前</span></div>' +
              rel.map(function (r) { return '<button type="button" class="rel" data-b="' + r[2] + '" data-a="' + r[3] + '">' + ctx.gua(r[2], { size: 'mid' }) + '<b>' + Yi.hex(r[2]).name + '</b><span class="small">' + r[0] + '<br>' + r[1] + '</span></button>'; }).join('');
            box.querySelectorAll('.rels-box button.rel').forEach(function (x) {
              x.onmouseenter = function () { x.classList.remove(x.getAttribute('data-a')); void x.offsetWidth; x.classList.add(x.getAttribute('data-a')); };
              x.onclick = function () { sel = x.getAttribute('data-b'); drawRels(); };
            });
          }
          box.querySelectorAll('.rel-picks [data-b]').forEach(function (b) { b.onclick = function () { sel = b.getAttribute('data-b'); drawRels(); }; });
          drawRels();
          var huBtn = box.querySelector('.zhun-hu-btn'), huOut = box.querySelector('.zhun-hu-out');
          huBtn.onclick = function () {
            huOut.hidden = !huOut.hidden;
            huOut.innerHTML = '《水雷屯》<code>100010</code>：去掉底爻和顶爻，中间 2~4 爻 <code>000</code> 是<b>坤（田地）</b>，3~5 爻 <code>001</code> 是<b>艮（山林）</b>，底下 1~3 爻是<b>震（行动）</b>。在田野行动打猎（震+坤），结果一头扎进高山林地（艮），又没有向导——经文每个画面其实都从卦象里长出来！';
          };
          safeStep(ctx, box, 'c3', 3, '完全正确！先念上后念下，画图永远先下后上，绝不被名字绕进去。');
        }
      }
    ],

    c4: [
      {
        title: '爻名解码器：初上在先，二三四五在后；为何阳九阴六',
        render: function () {
          return '<p>点下面任意一根爻，看看怎么给它起正规名字，为什么一会儿“初九”，一会儿又变成“六二”：</p>' +
            '<div class="split yao-namer"><div class="surface-sub block" style="align-items:center"><div class="chips yn-picks"></div><div class="yn-gua"></div><div class="small">点击任意一根爻查看拆解（可再点一次切换阴阳）</div></div>' +
            '<div class="surface-sub block"><div class="big yn-res"></div><div class="yn-rule"></div>' +
            '<div style="border-top:1px solid var(--line);padding-top:8px"><b>为什么阳叫“九”、阴叫“六”？</b>' +
            '<p class="small">① 古人把 1~5 生数拆开：奇数 <b>1 + 3 + 5 = 9</b>，代表阳的主动；偶数 <b>2 + 4 = 6</b>，代表阴的稳定。② 在 1~10 中，9 是最强阳数，6 是中正稳数。纯阳乾另附“用九”，纯阴坤另附“用六”。</p></div></div></div>';
        },
        mount: function (box, ctx) {
          var bits = '001000', picked = 2; // 默认地山谦九三
          box.querySelector('.yn-picks').innerHTML = [['111111', '乾'], ['000000', '坤'], ['001000', '谦'], ['101010', '既济']].map(function (x) {
            return '<button type="button" class="chip" data-b="' + x[0] + '">' + x[1] + '</button>';
          }).join('');
          function draw() {
            var y = bits[picked] === '1', nm = ctx.label(picked, y), edge = picked === 0 || picked === 5;
            box.querySelectorAll('.yn-picks [data-b]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-b') === bits); });
            box.querySelector('.yn-gua').innerHTML = ctx.gua(bits, { size: 'lg', btn: true, hot: [picked] });
            box.querySelector('.yn-res').textContent = nm;
            box.querySelector('.yn-rule').innerHTML = '<div class="chips"><span class="chip on">位置：第 ' + (picked + 1) + ' 根（' + ctx.POS[picked] + '）</span><span class="chip m">性质：' + (y ? '阳爻（用九）' : '阴爻（用六）') + '</span></div>' +
              '<p style="margin-top:6px">' + (edge ? '底层（初）和顶层（上）<b>先报位置、再报阴阳</b>，所以叫 <b>' + nm + '</b>。' : '中间二、三、四、五爻<b>先报阴阳、再报位置</b>，所以叫 <b>' + nm + '</b>。') + '</p>';
            box.querySelectorAll('.yn-gua .ln').forEach(function (b) {
              b.onclick = function () {
                var i = +b.getAttribute('data-i');
                if (picked === i) bits = Yi.flip(bits, [i]);
                picked = i; draw();
              };
            });
          }
          box.querySelectorAll('.yn-picks [data-b]').forEach(function (b) { b.onclick = function () { bits = b.getAttribute('data-b'); draw(); }; });
          draw();
        }
      },
      {
        title: '一页《周易》解剖图：点问题看哪段在回答',
        render: function () {
          return '<p>真正的一卦，其实由“原经 + 传注”严密拼在一起。先选一个示例卦，再点右边的初学者疑问，看亮起来的那一块在回答什么：</p>' +
            '<div class="chips ana-picks"></div>' +
            '<div class="split wide-l anatomy-box"><div class="surface-sub block ana-doc"></div><div class="block ana-qs"></div></div>';
        },
        mount: function (box, ctx) {
          var kw = 15, focus = 'judgment';
          var qs = [
            ['judgment', '① 整盘局势的总吉凶基调是什么？', '这是' + T('卦辞') + '（周易原文），每卦只有一句，定总方向。'],
            ['tuan', '② 为什么卦辞这么断？谁是主爻？', '这是' + T('彖传') + '（解释卦辞），常点出天地规律和这一卦的关键主爻。'],
            ['daxiang', '③ 这幅自然画面给我什么修养启发？', '这是' + T('大象传') + '，句式固定：“上象+下象，卦名；君子以（行动/修德）”。全书 64 卦有 53 卦提到“君子”。'],
            ['line', '④ 具体走到某一爻时，处境和后果如何？', '这是' + T('爻辞') + '（周易原文），点明具体这一步的画面与判断。'],
            ['smallxiang', '⑤ 为什么这一爻会得到这个结果？', '这是' + T('小象传') + '，用极短的“……也”补充说明原因（比如是否当位、得中）。']
          ];
          box.querySelector('.ana-picks').innerHTML = [15, 1, 3].map(function (k) {
            return '<button type="button" class="chip" data-kw="' + k + '">第 ' + k + ' 卦 · ' + ctx.HEX[k - 1].name + '</button>';
          }).join('');
          function draw() {
            var h = ctx.HEX[kw - 1], sampleIdx = kw === 15 ? 2 : 0, l = h.lines[sampleIdx], sx = h.smallxiang[sampleIdx] || '';
            box.querySelectorAll('.ana-picks [data-kw]').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-kw') === kw); });
            box.querySelector('.ana-doc').innerHTML =
              '<div class="row">' + ctx.gua(h.bits, { size: 'mid', hot: [sampleIdx] }) + '<div><b>' + ctx.hexName(h.bits) + '</b><div class="small">以 ' + l.label + ' 为例对照</div></div></div>' +
              '<div class="ana-sec' + (focus === 'judgment' ? ' on' : '') + '"><span class="chip">卦辞 · 经</span> <span class="quote">' + h.judgment + '</span></div>' +
              '<div class="ana-sec' + (focus === 'tuan' ? ' on' : '') + '"><span class="chip">彖传 · 传</span> <span>' + h.tuan + '</span></div>' +
              '<div class="ana-sec' + (focus === 'daxiang' ? ' on' : '') + '"><span class="chip">大象 · 传</span> <span>' + h.daxiang + '</span></div>' +
              '<div class="ana-sec' + (focus === 'line' ? ' on' : '') + '"><span class="chip">' + l.label + ' 爻辞 · 经</span> <span class="quote">' + l.text + '</span></div>' +
              '<div class="ana-sec' + (focus === 'smallxiang' ? ' on' : '') + '"><span class="chip">小象 · 传</span> <span>' + sx + '</span></div>';
            box.querySelector('.ana-qs').innerHTML = qs.map(function (q) {
              var on = focus === q[0];
              return '<button type="button" class="ana-q' + (on ? ' on' : '') + '" data-f="' + q[0] + '"><b>' + q[1] + '</b>' + (on ? '<span class="small">' + q[2] + '</span>' : '') + '</button>';
            }).join('');
            box.querySelectorAll('.ana-qs [data-f]').forEach(function (b) { b.onclick = function () { focus = b.getAttribute('data-f'); draw(); }; });
          }
          box.querySelectorAll('.ana-picks [data-kw]').forEach(function (b) { b.onclick = function () { kw = +b.getAttribute('data-kw'); draw(); }; });
          draw();
        }
      },
      {
        title: '活卦初读惊喜：看《水天需》六爻如何一步步展开',
        render: function () {
          return '<p>很多初学者怕读古文，其实是没看见文字和卦画的关系。点下面的进度步进，看<b>第 5 卦《水天需》</b>（上坎水为云/危险/洞穴，下乾天健行）如何一步步贴近水面：</p>' +
            '<div class="surface-sub split xu-walk"><div class="block" style="align-items:center"><div class="xu-gua"></div><div class="chips xu-btns"></div></div>' +
            '<div class="block"><div class="big xu-lbl"></div><div class="quote xu-txt"></div><div class="small xu-sx"></div><div class="tip-box" style="margin-top:4px"><b>为什么这样写？</b><span class="xu-why"></span></div></div></div>';
        },
        mount: function (box, ctx) {
          var h = ctx.HEX[4], step = 0; // 水天需 kw=5
          var whys = [
            '初九离上卦坎水最远，所以“在郊外等待”；守住常道不急躁，没有灾害。',
            '九二靠近水边了，走在“沙滩”上，虽然会有些小闲话（小有言），但居中稳重，结局仍吉。',
            '九三紧贴着坎水，“沙加水”就成了“泥潭”！而且九三与上六阴爻正应，反把山上的强盗（坎也是盗）引来了，好在敬慎防范能立于不败。',
            '六四已经一脚跨进上卦坎（坎水也象征血与洞穴），但阴爻顺从大势，能“从洞穴里脱身而出”。',
            '九五居上卦正中且当位，稳稳掌控全局——边享用饮食边耐心等候，正固吉祥！',
            '上六站在危险洞穴的最深处，却没想到底下乾卦的三位阳刚贤才（不速之客三人）结伴上来呼应帮忙，恭敬相待就能转危为安。'
          ];
          box.querySelector('.xu-btns').innerHTML = h.lines.map(function (l, i) {
            return '<button type="button" class="chip" data-xi="' + i + '">' + l.label + '</button>';
          }).join('');
          function draw() {
            var l = h.lines[step];
            box.querySelectorAll('.xu-btns [data-xi]').forEach(function (b, i) { b.classList.toggle('on', i === step); });
            box.querySelector('.xu-gua').innerHTML = ctx.gua(h.bits, { size: 'lg', hot: [step], btn: true });
            box.querySelector('.xu-lbl').textContent = '水天需 · ' + l.label;
            box.querySelector('.xu-txt').innerHTML = ctx.markVerdict(l.text);
            box.querySelector('.xu-sx').textContent = '小象：' + (h.smallxiang[step] || '') + '　（白话：' + ctx.GLOSS[4][1][step] + '）';
            box.querySelector('.xu-why').textContent = whys[step];
            box.querySelectorAll('.xu-gua .ln').forEach(function (b) { b.onclick = function () { step = +b.getAttribute('data-i'); draw(); }; });
          }
          box.querySelectorAll('.xu-btns [data-xi]').forEach(function (b) { b.onclick = function () { step = +b.getAttribute('data-xi'); draw(); }; });
          draw();
        }
      },
      {
        title: '《十翼》七种速查卡与读陌生卦五步贴士',
        render: function () {
          var wings = [
            ['彖传（上下）', '解释整卦的卦名与卦辞。'],
            ['象传（上下）', '大象传讲“君子修养启发”，小象传解释每一爻辞的理由。'],
            ['系辞传（上下）', '全书哲学总纲：讲宇宙生生不息、符号制作与做人安顿。'],
            ['文言传', '⚠️ 不是“文言文”！专讲乾、坤两纯卦的典范读法。'],
            ['说卦传', '八经卦象征意义的小字典（自然、家庭、身体、动物…）。'],
            ['序卦传', '用“物极必反”因果故事串起 64 卦的前后次序。'],
            ['杂卦传', '仅一页左右，将 64 卦拆成 32 对给出极短对比评语（如“比乐师忧”）。']
          ];
          return '<div class="shiyi-grid">' + wings.map(function (w) { return '<div class="surface-sub"><b>' + w[0] + '</b><div class="small">' + w[1] + '</div></div>'; }).join('') + '</div>' +
            '<div class="tip-box"><b>拿到陌生卦怎么读？五步不迷路</b><span>① 先看卦名和上下自然象（如云上于天） → ② 读《大象传》找做人方向 → ③ 读《卦辞》和《彖传》定总调 → ④ 只精读当前关注的那一条爻辞 → ⑤ 读《小象传》弄懂原因。</span></div>' +
            '<div class="mcheck"><b>随堂小检：某卦由下往上第 4 根是阴爻，它该怎么读？如果想查它“对君子修养的启发”该看哪一部分？</b>' +
            '<div class="opts"><button type="button" class="opt mopt" data-ok="1">读作“六四”，修养启发看《大象传》</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="阴爻用“六”不用“九”；二三四五爻先报阴阳再报位置，所以是六四。">读作“四六”，修养启发看《文言传》</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="《文言传》只专门解释乾、坤两卦，其余 62 卦的修养启发都在《大象传》。">读作“六四”，修养启发看《文言传》</button></div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          safeStep(ctx, box, 'c4', 3, '完全正确！记住二三四五先说九六，“文言传只讲乾坤，修养启发看大象”。');
        }
      }
    ],

    c5: [
      {
        title: '“元亨利贞”四德拆解：别把“贞”一律当占卜',
        render: function () {
          return '<p>打开《易经》扑面而来的四个字就是<b>' + T('元亨利贞') + '</b>。下面实算了全书 64 卦卦辞的出现次数——点击每张卡片看真义，特别留意<b>“贞”</b>的正反两面：</p>' +
            '<div class="side-box"><div class="shiyi-grid si-cards"></div>' +
            '<div class="surface-sub block" style="margin-top:10px"><div class="row"><b>重点辨析：“贞”字的两种读法</b>' +
            '<button type="button" class="chip on zhen-btn" data-z="0">义一：正固、守正（贞吉）</button>' +
            '<button type="button" class="chip zhen-btn" data-z="1">义二：照老办法走下去（贞凶）</button></div>' +
            '<div class="zhen-body"></div></div></div>';
        },
        mount: function (box, ctx) {
          var cnt = { 元: 0, 亨: 0, 利: 0, 贞: 0 };
          ctx.HEX.forEach(function (h) { ['元', '亨', '利', '贞'].forEach(function (k) { if (h.judgment.indexOf(k) >= 0) cnt[k]++; }); });
          var items = [
            ['元 · 创始', cnt.元, '代表生命的起点与最大善意。衍生出“元吉”＝上上大吉。64 卦卦辞中唯独《损》卦直接断“元吉”（损己利人最受欢迎）。'],
            ['亨 · 通达', cnt.亨, '全书一半以上的卦都带“亨”：万物同源、本能互通；遇到“亨”说明路是通的，但还要看人是否谨慎。'],
            ['利 · 适宜', cnt.利, '协调合适。一定不能脱离时空和角色谈“利”（例如坤卦讲“利牝马之贞”——母马般柔顺耐力才最适宜）。'],
            ['贞 · 正固', cnt.贞, '立身干事的骨干。有人把“贞”全解释成“占卜”，可“利牝马之贞”总不能是母马去占卜！它主要是守正、坚定。']
          ];
          box.querySelector('.si-cards').innerHTML = items.map(function (x) {
            return '<div class="surface-sub"><div class="row" style="justify-content:space-between"><b>' + x[0] + '</b><span class="chip">卦辞出现 ' + x[1] + ' 卦</span></div><div class="small" style="margin-top:4px">' + x[2] + '</div></div>';
          }).join('');
          var zBodies = [
            '<p><b>守住正道坚持下去（约占多数）：</b>就像做事有原则、顺境不偷懒，如“安贞吉”“九二利贞”。</p>',
            '<p><b>按照前面的原样固执走下去：</b>这样才能解释经文里常见的<b>“贞凶”</b>和<b>“贞吝”</b>——如果只把“贞”当“守正”，守正怎么会凶呢？它的意思正是：<b>明明环境变了或走偏了，还硬按原路走下去不肯回头，就会凶险！</b></p>'
          ];
          var bd = box.querySelector('.zhen-body'), btns = box.querySelectorAll('.zhen-btn');
          function setZ(i) { btns.forEach(function (b, j) { b.classList.toggle('on', i === j); }); bd.innerHTML = zBodies[i]; }
          btns.forEach(function (b) { b.onclick = function () { setZ(+b.getAttribute('data-z')); }; });
          setZ(0);
        }
      },
      {
        title: '吉凶九级刻度与“无咎”精解',
        render: function () {
          return '<p>爻辞里的判断词就像情绪与风险的温度计。点击任意一个词，看它排在哪一档、又给出什么行动信号（尤其看清' + T('无咎') + '）：</p>' +
            '<div class="surface-sub block scale-box"><div class="chips sc-pills"></div><div class="sc-info"></div></div>';
        },
        mount: function (box) {
          var scale = [
            ['元吉', 'g', '最上大吉', '德行、时机与做法高度契合，极其圆满（如坤六五“黄裳，元吉”）。'],
            ['吉', 'g', '顺利合适', '方向正确、条件配合；但“吉”不是保证躺赢，仍须依从正道。'],
            ['无不利', 'g', '做哪边都宜', '环境障碍少，施展起来得心应手（如谦卦六四、大有上九）。'],
            ['亨 / 利', '', '通达 / 适宜', '“亨”指气脉相通能往下推，“利”指在当前条件下去做某事恰当。'],
            ['无咎', '', '免于灾过', '★ 必考关键词！《系辞》解释为“善补过者也”：不是本来没错，而是及时修补过失、没有招致祸患。'],
            ['悔', 'w', '懊恼想改', '心里懊恼反省，是坏走向好的转机——俗话“悔改”，只有知悔才能消灾（悔亡）。'],
            ['吝', 'w', '遗憾难堪', '固执舍不得放手，路越走越窄、小有羞耻与困难。'],
            ['厉', 'b', '危险警惕', '处境如履薄冰，随时可能出事；但戒慎应对往往能做到“厉，无咎”。'],
            ['凶', 'b', '不良后果', '方向与条件相违，若硬走必有损失；注意“凶”不是判死刑，而是及时叫停的红灯。']
          ];
          var cur = 4;
          box.querySelector('.sc-pills').innerHTML = scale.map(function (s, i) {
            return '<button type="button" class="chip' + (s[1] ? ' ' + s[1] : '') + '" data-si="' + i + '">' + s[0] + '</button>';
          }).join('');
          function draw() {
            var s = scale[cur];
            box.querySelectorAll('.sc-pills [data-si]').forEach(function (b, i) { b.style.outline = i === cur ? '2px solid var(--ink)' : 'none'; });
            box.querySelector('.sc-info').innerHTML = '<div class="row"><div class="big">' + s[0] + '</div><span class="chip ' + s[1] + '">' + s[2] + '</span></div><p style="margin-top:6px">' + s[3] + '</p>';
          }
          box.querySelectorAll('.sc-pills [data-si]').forEach(function (b) { b.onclick = function () { cur = +b.getAttribute('data-si'); draw(); }; });
          draw();
        }
      },
      {
        title: '拆句公式：“前面是画面（象），后面是判断（占）”',
        render: function () {
          return '<p>学会拆开这两截，三百八十四爻你就看懂了一大半！点看下面三句经典爻辞的色块拆分：</p>' +
            '<div class="split-box block">' +
            [
              ['乾 · 初九', '潜龙', '勿用', '龙潜伏在水底蓄力（象）→ 时机未到先别出手（占）'],
              ['屯 · 六三', '即鹿无虞，惟入于林中', '君子几不如舍，往吝', '追鹿没有向导反陷入密林（象）→ 见机不如放手，硬去难堪（占）'],
              ['谦 · 九三', '劳谦君子', '有终，吉', '有功劳却依旧谦虚（象）→ 终有好结果，吉（占）']
            ].map(function (x) {
              return '<div class="surface-sub"><div class="small"><b>' + x[0] + '</b></div><div class="row" style="margin:6px 0"><span class="chip">象（画面）：' + x[1] + '</span><span>→</span><span class="chip on">占（判断）：' + x[2] + '</span></div><div class="small">' + x[3] + '</div></div>';
            }).join('') + '</div>' +
            '<div class="mcheck"><b>随堂小检：爻辞里写“厉，无咎”或“贞凶”，最准确的现代理解是？</b>' +
            '<div class="opts"><button type="button" class="opt mopt" data-ok="1">“厉，无咎”指有危险但靠补过避灾；“贞凶”指死守旧法不知变通就会凶</button>' +
            '<button type="button" class="opt mopt" data-ok="0" data-why="恰恰相反！无咎指善于补救过失而没成大祸，“贞凶”则是沿用错的或过时的路不改变。">“厉，无咎”指毫无风险；“贞凶”指做正事反而必定倒霉</button></div><div class="mfb"></div></div>';
        },
        mount: function (box, ctx) {
          safeStep(ctx, box, 'c5', 2, '答对了！把“无咎”和“贞凶”看清，读爻辞就不再觉得自相矛盾。');
        }
      },
      {
        title: '全书 384 爻吉凶地图：实算检验“二、五最吉”',
        render: function () {
          return '<p>点一个判断词，全书 64 卦 384 爻立即按颜色亮出来，让你直观验证哪两个爻位含吉率最高：</p>' +
            '<div class="chips" id="sc"><button type="button" class="chip on" data-v="all">全部</button>' +
            [['元吉', '最好'], ['吉', '好'], ['无咎', '善补过'], ['悔', '转机'], ['吝', '狭隘'], ['厉', '警惕'], ['凶', '红灯']].map(function (s) {
              return '<button type="button" class="chip" data-v="' + s[0] + '">' + s[0] + ' <span class="small">' + s[1] + '</span></button>';
            }).join('') + '</div>' +
            '<div class="surface-sub block"><div class="jmap" id="jm"></div><div class="quote" id="jtext">把鼠标移到或点选任意小方格，看这一爻原文</div></div>' +
            '<div class="surface-sub split" id="pos-stats"></div>';
        },
        mount: function (box, ctx) {
          var stats = [0, 1, 2, 3, 4, 5].map(function () { return { good: 0, bad: 0, n: 0 }; }), dang = { y: [0, 0], n: [0, 0] };
          ctx.HEX.forEach(function (h) {
            var a = Yi.analyze(h.bits);
            h.lines.slice(0, 6).forEach(function (l, i) {
              var v = ctx.verdict(l.text), s = stats[i]; s.n++;
              if (v >= 2) s.good++; if (v <= -2) s.bad++;
              var k = a[i].dang ? 'y' : 'n'; dang[k][0]++; if (v >= 2) dang[k][1]++;
            });
          });
          var maxp = Math.max.apply(null, stats.map(function (s) { return s.good / s.n; }));
          box.querySelector('#pos-stats').innerHTML = '<div class="posbars">' + stats.map(function (s, i) {
            return { i: i, p: s.good / s.n };
          }).reverse().map(function (x) {
            return '<div class="pb"><span>' + ctx.POS[x.i] + '爻</span><span class="tr"><i style="width:' + (x.p / maxp * 100) + '%;background:' + (x.i === 1 || x.i === 4 ? 'var(--good)' : 'var(--accent)') + '"></i></span><span class="val">' + Math.round(x.p * 100) + '%</span></div>';
          }).join('') + '</div><div class="block"><div class="big">二、五最吉</div><p>下卦中位（二）与上卦中位（五）的“吉”类比例最高，直观印证下一课要学的“中胜于正”。三爻处于交界处常多凶。</p>' +
            '<div class="chips"><span class="chip">当位含吉 ' + Math.round(dang.y[1] / dang.y[0] * 100) + '%</span><span class="chip">不当位含吉 ' + Math.round(dang.n[1] / dang.n[0] * 100) + '%</span></div></div>';

          function drawMap(filter) {
            box.querySelector('#jm').innerHTML = ctx.HEX.map(function (h, hi) {
              return '<div class="jg" title="' + h.name + '">' + h.lines.slice(0, 6).map(function (l, i) {
                var v = ctx.verdict(l.text), on = filter === 'all' ? true : (l.text.indexOf(filter) >= 0);
                return '<span class="jc ' + (on ? (ctx.vClass[v] || '') : '') + '" data-h="' + hi + '" data-i="' + i + '" style="' + (on ? '' : 'opacity:.25') + '"></span>';
              }).join('') + '</div>';
            }).join('');
          }
          drawMap('all');
          var jm = box.querySelector('#jm');
          jm.onmouseover = function (e) {
            var h = e.target.getAttribute && e.target.getAttribute('data-h'); if (h == null) return;
            var i = +e.target.getAttribute('data-i'), x = ctx.HEX[+h];
            box.querySelector('#jtext').innerHTML = '<b>' + x.name + ' ' + x.lines[i].label + '</b>　' + ctx.markVerdict(x.lines[i].text) + '<div class="small">' + ctx.GLOSS[+h][1][i] + '</div>';
          };
          jm.onclick = jm.onmouseover;
          box.querySelectorAll('#sc [data-v]').forEach(function (b) {
            b.onclick = function () {
              box.querySelectorAll('#sc [data-v]').forEach(function (x) { x.classList.toggle('on', x === b); });
              drawMap(b.getAttribute('data-v'));
            };
          });
        }
      }
    ],

    c6: [
      {
        title: '先看活例子热身：为什么谦九三最好，屯六二却骑马打转？',
        render: function () {
          return '<p>学会“<b>时</b>（整卦大势）”和“<b>位</b>（六爻位置）”后，只看线条排列就能猜出七八分吉凶。先看两张真实活例，再看六层位阶直觉：</p>' +
            '<div class="split warmup-box"><div class="surface-sub block"><div class="chips wu-tabs"><button type="button" class="chip on" data-w="0">地山谦 · 九三（大吉）</button><button type="button" class="chip" data-w="1">水雷屯 · 六二（艰难）</button></div><div class="wu-body"></div></div>' +
            '<div class="surface-sub block"><b>六爻常见位阶直觉图（由下往上）</b>' +
            '<div class="small" style="line-height:1.85">' +
            '<b>上爻：</b>走到尽头准备谢幕，全书约四分之三警示亢进<br>' +
            '<b>五爻：</b>上卦中位（尊位），有主事权，最易得吉<br>' +
            '<b>四爻：</b>刚入上卦、近在君旁，动辄“多惧”需谨慎<br>' +
            '<b>三爻：</b>下卦之顶、上下交界处，“多凶”须戒慎<br>' +
            '<b>二爻：</b>下卦中位，前有挡风后有依靠，约九成平稳<br>' +
            '<b>初爻：</b>起步打底阶段，往往“潜藏勿用”先蓄力' +
            '</div></div></div>';
        },
        mount: function (box, ctx) {
          var cases = [
            { bits: '001000', hot: [2], title: '地山谦 · 九三：“劳谦君子，有终，吉。”', text: '全卦五阴一阳，只有九三一根阳爻——按“物以稀为贵”它是全卦<b>主爻</b>；阳爻在三（阳位）又<b>当位</b>；上面还有上六和它<b>正应</b>，众阴都佩服跟随它，所以稳稳走到圆满。' },
            { bits: '100010', hot: [1], title: '水雷屯 · 六二：“屯如邅如，乘马班如。”', text: '六二既在二爻（得中）又为阴爻在偶位（当位），条件明明很好，为什么原地打转？只因它底下踩着初九刚阳——阴压在阳上叫<b>' + T('乘刚') + '</b>！好比手下或起点太强硬，只能耐心磨合，等到“十年乃字”。' }
          ];
          var body = box.querySelector('.wu-body'), btns = box.querySelectorAll('.wu-tabs [data-w]');
          function show(i) {
            btns.forEach(function (b, j) { b.classList.toggle('on', i === j); });
            var c = cases[i];
            body.innerHTML = '<div class="row" style="margin-top:6px">' + ctx.gua(c.bits, { size: 'mid', hot: c.hot }) + '<div><b>' + c.title + '</b><p class="small" style="margin-top:4px">' + c.text + '</p></div></div>';
          }
          btns.forEach(function (b) { b.onclick = function () { show(+b.getAttribute('data-w')); }; });
          show(0);
        }
      },
      {
        title: '四把尺子互动棋盘：当位、得中、正应、乘承与主爻',
        render: function () {
          var layers = [['dang', '当位'], ['zhong', '得中'], ['ying', '正应'], ['cheng', '乘与承'], ['zhu', '主爻']];
          return '<div class="surface-sub split wide-l"><div class="block"><div class="chips" id="ly">' + layers.map(function (l) {
            return '<button type="button" class="chip" data-l="' + l[0] + '">' + l[1] + '</button>';
          }).join('') + '</div><div class="board" id="board"></div></div><div class="block"><div class="big" id="bdn"></div><p id="ln"></p><div id="pick" class="block"></div>' +
            '<div class="tip-box"><b>核心口诀</b><span>① <b>中胜于正</b>：二五得中比单纯当位更重要。② <b>先看主爻</b>：五阴一阳取阳、五阳一阴取阴（少数做主角）。</span></div></div></div>' +
            '<div class="surface-sub" id="yaoread"></div>';
        },
        mount: function (box, ctx) {
          var boardBits = '100010', boardLayer = 'dang', picked = 1;
          var notes = {
            dang: T('当位') + '：阳爻在初、三、五，阴爻在二、四、上，就像坐对位置（绿条标出）。',
            zhong: T('得中') + '：二、五分别是上下卦的中间位。先贤常说“中胜于正”——即便不当位，居中也往往能化解风险。',
            ying: T('正应') + '：初与四、二与五、三与上，必须一阴一阳才能遥相呼应（绿实线），同性则相斥无应（虚线）。',
            cheng: T('乘刚', '乘与承') + '：阴爻压在阳爻上叫“乘刚”（吃力不讨好，红线）；阴爻在阳爻底下托着叫“承”（顺从配合，绿线）。',
            zhu: T('主爻') + '：六爻中唯一不同的那一爻最容易做主角（物以稀为贵），其余多由《彖传》定出。'
          };
          function layerClass(a, i) {
            if (boardLayer === 'dang') return a[i].dang ? 'ok' : 'no';
            if (boardLayer === 'zhong') return a[i].zhong ? 'mid' : '';
            if (boardLayer === 'cheng') return a[i].chengGang ? 'no' : a[i].chengShang ? 'ok' : '';
            if (boardLayer === 'zhu' && ctx.fuZhu(boardBits) === i) return 'zhu';
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
              h += '<div class="bpos" style="grid-row:' + (6 - i) + ';grid-column:1">' + ctx.POS[i] + ' · ' + (i % 2 === 0 ? '阳位' : '阴位') + '</div>' +
                '<div class="bline ' + c + '" style="grid-row:' + (6 - i) + ';grid-column:2"><button type="button" class="ln ' + (boardBits[i] === '1' ? 'yang' : 'yin') + (picked === i ? ' hot' : '') + '" data-i="' + i + '" aria-label="切换爻"><i></i><u></u><i></i></button></div>';
            }
            h += '<svg class="barcs" viewBox="0 0 120 288" aria-hidden="true">' + arcs(a) + '</svg>';
            box.querySelector('#board').innerHTML = h;
            box.querySelector('#bdn').textContent = ctx.hexName(boardBits);
            box.querySelector('#ln').innerHTML = notes[boardLayer];
            box.querySelectorAll('[data-l]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-l') === boardLayer); });
            box.querySelector('#pick').innerHTML = '<div class="small">试试这些经典卦</div><div class="chips">' + [['屯', '100010'], ['谦', '001000'], ['夬', '111110'], ['既济', '101010'], ['未济', '010101']].map(function (x) {
              return '<button type="button" class="chip" data-b="' + x[1] + '">' + x[0] + '</button>';
            }).join('') + '</div>';
            box.querySelectorAll('#pick [data-b]').forEach(function (b) { b.onclick = function () { boardBits = b.getAttribute('data-b'); draw(); }; });
            box.querySelectorAll('#board .ln').forEach(function (b) {
              b.onclick = function () { var i = +b.getAttribute('data-i'); if (picked === i) boardBits = Yi.flip(boardBits, [i]); picked = i; draw(); };
            });
            var A = a[picked], ch = [
              [A.dang, '当位', A.dang ? '在该在的位置' : '位置不合'],
              [A.zhong, '居中', A.zhong ? '中胜于正' : '不在中位'],
              [A.ying, '正应', A.ying ? ctx.label(A.partner, boardBits[A.partner] === '1') + '可呼应' : '与' + ctx.POS[A.partner] + '爻同性无应'],
              [!A.chengGang, A.chengGang ? '乘刚' : '无乘刚', A.chengGang ? '压在阳爻上' : '没有逆压']
            ];
            var zh = ctx.fuZhu(boardBits) === picked;
            box.querySelector('#yaoread').innerHTML = '<div class="row"><div class="big">' + ctx.label(picked, boardBits[picked] === '1') + '</div><div class="chips">' + ch.map(function (c) {
              return '<span class="chip ' + (c[0] ? 'g' : 'b') + '">' + c[1] + ' · ' + c[2] + '</span>';
            }).join('') + (zh ? '<span class="chip m">主爻</span>' : '') + '</div></div><div class="small" style="margin-top:6px">再点一次当前这根高亮的爻，可翻转阴阳观察变化。</div>';
          }
          box.querySelectorAll('[data-l]').forEach(function (b) { b.onclick = function () { boardLayer = b.getAttribute('data-l'); draw(); }; });
          draw();
        }
      },
      {
        title: '多题型当场练手：选出当位爻 / 正应爻 / 主爻',
        render: function () {
          return '<div class="chips dq-modes"><button type="button" class="chip on" data-dm="dang">练当位（点出所有当位爻）</button><button type="button" class="chip" data-dm="ying">练正应（点出所有正应爻）</button><button type="button" class="chip" data-dm="zhu">练主爻（点出唯一主爻）</button></div>' +
            '<div class="surface-sub q" id="dq"></div>';
        },
        mount: function (box, ctx) {
          var mode = 'dang', drillHex, chosen;
          var rarePool = ctx.HEX.filter(function (h) { return Yi.rareLine(h.bits) >= 0; });
          function nq() {
            drillHex = mode === 'zhu' ? rarePool[Math.floor(Math.random() * rarePool.length)] : ctx.HEX[Math.floor(Math.random() * 64)];
            chosen = {}; dq(false);
          }
          function rightSet(b) {
            var a = Yi.analyze(b);
            if (mode === 'dang') return a.filter(function (x) { return x.dang; }).map(function (x) { return x.i; });
            if (mode === 'ying') return a.filter(function (x) { return x.ying; }).map(function (x) { return x.i; });
            var r = Yi.rareLine(b); return r >= 0 ? [r] : [];
          }
          function dq(done) {
            var b = drillHex.bits, right = rightSet(b);
            var o = { size: 'lg', btn: !done, hot: done ? right : Object.keys(chosen).map(Number) };
            var ok = done && Object.keys(chosen).length === right.length && right.every(function (i) { return chosen[i]; });
            var ask = mode === 'dang' ? '点出所有【当位】的爻（阳在初三五、阴在二四上）' : mode === 'ying' ? '点出所有互相【正应】的爻（初四/二五/三上异号）' : '按“物以稀为贵”，点出唯一的【主爻】';
            box.querySelector('#dq').innerHTML = '<div class="big">' + ctx.hexName(b) + '</div><div class="small">' + ask + '</div>' + ctx.gua(b, o) +
              '<div class="row">' + (done ? '<span class="chip ' + (ok ? 'g' : 'b') + '">' + (ok ? '答对了！' : (right.length ? '正确答案已标蓝' : '本卦此项没有满足的爻')) + '</span><button type="button" class="btn" id="dn">下一题</button>' : '<button type="button" class="btn" id="dc">交卷</button>') + '</div>';
            if (done) {
              if (ok) ctx.markStepDone('c6', 2);
              box.querySelector('#dn').onclick = nq;
            } else {
              box.querySelector('#dc').onclick = function () { dq(true); };
              box.querySelectorAll('#dq .ln').forEach(function (x) {
                x.onclick = function () { var i = +x.getAttribute('data-i'); if (chosen[i]) delete chosen[i]; else chosen[i] = 1; dq(false); };
              });
            }
          }
          box.querySelectorAll('.dq-modes [data-dm]').forEach(function (b) {
            b.onclick = function () {
              mode = b.getAttribute('data-dm');
              box.querySelectorAll('.dq-modes [data-dm]').forEach(function (x) { x.classList.toggle('on', x === b); });
              nq();
            };
          });
          nq();
        }
      },
      {
        title: '入门阶段小结与下一步去向',
        render: function () {
          return '<p>走完这 7 门课，你已经拥有了独立翻开《周易》的整套工具箱：认八卦不再靠死背，画六十四卦不会上下颠倒，分得清经文和十翼，也能用当位/得中/正应分析一爻为什么吉或凶。</p>' +
            '<div class="chain">' +
            '<a class="cnode" href="#drill" style="text-decoration:none;color:inherit"><b>分级练习</b><span class="small">用 1~4 阶微题把符号、数理与爻位变成肌肉记忆</span></a>' +
            '<a class="cnode" href="#l5" style="text-decoration:none;color:inherit"><b>实战起卦</b><span class="small">先过“三不占”体检，再体验大衍蓍草或数字卦</span></a>' +
            '<a class="cnode" href="#l6" style="text-decoration:none;color:inherit"><b>变爻解卦</b><span class="small">看懂“动爻变什么、该读哪一句”与真实古今案例</span></a>' +
            '<a class="cnode" href="#dict" style="text-decoration:none;color:inherit"><b>卦典查阅</b><span class="small">随时检索 64 卦原文与笔记，记录自己的读卦体会</span></a></div>';
        },
        mount: function (box, ctx) { ctx.markStepDone('c6', 3); }
      }
    ]
  };

  function render(id, hostEl, ctx) {
    var meta = LIST.filter(function (x) { return x.id === id; })[0];
    if (!meta) return;
    var steps = DATA_LESSONS[id];
    var idx = LIST.indexOf(meta), nextMeta = LIST[idx + 1] || null;
    var mode = ctx.S.learnMode === 'overview' ? 'overview' : 'guided';
    var cur = Math.max(0, Math.min(steps.length - 1, ctx.S.lessonStep[id] || 0));
    var doneMap = ctx.S.stepDone[id] || {};

    // 提供给各步使用的标记辅助（只更新进度点，不销毁当前交互现场）
    ctx.markStepDone = function (lid, k) {
      if (!ctx.S.stepDone[lid]) ctx.S.stepDone[lid] = {};
      if (!ctx.S.stepDone[lid][k]) {
        ctx.S.stepDone[lid][k] = true;
        ctx.save();
        var dot = hostEl.querySelector('.lsteps [data-si="' + k + '"]');
        if (dot) dot.classList.add('done');
      }
    };

    var headHtml = '<section class="block">' +
      '<div class="row" style="justify-content:space-between;align-items:flex-end">' +
      '<div class="block" style="gap:6px"><span class="small">' + meta.stageNm + (ctx.S.levels[id] ? ' · <b style="color:var(--good)">已学完</b>' : '') + '</span>' +
      '<h1>第 ' + meta.tag + ' 课 · ' + meta.nm.replace(/^[^·]+·\s*/, '') + '</h1></div>' +
      '<div class="mode-switch" role="group" aria-label="学习模式">' +
      '<button type="button" class="ms-btn' + (mode === 'guided' ? ' on' : '') + '" data-mode="guided">闯关模式</button>' +
      '<button type="button" class="ms-btn' + (mode === 'overview' ? ' on' : '') + '" data-mode="overview">全览模式</button>' +
      '</div></div><p class="lede">' + meta.lede + '</p></section>';

    if (mode === 'guided') {
      var barHtml = '<div class="lsteps">' + steps.map(function (st, i) {
        return '<button type="button" class="ls-btn' + (i === cur ? ' cur' : '') + (doneMap[i] ? ' done' : '') + '" data-si="' + i + '"><i>' + (doneMap[i] ? '✓' : (i + 1)) + '</i><span>' + st.title + '</span></button>';
      }).join('') + '</div>';

      var st = steps[cur];
      var cardHtml = '<section class="surface step-card block" data-step-k="' + cur + '">' +
        '<div class="row" style="justify-content:space-between"><span class="chip on">第 ' + (cur + 1) + ' / ' + steps.length + ' 步</span><span class="small">' + (doneMap[cur] ? '本步已完成自检' : '安全试错，随时重看') + '</span></div>' +
        '<h2>' + st.title + '</h2>' +
        st.render(ctx) +
        '</section>';

      var nextLabel = cur < steps.length - 1 ? '下一步 →' : (nextMeta ? '完成本课，进入第 ' + nextMeta.tag + ' 课 →' : '完成入门七课，去分级练习 →');
      var navHtml = '<div class="step-nav">' +
        '<button type="button" class="btn ghost" id="lprev"' + (cur === 0 ? ' disabled' : '') + '>← 上一步</button>' +
        '<span class="small">第 ' + (cur + 1) + ' / ' + steps.length + ' 步</span>' +
        '<button type="button" class="btn" id="lnext">' + nextLabel + '</button>' +
        '</div>';

      hostEl.innerHTML = headHtml + barHtml + cardHtml + navHtml;
      var cardEl = hostEl.querySelector('.step-card');
      st.mount(cardEl, ctx);

      hostEl.querySelectorAll('.lsteps [data-si]').forEach(function (b) {
        b.onclick = function () {
          ctx.S.lessonStep[id] = +b.getAttribute('data-si');
          ctx.save(); render(id, hostEl, ctx);
        };
      });
      hostEl.querySelector('#lprev').onclick = function () {
        if (cur > 0) { ctx.S.lessonStep[id] = cur - 1; ctx.save(); render(id, hostEl, ctx); window.scrollTo(0, 0); }
      };
      hostEl.querySelector('#lnext').onclick = function () {
        ctx.markStepDone(id, cur);
        if (cur < steps.length - 1) {
          ctx.S.lessonStep[id] = cur + 1;
          ctx.save(); render(id, hostEl, ctx); window.scrollTo(0, 0);
        } else {
          ctx.S.levels[id] = true;
          ctx.save();
          location.hash = nextMeta ? nextMeta.id : 'drill';
        }
      };
    } else {
      // 全览模式：整课展开
      var allHtml = steps.map(function (st, i) {
        return '<section class="surface step-card block" data-step-k="' + i + '">' +
          '<div class="row" style="justify-content:space-between"><span class="chip">第 ' + (i + 1) + ' 步</span>' + (doneMap[i] ? '<span class="chip g">已完成自检</span>' : '') + '</div>' +
          '<h2>' + st.title + '</h2>' + st.render(ctx) + '</section>';
      }).join('');
      var finText = ctx.S.levels[id] ? (nextMeta ? '已学完 · 进入第 ' + nextMeta.tag + ' 课 →' : '已学完 · 去分级练习 →') : (nextMeta ? '标为学完并进入第 ' + nextMeta.tag + ' 课 →' : '标为学完，去分级练习 →');
      var footHtml = '<div class="step-nav"><button type="button" class="btn ghost" id="ltoggle">' + (ctx.S.levels[id] ? '取消学完标记' : '仅标记为已学完') + '</button>' +
        '<button type="button" class="btn" id="lnext">' + finText + '</button></div>';

      hostEl.innerHTML = headHtml + '<div class="block">' + allHtml + '</div>' + footHtml;
      hostEl.querySelectorAll('.step-card').forEach(function (cardEl, i) {
        steps[i].mount(cardEl, ctx);
      });
      hostEl.querySelector('#ltoggle').onclick = function () {
        ctx.S.levels[id] = !ctx.S.levels[id];
        ctx.save(); ctx.route();
      };
      hostEl.querySelector('#lnext').onclick = function () {
        ctx.S.levels[id] = true;
        steps.forEach(function (_, i) { ctx.markStepDone(id, i); });
        ctx.save();
        location.hash = nextMeta ? nextMeta.id : 'drill';
      };
    }

    hostEl.querySelectorAll('.mode-switch [data-mode]').forEach(function (b) {
      b.onclick = function () {
        ctx.S.learnMode = b.getAttribute('data-mode');
        ctx.save();
        render(id, hostEl, ctx);
      };
    });
    if (typeof Glossary !== 'undefined') Glossary.bind(hostEl);
  }

  return { LIST: LIST, CORE_KW: CORE_KW, TRI_INFO: TRI_INFO, KOUJUE: KOUJUE, render: render };
})();
