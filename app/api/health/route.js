import { llmStatus } from '../../../lib/llm.js';

export const dynamic = 'force-dynamic';
export function GET() {
  return Response.json({ ok: true, llm: llmStatus() });
}
