import gloss from '../src/gloss.js';
import { yi, computeCast, chartBrief } from './yi.js';
import { chat, newRun, parseJSON } from './llm.js';
import { YONG, wenshiMessages } from './wenshi.js';

// 多智能体：问事官 → 野鹤断卦师（调用规则工具）→ 傅佩荣读辞师（对比模式）→ 审核官（代码）→ 讲解员。
// 干支、强弱、应期一律由规则引擎计算，模型只做取用判断、情境解读与表述。

function toolDefs() {
  return [
    { name: 'get_chart', description: '取得排盘：本卦变卦、月建日辰、旬空、六爻干支六亲世应动变、伏神。', parameters: { type: 'object', properties: {} } },
    { name: 'run_inference', description: '按野鹤法对指定用神做完整推理，返回逐步依据、结论与应期候选。', parameters: { type: 'object', properties: { yong: { type: 'string', enum: YONG } }, required: ['yong'] } },
    { name: 'assess_line', description: '查询某一爻在月建日辰下的强弱、空破、暗动与动爻是否有力。', parameters: { type: 'object', properties: { line: { type: 'integer', minimum: 1, maximum: 6 } }, required: ['line'] } },
    { name: 'get_rule', description: '查询规则原文与出处。', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } }
  ];
}

function inferBrief(r) {
  return { 用神: r.label, verdict: r.verdict, 生扶: r.plus, 克害: r.minus, 待时: r.wait, steps: r.steps.map((s) => ({ phase: s.phase, text: s.text, rule: s.rule })), yingqi: r.yingqi.map((y) => ({ zhi: y.zhi, why: y.why.join('、') })) };
}

// 工具返回给前端看的一句话摘要
function toolSummary(name, r) {
  if (r.error) return r.error;
  if (name === 'get_chart') return `${r.本卦}${r.变卦 ? ' → ' + r.变卦 : ''} · ${r.月建}月 ${r.日辰}日 · 旬空${r.旬空}`;
  if (name === 'run_inference') return `${r.用神} · ${r.steps.length} 步 · 生扶${r.生扶} 克害${r.克害} → ${r.verdict} · 应期候选 ${r.yingqi.map((y) => y.zhi).join('') || '无'}`;
  if (name === 'assess_line') return r.steps.join('；').slice(0, 80) || '无特别';
  if (name === 'get_rule') return `${r.t}（${r.src}）`;
  return '';
}

function runTool(name, args, ctx) {
  const { YiInfer } = yi();
  if (name === 'get_chart') return chartBrief(ctx.chart);
  if (name === 'run_inference') {
    const y = YONG.includes(args.yong) ? args.yong : ctx.yong;
    return inferBrief(YiInfer.infer(ctx.chart, { yong: y }));
  }
  if (name === 'assess_line') {
    const a = YiInfer.assess(ctx.chart, Math.min(6, Math.max(1, args.line | 0)) - 1);
    return { ...a, steps: a.steps.map((s) => s.text) };
  }
  if (name === 'get_rule') return YiInfer.RULES[args.id] || { error: '无此规则 id', ids: Object.keys(YiInfer.RULES) };
  return { error: '未知工具' };
}

// 模型偶尔吐出不合法的 JSON：把解析错误回给它重写，最多两次
async function parseOrRepair(run, agent, messages, msg, on) {
  for (let k = 0; ; k++) {
    try { return parseJSON(msg.content); } catch (e) {
      if (k >= 2) throw e;
      on({ type: 'note', text: `JSON 解析失败（${e.message}），请模型重写` });
      messages = [...messages, { role: 'assistant', content: msg.content || '' }, { role: 'user', content: `上一条输出无法解析为 JSON：${e.message}。请只重新输出合法的 JSON，内容不变。` }];
      msg = await chat(run, agent, messages, { json: true, on });
    }
  }
}

// 问事官独立取用神，不给它看关键词结果；之后再与关键词对照，分歧写进日志
async function wenshi(run, question, baseline, on, signal) {
  const m0 = wenshiMessages(question), msg = await chat(run, '问事官', m0, { json: true, on, signal });
  const j = await parseOrRepair(run, '问事官', m0, msg, on);
  on({ type: 'parsed', keys: Object.keys(j) });
  if (!YONG.includes(j.yong)) { on({ type: 'note', text: `模型给的用神“${j.yong}”无效，改用关键词结果 ${baseline.yong}` }); j.yong = baseline.yong; }
  j.keyword = baseline.yong;
  on({ type: 'note', text: j.yong === baseline.yong ? `与关键词表一致（${baseline.yong}）` : `与关键词表不同：关键词取${baseline.yong}${baseline.hit ? '（命中“' + baseline.hit + '”）' : ''}，问事官取${j.yong}` });
  if (j.clarify) on({ type: 'note', text: '问事官建议补充：' + j.clarify });
  return j;
}

