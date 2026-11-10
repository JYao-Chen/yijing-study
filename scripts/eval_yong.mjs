// 取用神评测：关键词表 vs 问事官（带/不带关键词提示）vs 三次投票
// 用法：node scripts/eval_yong.mjs [输出目录]；模型配置取自环境变量（同 lib/llm.js）
import fs from 'node:fs';
import path from 'node:path';
import YiInfer from '../src/infer.js';
import { chat, newRun, parseJSON } from '../lib/llm.js';
import { YONG, wenshiMessages } from '../lib/wenshi.js';

const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const { items } = JSON.parse(fs.readFileSync(path.join(root, 'data/yong_eval.json'), 'utf8'));
const out = process.argv[2] || '.';
// 每题同时发 1 + VOTES 个请求，EVAL_CONCURRENCY 是同时在跑的请求数
const VOTES = 3, CONC = Math.max(1, Math.round(Number(process.env.EVAL_CONCURRENCY || 80) / (1 + VOTES)));
const run = newRun();

async function ask(q, hint) {
  for (let k = 0; ; k++) {
    try {
      const msg = await chat(run, '问事官', wenshiMessages(q, hint), { json: true });
      const j = parseJSON(msg.content);
      return { yong: YONG.includes(j.yong) ? j.yong : '无效', reason: j.reason, confidence: j.confidence, clarify: j.clarify || null };
    } catch (e) {
      if (k >= 2) return { yong: '失败', reason: e.message };
    }
  }
}

function vote(list) {
  const n = {};
  for (const x of list) n[x] = (n[x] || 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0][0];
}

async function one(it) {
  const kw = YiInfer.classify(it.q);
  const [hinted, ...free] = await Promise.all([ask(it.q, kw), ...Array.from({ length: VOTES }, () => ask(it.q))]);
  return { ...it, kw: kw.yong, kwHit: kw.hit || null, hint: hinted.yong, free: free[0].yong, vote: vote(free.map((f) => f.yong)), freeAll: free.map((f) => f.yong), reason: free[0].reason, hintReason: hinted.reason, clarify: free[0].clarify };
}

const rows = new Array(items.length);
let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < items.length) { const i = next++; rows[i] = await one(items[i]); process.stderr.write('.'); }
}));
process.stderr.write('\n');

const ok = (r, m) => r[m] === r.gold || (r.accept || []).includes(r[m]);
const methods = [['kw', '关键词表'], ['hint', '模型+关键词提示'], ['free', '模型独立'], ['vote', '模型独立·三次投票']];
const sets = ['A', 'B', 'C'];
const pct = (a, b) => `${a}/${b} = ${(100 * a / b).toFixed(0)}%`;
const lines = ['| 方法 | A 用神章 | B 书中卦例 | C 现代口语 | 合计 |', '|---|---|---|---|---|'];
for (const [m, name] of methods) {
  const cell = (s) => { const rs = rows.filter((r) => !s || r.set === s); return pct(rs.filter((r) => ok(r, m)).length, rs.length); };
  lines.push(`| ${name} | ${sets.map(cell).join(' | ')} | ${cell()} |`);
}
const stable = rows.filter((r) => new Set(r.freeAll).size === 1).length;
lines.push('', `模型独立三次结果完全一致：${pct(stable, rows.length)}`);
lines.push(`调用 ${run.calls.length} 次，花费 ¥${run.cost.toFixed(4)}，输入 ${run.calls.reduce((s, c) => s + c.in, 0)} / 输出 ${run.calls.reduce((s, c) => s + c.out, 0)} token`);
lines.push('', '## 答错的题', '', '| id | 问题 | 标准 | 关键词 | 带提示 | 独立 | 投票 | 模型理由 |', '|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  if (methods.every(([m]) => ok(r, m))) continue;
  const mark = (m) => (ok(r, m) ? r[m] : `**${r[m]}**`);
  lines.push(`| ${r.id} | ${r.q} | ${r.gold}${r.accept ? '/' + r.accept.join('/') : ''} | ${mark('kw')} | ${mark('hint')} | ${mark('free')} | ${mark('vote')}（${r.freeAll.join('')}） | ${String(r.reason || '').replace(/\|/g, '/')} |`);
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'yong_eval.rows.json'), JSON.stringify(rows, null, 1));
fs.writeFileSync(path.join(out, 'yong_eval.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
