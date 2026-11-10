import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// OpenAI 兼容接口；配置全部来自环境变量（开发机 ~/.config/yijing-study/llm.env），密钥不进仓库和日志。
function cfg() {
  const e = process.env;
  return {
    base: (e.LLM_BASE_URL || '').replace(/\/$/, ''), key: e.LLM_API_KEY || '', model: e.LLM_MODEL || '',
    priceIn: Number(e.LLM_PRICE_IN || 0), priceOut: Number(e.LLM_PRICE_OUT || 0), // 元 / 百万 token
    daily: Number(e.LLM_DAILY_BUDGET_YUAN || 0), perRun: Number(e.LLM_RUN_BUDGET_YUAN || 0), // 花费上限，0 或不设为不限
    maxCalls: Number(e.LLM_RUN_MAX_CALLS || 0), // 每次推算调用次数上限，0 或不设为不限
    jsonMode: e.LLM_JSON_MODE !== '0', mock: e.LLM_MOCK === '1',
    log: e.LLM_USAGE_LOG || path.join(os.homedir(), '.local/state/yijing-study/usage.jsonl')
  };
}

function spentToday(c) {
  const day = new Date().toISOString().slice(0, 10);
  try {
    return fs.readFileSync(c.log, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.ts.startsWith(day)).reduce((s, r) => s + r.cost, 0);
  } catch { return 0; }
}

export function llmStatus() {
  const c = cfg();
  return { configured: c.mock || Boolean(c.base && c.key && c.model), model: c.mock ? 'mock' : c.model || null, priceIn: c.priceIn, priceOut: c.priceOut, dailyBudget: c.daily, runBudget: c.perRun, spentToday: Number(spentToday(c).toFixed(4)) };
}

export function newRun() { return { calls: [], cost: 0 }; }

// on(ev) 实时回调：call 发出请求、first 首字、delta 思考/正文片段、usage 本次用量
export async function chat(run, agent, messages, { tools, json, signal, on = () => {} } = {}) {
  const onDelta = (kind, text) => on({ type: 'delta', kind, text });
  const c = cfg();
  if (!c.mock && !(c.base && c.key && c.model)) throw new Error('LLM_NOT_CONFIGURED');
  if (c.maxCalls > 0 && run.calls.length >= c.maxCalls) throw new Error('RUN_CALL_LIMIT');
  if (c.perRun > 0 && run.cost >= c.perRun) throw new Error('RUN_BUDGET');
  if (c.daily > 0 && spentToday(c) + run.cost >= c.daily) throw new Error('DAILY_BUDGET');
  // 不设 max_tokens：推理型模型的思考也计入输出，限死会截断答案
  const body = { model: c.model, messages, temperature: 0.2, stream: true, stream_options: { include_usage: true } };
  if (tools) body.tools = tools.map((t) => ({ type: 'function', function: t }));
  if (json && c.jsonMode && !tools) body.response_format = { type: 'json_object' };
  const t0 = Date.now();
  on({ type: 'call', n: run.calls.length + 1, msgs: messages.length, ctx: Math.round(JSON.stringify(messages).length / 1.5), tools: (tools || []).map((t) => t.name) });
  let data;
  if (c.mock) {
    data = mockReply(agent, messages, tools);
    const m = data.choices[0].message;
    on({ type: 'first', ms: 0 });
    if (m.content) { onDelta('reasoning', '（假模型）'); onDelta('content', m.content); }
  } else {
    const r = await fetch(c.base + '/chat/completions', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key },
      body: JSON.stringify(body), signal
    });
    if (!r.ok) throw new Error('LLM_HTTP_' + r.status + ' ' + (await r.text()).slice(0, 200));
    data = await readStream(r, onDelta, () => on({ type: 'first', ms: Date.now() - t0 }));
  }
  const u = data.usage || {};
  let tin = u.prompt_tokens || 0, tout = u.completion_tokens || 0, est = false;
  // 接口没回 usage 时按字数估，保证限额仍然生效
  if (!data.usage && !c.mock) { tin = Math.round(JSON.stringify(messages).length / 1.5); tout = Math.round(data.chars / 1.5); est = true; }
  const cost = (tin * c.priceIn + tout * c.priceOut) / 1e6;
  const rec = { ts: new Date().toISOString(), agent, model: c.mock ? 'mock' : c.model, in: tin, out: tout, cost: Number(cost.toFixed(6)), ms: Date.now() - t0, ...(est ? { est } : {}) };
  run.calls.push(rec); run.cost += cost;
  on({ type: 'usage', in: tin, out: tout, cost: rec.cost, ms: rec.ms, est });
  try { fs.mkdirSync(path.dirname(c.log), { recursive: true }); fs.appendFileSync(c.log, JSON.stringify(rec) + '\n'); } catch { /* 记录失败不影响回答 */ }
  return data.choices[0].message;
}