async function yehe(run, question, ctx, on) {
  const tools = toolDefs();
  const messages = [
    { role: 'system', content: '你是按野鹤老人《增删卜易》断卦的“断卦师”。所有干支、旺衰、空破、生克与应期，必须通过工具取得，禁止自行推算历法或五行。先调用 run_inference，再按需调用 assess_line、get_rule 核对。结论只能依据工具给出的规则步骤，结合所问之事说明含义；如果你认为结论应与规则引擎不同，必须写明理由和对应规则 id。只输出 JSON：{"verdict":"吉|凶|平","summary":"两三句","reasons":[{"text":"依据","rule":"规则id"}],"yingqi":[{"zhi":"地支","why":"理由"}],"advice":"一两句建议"}' },
    { role: 'user', content: `所问之事：${question || '（未写）'}\n用神：${ctx.yong} 。请断卦。` }
  ];
  for (let round = 0; ; round++) {
    on({ type: 'round', n: round + 1 });
    const msg = await chat(run, '野鹤断卦师', messages, { tools, on });
    const calls = msg.tool_calls || [];
    if (!calls.length) {
      const result = await parseOrRepair(run, '野鹤断卦师', messages, msg, on);
      on({ type: 'parsed', keys: Object.keys(result) });
      return { result, toolLog: messages.filter((m) => m.role === 'tool').map((m) => m.name) };
    }
    messages.push({ role: 'assistant', content: msg.content || null, tool_calls: calls });
    for (const c of calls) {
      let args = {};
      try { args = JSON.parse(c.function.arguments || '{}'); } catch { /* 参数不合法时按空参数处理 */ }
      on({ type: 'tool', id: c.id, name: c.function.name, args });
      const res = runTool(c.function.name, args, ctx);
      on({ type: 'tool_result', id: c.id, name: c.function.name, summary: toolSummary(c.function.name, res) });
      messages.push({ role: 'tool', tool_call_id: c.id, name: c.function.name, content: JSON.stringify(res) });
    }
  }
}

function fuTexts(values) {
  const { Yi } = yi(), r = Yi.reading(values);
  return {
    rule: r.rule, ben: Yi.fullName(r.ben), zhi: r.moving.length ? Yi.fullName(r.zhi) : null,
    lower: Yi.hex(r.ben).lower, upper: Yi.hex(r.ben).upper,
    texts: r.targets.map((t) => {
      const h = Yi.hex(t.hex === 'ben' ? r.ben : r.zhi), g = gloss.GLOSS[h.kw - 1];
      if (t.type === 'judgment') return { title: h.name + '卦辞', text: h.judgment, gloss: g[0], main: !!t.main };
      return { title: h.name + h.lines[t.i].label, text: h.lines[t.i].text, gloss: t.i === 6 ? g[2] : g[1][t.i], main: !!t.main };
    })
  };
}

async function fuReader(run, question, values, on) {
  const f = fuTexts(values);
  on({ type: 'note', text: `${f.ben}${f.zhi ? ' → ' + f.zhi : ''} · ${f.rule} · 读 ${f.texts.map((t) => t.title).join('、')}` });
  const m0 = [
    { role: 'system', content: '你按傅佩荣讲《易经》的读法解卦：下卦代表自己与内在，上卦代表外在环境；按朱熹变爻规则只读指定的那一两句；解释不脱离问者情境，取最合理的一种解释，不做绝对预言。只输出 JSON：{"summary":"两三句","reading":"对所读卦爻辞的白话解释","advice":"一两句建议"}' },
    { role: 'user', content: `所问之事：${question || '（未写）'}\n本卦：${f.ben}（下${f.lower}上${f.upper}）${f.zhi ? '，之卦：' + f.zhi : ''}\n读法：${f.rule}\n要读的文字：\n${f.texts.map((t) => (t.main ? '【主】' : '') + t.title + '：' + t.text + '（白话参考：' + t.gloss + '）').join('\n')}` }
  ];
  const j = await parseOrRepair(run, '傅佩荣读辞师', m0, await chat(run, '傅佩荣读辞师', m0, { json: true, on }), on);
  on({ type: 'parsed', keys: Object.keys(j) });
  return { ...j, source: f };
}

