import fs from 'node:fs/promises';
import path from 'node:path';

// 首页：返回 build.py 生成的单页（含全部前端与数据）
export const dynamic = 'force-dynamic';
export async function GET() {
  const html = await fs.readFile(path.join(process.cwd(), 'build/standalone.html'), 'utf8');
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
}