// 读 SSE 流，拼回与非流式相同的 message 结构
async function readStream(r, onDelta, onFirst) {
  const reader = r.body.getReader(), dec = new TextDecoder();
  const msg = { role: 'assistant', content: '' }, calls = [];
  let buf = '', usage = null, chars = 0, first = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop();
    for (const line of lines) {
      const s = line.trim();
      if (!s.startsWith('data:')) continue;
      const payload = s.slice(5).trim();
      if (payload === '[DONE]') continue;
      let j; try { j = JSON.parse(payload); } catch { continue; }
      if (j.usage) usage = j.usage;
      const d = j.choices && j.choices[0] && j.choices[0].delta;
      if (!d) continue;
      if (!first && (d.reasoning_content || d.reasoning || d.content || d.tool_calls)) { first = true; onFirst(); }
      const rs = d.reasoning_content || d.reasoning;
      if (rs) { chars += rs.length; onDelta('reasoning', rs); }
      if (d.content) { chars += d.content.length; msg.content += d.content; onDelta('content', d.content); }
      for (const t of d.tool_calls || []) {
        const k = t.index ?? calls.length, x = calls[k] || (calls[k] = { id: '', type: 'function', function: { name: '', arguments: '' } });
        if (t.id) x.id = t.id;
        if (t.function && t.function.name) x.function.name += t.function.name;
        if (t.function && t.function.arguments) { x.function.arguments += t.function.arguments; chars += t.function.arguments.length; }
      }
    }
  }
  if (calls.length) msg.tool_calls = calls.filter(Boolean);
  return { choices: [{ message: msg }], usage, chars };
}

// 从模型回复里取出 JSON（容忍代码块包裹）
export function parseJSON(text) {
  const s = String(text || ''), a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('模型未返回 JSON');
  return JSON.parse(s.slice(a, b + 1));
}

// 假模型：不联网、不花钱，用于在开发机上跑通整条流程
function mockReply(agent, messages, tools) {
  const last = messages[messages.length - 1], text = typeof last.content === 'string' ? last.content : '';
  const usage = { prompt_tokens: Math.round(JSON.stringify(messages).length / 1.6), completion_tokens: 120 };
  const msg = (m) => ({ choices: [{ message: m }], usage });
  if (agent === '问事官') {
    return msg({ role: 'assistant', content: JSON.stringify({ yong: '世', reason: '（假模型）一律取世爻', confidence: 0.5, clarify: null }) });
  }
  if (agent === '野鹤断卦师') {
    const toolMsgs = messages.filter((m) => m.role === 'tool');
    if (!toolMsgs.length && tools) {
      const y = (messages.map((m) => m.content || '').join('').match(/用神：(\S+?)[\s，。]/) || [])[1] || '世';
      return msg({ role: 'assistant', content: null, tool_calls: [{ id: 'mock1', type: 'function', function: { name: 'run_inference', arguments: JSON.stringify({ yong: y }) } }] });
    }
    const r = JSON.parse(toolMsgs[toolMsgs.length - 1].content);
    return msg({ role: 'assistant', content: JSON.stringify({ verdict: r.verdict, summary: '（假模型）照录规则引擎结论', reasons: r.steps.slice(0, 3).map((s) => ({ text: s.text, rule: s.rule })), yingqi: r.yingqi.slice(0, 2).map((y) => ({ zhi: y.zhi, why: y.why })), advice: '（假模型）' }) });
  }
  if (agent === '傅佩荣读辞师') return msg({ role: 'assistant', content: JSON.stringify({ summary: '（假模型）读辞摘要', reading: '（假模型）', advice: '（假模型）' }) });
  return msg({ role: 'assistant', content: '（假模型）讲解员综合说明。' });
}
