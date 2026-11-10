"""多智能体实时面板：对假模型服务点“请智能体推算”，检查流水线、角色卡、日志。
uv run --no-project --with playwright==1.64.1 python tests/smoke_live.py http://127.0.0.1:18599/ <截图目录>"""
import sys, pathlib
from playwright.sync_api import sync_playwright
base, out = sys.argv[1], pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp, dark in [("d", {"width": 1280, "height": 900}, False), ("m", {"width": 400, "height": 820}, True)]:
        pg = b.new_page(viewport=vp, color_scheme="dark" if dark else "light")
        pg.on("pageerror", lambda e: errs.append((name, str(e))))
        pg.goto(base + "#tui"); pg.wait_for_selector("#tai:not([hidden])", timeout=8000)
        # 打开页面不应自动解析预填的问题
        pg.wait_for_timeout(1800)
        if "完成" in pg.inner_text("#qst") or pg.query_selector("#tqa .cand.lock"): errs.append((name, "auto-parse-on-load"))
        pg.fill("#tq", "这个月能收回欠款吗"); pg.select_option("#tmd", "compare")
        # 问题解析只在点按钮后调用：输入后等一会儿不应自动开始
        pg.wait_for_timeout(1800)
        if pg.query_selector("#tqa.busy") or pg.query_selector("#tqa .cand.lock"): errs.append((name, "auto-parse-on-input"))
        pg.click("#qgo")
        pg.wait_for_selector("#tqa .cand.lock", timeout=10000)
        pg.wait_for_function("document.querySelector('#qst').textContent.startsWith('完成')", timeout=10000)
        if pg.eval_on_selector_all("#tqa .cand", "e => e.length") != 7: errs.append((name, "cands"))
        if "问事官判定" not in pg.inner_text("#thd"): errs.append((name, "replay-yong", pg.inner_text("#thd")))
        pg.click("#tgo")
        pg.wait_for_function("document.querySelector('#tst').textContent.startsWith('完成') || document.querySelectorAll('.agent.err').length", timeout=20000)
        st = pg.inner_text("#tst")
        if not st.startswith("完成"): errs.append((name, "status", st))
        ok = pg.eval_on_selector_all(".agent.ok", "e => e.length"); nodes = pg.eval_on_selector_all(".pnode.ok", "e => e.length")
        if ok != 6 or nodes != 6: errs.append((name, "cards", ok, nodes))
        logs = pg.eval_on_selector_all("#tlog li", "e => e.map(x => x.className)")
        for cls in ["l-call", "l-first", "l-tool", "l-res", "l-use", "l-step", "l-ok", "l-done"]:
            if cls not in logs: errs.append((name, "log-missing", cls))
        if "沿用问题解析" not in pg.inner_text("#tlog"): errs.append((name, "picked-not-reused"))
        if pg.eval_on_selector_all(".tool.ok", "e => e.length") < 1: errs.append((name, "tool-card"))
        if not pg.query_selector(".vbadge"): errs.append((name, "verdict-badge"))
        if not pg.query_selector(".narr p"): errs.append((name, "narration"))
        w = pg.evaluate("[document.documentElement.scrollWidth,innerWidth]")
        if w[0] > w[1]: errs.append((name, "overflow", w))
        pg.screenshot(path=str(out / f"{name}-live.png"), full_page=True)
        pg.close()
    b.close()
print("ERRORS", len(errs)); [print(e) for e in errs[:30]]
sys.exit(1 if errs else 0)
