#!/usr/bin/env bash
# 整套验证（Linux，需 node 22、uv、python3）：安装依赖、构建、接口测试（假模型）、引擎与规则测试、页面冒烟。
set -euo pipefail
[ -s ~/.nvm/nvm.sh ] && source ~/.nvm/nvm.sh >/dev/null
OUT=${VERIFY_OUT:-$PWD/.verify}; mkdir -p "$OUT"
npm install --no-audit --no-fund
cp package-lock.json "$OUT/"
npm run build
! curl -sf http://127.0.0.1:18599/ >/dev/null || { echo "端口 18599 已被占用"; exit 1; }
# setsid 让 next 及其子进程同属一个进程组，结束时整组关掉
LLM_MOCK=1 LLM_USAGE_LOG="$OUT/usage.jsonl" setsid node_modules/.bin/next start -H 127.0.0.1 -p 18599 > "$OUT/next.log" 2>&1 &
PID=$!; trap 'kill -- -$PID 2>/dev/null || true' EXIT
for i in $(seq 1 40); do curl -sf http://127.0.0.1:18599/api/health >/dev/null && break; sleep 0.5; done
BASE=http://127.0.0.1:18599 node --test tests/api.test.mjs
uv run -q --no-project --with playwright==1.64.1 python tests/smoke_live.py http://127.0.0.1:18599/ "$OUT/shots"
kill -- -$PID; trap - EXIT
uv run -q --no-project --with quickjs --with lunar-python python tests/test_engine.py | tail -3
uv run --no-project --with quickjs --with najia python tests/compare_najia.py
uv run --no-project --with quickjs python tests/test_zsby_cases.py
uv run --no-project --with quickjs python tests/test_infer.py "$OUT"
uv run --no-project --with playwright==1.64.1 python tests/smoke.py "$PWD/build/standalone.html" "$OUT/shots"
echo VERIFY_OK
