#!/usr/bin/env python3
"""把 src 与 data 内联成单页 build/index.html。"""
import json, os
R = os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(os.path.join(R, p), encoding="utf8").read()
data = dict(simp=json.loads(rd("data/hexagrams.simp.json")), trad=json.loads(rd("data/hexagrams.trad.json")),
            lunar=json.loads(rd("data/lunar.json")), fu=json.loads(rd("data/fu_index.json")))
html = rd("src/index.tpl.html")
for key, val in [("/*STYLE*/", rd("src/style.css")), ("/*DATA*/", "var DATA=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";"),
                 ("/*ENGINE*/", rd("src/engine.js") + "\n" + rd("src/infer.js")), ("/*GLOSS*/", rd("src/gloss.js")), ("/*APP*/", rd("src/app.js"))]:
    html = html.replace(key, val)
os.makedirs(os.path.join(R, "build"), exist_ok=True)
open(os.path.join(R, "build/index.html"), "w", encoding="utf8").write(html)
head = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body{margin:0}</style></head><body>'
open(os.path.join(R, "build/standalone.html"), "w", encoding="utf8").write(head + html + "</body></html>")
print(os.path.getsize(os.path.join(R, "build/index.html")), "bytes")
