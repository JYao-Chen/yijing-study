// 接口测试：先以 LLM_MOCK=1 启动 next start，再运行 BASE=http://127.0.0.1:18599 node --test tests/api.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://127.0.0.1:18599';
const body = { values: [7, 9, 8, 8, 7, 8], time: { y: 2026, m: 11, d: 10, h: 10, min: 0 }, question: '这个月能收回欠款吗' };
const post = (p, b) => fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });

test('首页返回单页', async () => {
  const r = await fetch(BASE + '/');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /六爻推演/);
});

test('health 报告假模型已配置', async () => {
  const j = await (await fetch(BASE + '/api/health')).json();
  assert.equal(j.llm.configured, true);
  assert.equal(j.llm.model, 'mock');
});

test('infer 按问题取妻财并给出结论', async () => {
  const j = await (await post('/api/infer', body)).json();
  assert.equal(j.yong, '妻财');
  assert.ok(['吉', '凶', '平'].includes(j.infer.verdict));
  assert.ok(j.infer.steps.length > 3);
  assert.equal(j.t.day.length, 2);
});

test('infer 拒绝非法输入', async () => {
  const r = await post('/api/infer', { ...body, values: [1, 2, 3] });
  assert.equal(r.status, 400);
});

test('agent 以事件流跑通六个环节，审核通过，记账', async () => {
  const r = await post('/api/agent', { ...body, mode: 'compare' });
  assert.match(r.headers.get('content-type'), /ndjson/);
  const evs = (await r.text()).trim().split('\n').map((l) => JSON.parse(l));
  const names = ['问事官', '规则引擎', '野鹤断卦师', '傅佩荣读辞师', '审核官', '讲解员'];
  assert.deepEqual(evs.filter((e) => e.type === 'start').map((e) => e.agent), names);
  assert.deepEqual(evs.filter((e) => e.type === 'done').map((e) => e.agent), names);
  assert.ok(evs.some((e) => e.type === 'delta' && e.agent === '讲解员' && e.kind === 'content'));
  assert.ok(evs.some((e) => e.type === 'tool' && e.name === 'run_inference'));
  assert.ok(evs.some((e) => e.type === 'tool_result' && /步/.test(e.summary)));
  for (const t of ['call', 'first', 'usage', 'parsed', 'step', 'check']) assert.ok(evs.some((e) => e.type === t), t);
  // 每次 call 之后都有 first 再有 usage
  const seq = evs.filter((e) => ['call', 'first', 'usage'].includes(e.type)).map((e) => e.type[0]).join('');
  assert.match(seq, /^(cfu)+$/);
  // 每个角色的事件都在它的 start 与 done 之间
  for (const n of names) {
    const i = evs.findIndex((e) => e.type === 'start' && e.agent === n), j = evs.findIndex((e) => e.type === 'done' && e.agent === n);
    assert.ok(evs.every((e, k) => e.agent !== n || (k >= i && k <= j)), n);
  }
  const fin = evs[evs.length - 1];
  assert.equal(fin.type, 'final');
  const by = (n) => fin.trace.find((x) => x.agent === n);
  assert.ok(by('审核官').out.every((c) => c.ok), JSON.stringify(by('审核官').out));
  assert.equal(by('野鹤断卦师').out.verdict, fin.verdict);
  assert.equal(by('规则引擎').out.verdict, fin.verdict);
  assert.equal(fin.usage.calls.length, 5);
});

test('yong 只跑问事官，流式返回结论', async () => {
  const r = await post('/api/yong', { question: '这个月能收回欠款吗' });
  assert.match(r.headers.get('content-type'), /ndjson/);
  const evs = (await r.text()).trim().split('\n').map((l) => JSON.parse(l));
  for (const t of ['call', 'first', 'delta', 'usage', 'parsed']) assert.ok(evs.some((e) => e.type === t), t);
  const fin = evs[evs.length - 1];
  assert.equal(fin.type, 'final');
  assert.ok(['父母', '兄弟', '子孙', '妻财', '官鬼', '世', '应'].includes(fin.yong));
  assert.equal(fin.keyword, '妻财');
  assert.equal((await post('/api/yong', { question: '' })).status, 400);
});

test('agent 沿用问题解析的用神，问事官不再调用模型', async () => {
  const r = await post('/api/agent', { ...body, yong: '妻财', yongBy: 'wenshi', yongReason: '问钱看财', yongConfidence: 0.9 });
  const evs = (await r.text()).trim().split('\n').map((l) => JSON.parse(l));
  assert.ok(!evs.some((e) => e.agent === '问事官' && e.type === 'call'));
  const ws = evs.find((e) => e.type === 'done' && e.agent === '问事官');
  assert.equal(ws.out.reason, '问钱看财');
  assert.equal(evs[evs.length - 1].usage.calls.length, 3);
});
