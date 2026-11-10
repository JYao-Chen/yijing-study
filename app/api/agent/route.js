import { parseCast } from '../../../lib/yi.js';
import { llmStatus } from '../../../lib/llm.js';
import { runAgents } from '../../../lib/agents.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 900;

const ERR = { LLM_NOT_CONFIGURED: '模型未配置', RUN_BUDGET: '本次推算已达费用上限', DAILY_BUDGET: '今日费用已达上限', RUN_CALL_LIMIT: '本次推算调用次数已达上限' };

// 返回 NDJSON 流：每行一个事件 start / delta / tool / engine / done / final / error
export async function POST(req) {
  if (!llmStatus().configured) return Response.json({ error: ERR.LLM_NOT_CONFIGURED }, { status: 503 });
  let p;
  try { p = parseCast(await req.json()); } catch (e) { return Response.json({ error: e.message }, { status: 400 }); }
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      let open = true;
      const emit = (ev) => { if (open) try { ctrl.enqueue(enc.encode(JSON.stringify(ev) + '\n')); } catch { open = false; } };
      try {
        emit({ type: 'final', ...(await runAgents(p, emit)) });
      } catch (e) {
        const code = String(e.message).split(' ')[0];
        emit({ type: 'error', error: ERR[code] || '推算失败：' + String(e.message).slice(0, 200) });
      } finally {
        if (open) try { ctrl.close(); } catch { /* 客户端已断开 */ }
      }
    }
  });
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-cache, no-transform', 'x-accel-buffering': 'no' } });
}
