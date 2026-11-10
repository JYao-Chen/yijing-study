import { parseCast, computeCast, chartBrief } from '../../../lib/yi.js';

// 规则推理，不调用模型
export async function POST(req) {
  let p;
  try { p = parseCast(await req.json()); } catch (e) { return Response.json({ error: e.message }, { status: 400 }); }
  const r = computeCast(p);
  return Response.json({ t: r.t, chart: chartBrief(r.chart), baseline: r.baseline, yong: r.yong, infer: r.infer });
}
