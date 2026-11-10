import { llmStatus } from '../../../lib/llm.js';
import { parseQuestion } from '../../../lib/agents.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 问题解析：只跑问事官，NDJSON 流返回 call / first / delta / usage / note，最后一行 final 或 error
export async function POST(req) {
  if (!llmStatus().configured) return Response.json({ error: '模型未配置' }, { status: 503 });
  let q;
  try { q = String((await req.json()).question || '').trim().slice(0, 300); } catch { return Response.json({ error: '请求格式错误' }, { status: 400 }); }
  if (!q) return Response.json({ error: '问题为空' }, { status: 400 });
  const enc = new TextEncoder(), ac = new AbortController();
  // 用户改了问题、页面中止请求时，同时中止对模型的调用，不再花钱
  req.signal.addEventListener('abort', () => ac.abort());
  const stream = new ReadableStream({
    async start(ctrl) {
      let open = true;
      const emit = (ev) => { if (open) try { ctrl.enqueue(enc.encode(JSON.stringify(ev) + '\n')); } catch { open = false; } };
      try {
        emit({ type: 'final', ...(await parseQuestion(q, emit, ac.signal)) });
      } catch (e) {
        emit({ type: 'error', error: ac.signal.aborted ? '已取消' : '解析失败：' + String(e.message).slice(0, 200) });
      } finally {
        if (open) try { ctrl.close(); } catch { /* 客户端已断开 */ }
      }
    },
    cancel() { ac.abort(); }
  });
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' } });
}
