"""页面冒烟：每个视图无脚本错误，并截图。uv run --no-project --with playwright==1.64.1 python tests/smoke.py <html> <out>"""
import sys, pathlib
from playwright.sync_api import sync_playwright

html, out = sys.argv[1], pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
errs = []
VIEWS = "home c0 c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 l1 l2 l3 l4 l5 l6 mh nj tui dict qa drill".split()
SHOT_D = set("home c0 c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 l6 nj tui qa drill".split())
SHOT_M = set("home c1 c7 qa tui".split())

def check_overflow(pg, name, tag):
    w = pg.evaluate("[document.documentElement.scrollWidth,innerWidth]")
    if w[0] > w[1]: errs.append((name, tag, "overflow", w))
    r = pg.evaluate("(e=>[e.scrollWidth,e.clientWidth])(document.querySelector('.rail'))")
    if name == "m" and r[0] > r[1]: errs.append((name, tag, "rail-overflow", r))

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp, dark in [("d", {"width": 1280, "height": 900}, False), ("m", {"width": 400, "height": 820}, True)]:
        pg = b.new_page(viewport=vp, color_scheme="dark" if dark else "light")
        pg.on("pageerror", lambda e: errs.append((name, str(e))))
        pg.on("console", lambda m: errs.append((name, m.text)) if m.type == "error" and "fonts.g" not in m.text and "ERR_" not in m.text else None)
        pg.goto("file://" + html)
        for v in VIEWS:
            pg.evaluate("location.hash='%s'" % v); pg.wait_for_timeout(400)
            check_overflow(pg, name, v)

            if name == "d" and v in SHOT_D or name == "m" and v in SHOT_M:
                pg.wait_for_timeout(300)
                pg.screenshot(path=str(out / f"{name}-{v}.png"), full_page=v != "home")

            if v == "home":
                if name == "m":
                    pg.click("#mnav-btn"); pg.wait_for_timeout(150)
                    if not pg.query_selector(".rail.open"): errs.append((name, "mobile-nav-open"))
                    check_overflow(pg, name, "home-nav-open")
                    pg.click("#mnav-btn"); pg.wait_for_timeout(120)
                dq_opt = pg.query_selector("#daily-q .opt")
                if dq_opt:
                    dq_opt.click(); pg.wait_for_timeout(100)
                    if not pg.query_selector("#daily-dict"): errs.append((name, "daily-q-no-fb"))

            if v == "c0":
                pg.click(".myth-card .mopt-myth"); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(80)
                pg.click('.layer-tabs [data-ly="1"]'); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(80)
                gterm = pg.query_selector(".gterm")
                if not gterm: errs.append((name, v, "no-gterm"))
                else:
                    gterm.click(); pg.wait_for_timeout(80)
                    if not pg.query_selector("#gpop:not([hidden])"): errs.append((name, v, "gpop-not-shown"))
                    check_overflow(pg, name, "c0-gpop")
                    pg.click(".gpop-x"); pg.wait_for_timeout(60)
                pg.click('.mcheck .mopt[data-ok="1"]'); pg.wait_for_timeout(60)
                if not pg.query_selector(".mcheck .mfb.ok"): errs.append((name, v, "mcheck-no-ok"))
                pg.click('[data-mode="overview"]'); pg.wait_for_timeout(120)
                if pg.eval_on_selector_all(".step-card", "e => e.length") != 4: errs.append((name, v, "overview-steps"))
                check_overflow(pg, name, "c0-overview")
                pg.click('[data-mode="guided"]'); pg.wait_for_timeout(80)

            if v == "c1":
                pg.click('.sc-bar[data-sc="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.son-btn[data-bits="010"]'); pg.click('.dau-btn[data-bits="101"]'); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click("#trilab button.ln"); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('[data-k="艮"]'); pg.wait_for_timeout(80)
                check_overflow(pg, name, "c1-end")

            if v == "c2":
                pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.xt-svg .ring-node[data-t="离"]'); pg.click(".xt-sum-btn"); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click(".ht-next"); pg.click('.luoshu-lines [data-ll="6"]'); pg.wait_for_timeout(80)
                if "15" not in pg.inner_text(".luoshu-eq"): errs.append((name, v, "luoshu-no-15"))

            if v == "c3":
                pg.click('.tg-presets [data-l="坤"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click(".dc-gua button.ln"); pg.click(".dc-check"); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.sg-tabs [data-sg="2"]'); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click(".zhun-hu-btn"); pg.wait_for_timeout(80)

            if v == "c4":
                pg.click(".yn-gua button.ln"); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.ana-qs [data-f="daxiang"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.xu-btns [data-xi="2"]'); pg.wait_for_timeout(80)

            if v == "c5":
                pg.click('.zhen-btn[data-z="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.sc-pills [data-si="4"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click("#lnext"); pg.wait_for_timeout(120)
                pg.click('#sc [data-v="无咎"]'); pg.wait_for_timeout(80)

            if v == "c6":
                pg.click('.wu-tabs [data-w="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('[data-l="ying"]'); pg.click("#board button.ln"); pg.wait_for_timeout(80)
                pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click("#dq button.ln"); pg.click("#dc"); pg.click("#dn"); pg.wait_for_timeout(80)

            if v == "c7":
                pg.click('.dragon-track [data-di="5"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('#kun-tabs [data-ki="1"]'); pg.click('.mcheck .mopt[data-ok="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.qian-btns [data-qi="2"]'); pg.click('.mcheck .mopt[data-ok="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.sc-match[data-si="0"] .sm-opt[data-pick="乾"]'); pg.wait_for_timeout(80)

            if v == "c8":
                pg.click('#h4-tabs [data-hi="2"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.hq-item[data-qi="0"] .hq-opt[data-kw="3"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.turn-btns [data-ti="3"]'); pg.click('.mcheck .mopt[data-ok="1"]'); pg.wait_for_timeout(80)

            if v == "c9":
                pg.click('#s4-tabs [data-si="2"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('#nine-grid [data-ni="1"]'); pg.click('.mcheck .mopt[data-ok="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                check_overflow(pg, name, "c9-end")

            if v == "c10":
                pg.click('.mode-compare [data-mc="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.phil-tabs [data-pi="1"]'); pg.click("#lnext"); pg.wait_for_timeout(100)
                pg.click('.mcheck .mopt[data-ok="1"]'); pg.wait_for_timeout(80)

            if v == "l5":
                pg.click("#fin"); pg.wait_for_timeout(300)
                for t in ["coin", "num", "time", "hand", "dayan"]:
                    pg.click('[data-tab="%s"]' % t); pg.wait_for_timeout(120)
                    if t == "coin":
                        for _ in range(6): pg.click("#th")
                pg.click("#simb"); pg.wait_for_timeout(150)
                pg.click("#nx"); pg.click("#nx"); pg.click("#nx"); pg.click("#nx"); pg.click("#nx"); pg.wait_for_timeout(120)

            if v == "l6":
                pg.click('#flow button.ln[data-i="3"]'); pg.click('#flow button.ln[data-i="5"]')
                pg.click('#ctx-lab .ctx-case-btn[data-ci="1"]'); pg.click('#ctx-lab .ctx-pick-btn[data-pi="1"]'); pg.click("#ctx-load"); pg.wait_for_timeout(80)
                pg.fill("#j-q", "测试情境"); pg.fill("#j-read", "重点看九四解而拇"); pg.click("#j-save"); pg.wait_for_timeout(80)
                if "测试情境" not in pg.inner_text("#j-list"): errs.append((name, v, "journal-not-saved"))
                pg.click('[data-c="mujiang"]'); pg.click('.rstep[data-s="1"]'); pg.click("#cl")

            if v == "qa":
                pg.click('[data-fcat="divination"]'); pg.wait_for_timeout(80)
                check_overflow(pg, name, "qa-filter")
                pg.click('[data-fcat="all"]'); pg.click(".faq-card[data-qn='7'] .faq-head"); pg.wait_for_timeout(80)
                if not pg.query_selector(".faq-card[data-qn='7'].open"): errs.append((name, v, "qa-not-opened"))

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
                for tr in [1, 2, 3, 4, 5]:
                    pg.click('[data-tier="%d"]' % tr); pg.wait_for_timeout(80)
                    check_overflow(pg, name, f"drill-t{tr}")
                    for _ in range(4):
                        o = pg.query_selector(".opt")
                        if o: o.click()
                        else: pg.click("#dn")
                        pg.click("#go"); pg.wait_for_timeout(40)

            if v == "dict":
                pg.click('.dcell[data-k="60"]'); pg.click('.yao[data-y="1"]'); pg.click("#trd"); pg.click("#lrn")

        pg.close()
    b.close()
print("ERRORS", len(errs)); [print(e) for e in errs[:30]]
sys.exit(1 if errs else 0)