// 审核官：用代码逐条核对断卦师的说法
function audit(yh, ctx) {
  const { YiInfer } = yi(), checks = [], eng = ctx.infer;
  const cands = new Set(eng.yingqi.map((y) => y.zhi));
  checks.push(yh.verdict === eng.verdict
    ? { ok: true, text: `结论“${yh.verdict}”与规则引擎一致` }
    : { ok: false, text: `断卦师结论“${yh.verdict}”与规则引擎“${eng.verdict}”不同，以规则引擎为准，断卦师的理由仅作参考` });
  for (const y of yh.yingqi || []) {
    checks.push(cands.has(y.zhi) ? { ok: true, text: `应期 ${y.zhi} 在规则候选内` } : { ok: false, text: `应期 ${y.zhi} 不在规则候选（${[...cands].join('')}）内` });
  }
  for (const r of yh.reasons || []) if (r.rule && !YiInfer.RULES[r.rule]) checks.push({ ok: false, text: `引用了不存在的规则 ${r.rule}` });
  const c = ctx.chart, allowed = new Set([c.t.month[1], c.t.day[1], ...c.kong, ...cands]);
  c.lines.forEach((L) => { allowed.add(L.zhi); if (L.bian) allowed.add(L.bian.zhi); });
  c.hidden.forEach((h) => allowed.add(h.zhi));
  const text = [yh.summary, ...(yh.reasons || []).map((r) => r.text), yh.advice].join(' ');
  const stray = [...new Set([...text.matchAll(/([子丑寅卯辰巳午未申酉戌亥])(?=[水木火土金日月年时])/g)].map((m) => m[1]).filter((z) => !allowed.has(z)))];
  if (stray.length) checks.push({ ok: false, text: `提到了排盘中没有的地支：${stray.join('、')}` });
  return checks;
}

async function narrator(run, question, ctx, yh, checks, fu, on) {
  const msg = await chat(run, '讲解员', [
    { role: 'system', content: '你是讲解员，把断卦结果讲给零基础的学习者听。用平实中文，不超过 300 字，分四段，以“处境：”“依据：”“提醒：”“应期：”开头。“依据”里凡来自规则引擎的，在句末标（规则）；凡是对情境的推想，标（解读）。审核未通过的说法不要采信。若有傅佩荣读辞结果，在“提醒”里说明两种读法是否一致。不断言必然结果；涉及健康、法律、大额钱财时提醒以专业意见为准。' },
    { role: 'user', content: JSON.stringify({ 所问: question, 规则引擎: { 用神: ctx.infer.label, 结论: ctx.infer.verdict, 应期候选: ctx.infer.yingqi.map((y) => y.zhi + '（' + y.why.join('、') + '）') }, 断卦师: yh, 审核: checks, 傅佩荣读辞: fu ? { summary: fu.summary, reading: fu.reading } : null }) }
  ], { on });
  return msg.content;
}

// 只做问题解析：页面上停笔即调用，流式返回问事官的思考与结论
export async function parseQuestion(question, emit = () => {}, signal) {
  const run = newRun(), { YiInfer } = yi();
  const j = await wenshi(run, question, YiInfer.classify(question), emit, signal);
  return { yong: j.yong, reason: j.reason, confidence: j.confidence, clarify: j.clarify || null, keyword: j.keyword, cost: Number(run.cost.toFixed(5)) };
}

// emit 把每个角色的开始、请求、首字、思考、工具、解析、用量、完成实时推给前端
export async function runAgents(p, emit = () => {}) {
  const run = newRun(), trace = [];
  const tag = (agent) => (ev) => emit({ ...ev, agent });
  const stage = async (agent, fn) => {
    emit({ type: 'start', agent });
    const n = run.calls.length, out = await fn(tag(agent));
    const cost = run.calls.slice(n).reduce((s, c) => s + c.cost, 0);
    const rec = { agent, ...out };
    trace.push(rec);
    emit({ type: 'done', ...rec, cost: Number(cost.toFixed(5)) });
    return out.out;
  };
  const base = computeCast(p);
  const ws = await stage('问事官', async (on) => {
    if (p.picked) on({ type: 'note', text: '沿用问题解析时的结果，不再调用模型' });
    return { out: p.yong ? { yong: p.yong, reason: p.picked ? p.picked.reason : '用户指定', confidence: p.picked ? p.picked.confidence : 1, clarify: null } : await wenshi(run, p.question, base.baseline, on) };
  });
  const ctx = computeCast(p, ws.yong);
  await stage('规则引擎', async (on) => {
    for (const st of ctx.infer.steps) on({ type: 'step', phase: st.phase, text: st.text, eff: st.eff, rule: st.rule });
    return { out: { yong: ctx.infer.label, verdict: ctx.infer.verdict, plus: ctx.infer.plus, minus: ctx.infer.minus, yingqi: ctx.infer.yingqi.map((y) => ({ zhi: y.zhi, why: y.why.join('、') })) } };
  });
  const yh = await stage('野鹤断卦师', async (on) => { const r = await yehe(run, p.question, ctx, on); return { out: r.result, tools: r.toolLog }; });
  let fu = null;
  if (p.mode === 'compare') fu = await stage('傅佩荣读辞师', async (on) => ({ out: await fuReader(run, p.question, p.values, on) }));
  const checks = await stage('审核官', async (on) => {
    const cs = audit(yh, ctx);
    cs.forEach((c) => on({ type: 'check', ...c }));
    return { out: cs };
  });
  const final = await stage('讲解员', async (on) => ({ out: await narrator(run, p.question, ctx, yh, checks, fu, on) }));
  return { yong: ws.yong, verdict: ctx.infer.verdict, yingqi: ctx.infer.yingqi, trace, final, usage: { calls: run.calls, cost: Number(run.cost.toFixed(5)) } };
}
