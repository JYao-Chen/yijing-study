"""页面冒烟：每个视图无脚本错误，并截图。uv run --no-project --with playwright==1.64.1 python tests/smoke.py <html> <out>"""
import sys, pathlib
from playwright.sync_api import sync_playwright
html, out = sys.argv[1], pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp, dark in [("d", {"width": 1280, "height": 900}, False), ("m", {"width": 400, "height": 820}, True)]:
        pg = b.new_page(viewport=vp, color_scheme="dark" if dark else "light")
        pg.on("pageerror", lambda e: errs.append((name, str(e))))
        pg.on("console", lambda m: errs.append((name, m.text)) if m.type == "error" and "fonts.g" not in m.text and "ERR_" not in m.text else None)
        pg.goto("file://" + html)
        for v in "home l1 l2 l3 l4 l5 l6 mh nj tui dict drill".split():
            pg.evaluate("location.hash='%s'" % v); pg.wait_for_timeout(450)
            w = pg.evaluate("[document.documentElement.scrollWidth,innerWidth]")
            if w[0] > w[1]: errs.append((name, v, "overflow", w))
            r = pg.evaluate("(e=>[e.scrollWidth,e.clientWidth])(document.querySelector('.rail'))")
            if name == "m" and r[0] > r[1]: errs.append((name, v, "rail-overflow", r))
            if v == "l5":
                pg.click("#fin"); pg.wait_for_timeout(300)
                for t in ["coin", "num", "time", "hand", "dayan"]:
                    pg.click('[data-tab="%s"]' % t); pg.wait_for_timeout(120)
                    if t == "coin":
                        for _ in range(6): pg.click("#th")
                pg.click("#simb"); pg.wait_for_timeout(150)
                pg.click("#nx"); pg.click("#nx"); pg.click("#nx"); pg.click("#nx"); pg.click("#nx"); pg.wait_for_timeout(120)
            if v == "l6":
                pg.click('#flow button.ln[data-i="3"]'); pg.click('#flow button.ln[data-i="5"]'); pg.click('[data-c="mujiang"]'); pg.click('.rstep[data-s="1"]'); pg.click("#cl")
            if v == "nj":
                for _ in range(3): pg.click("#snext")
                pg.select_option("#njq", "官鬼")
            if v == "tui":
                pg.fill("#tq", "这个月能收回欠款吗"); pg.wait_for_timeout(100)
                if "妻财" not in pg.inner_text("#thd"): errs.append((name, v, "yong-not-classified", pg.inner_text("#thd")))
                for _ in range(40): pg.click("#tnx")
                if not pg.query_selector("#tvd .verdict"): errs.append((name, v, "no-verdict"))
                pg.click('#tph [data-j]'); pg.click("#tpl"); pg.wait_for_timeout(1700); pg.click("#tpl")
                pg.select_option("#ty", "官鬼"); pg.wait_for_timeout(100)
            if v == "drill":
                for _ in range(6):
                    o = pg.query_selector(".opt")
                    if o: o.click()
                    else: pg.click("#dn")
                    pg.click("#go"); pg.wait_for_timeout(40)
            if v == "dict":
                pg.click('.dcell[data-k="60"]'); pg.click('.yao[data-y="1"]'); pg.click("#trd"); pg.click("#lrn")
            if v == "l3":
                pg.click('[data-l="ying"]'); pg.click("#board button.ln")
            if name == "d" and v in "home l1 l4 l6 nj tui".split() or name == "m" and v in ("home", "l1", "nj", "tui"):
                pg.wait_for_timeout(500); pg.screenshot(path=str(out / f"{name}-{v}.png"), full_page=v != "home")
        pg.close()
    b.close()
print("ERRORS", len(errs)); [print(e) for e in errs[:30]]
sys.exit(1 if errs else 0)
