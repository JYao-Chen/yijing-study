#!/usr/bin/env python3
"""修正 OpenCC 结果：繁体原文是“乾”的位置恢复为“乾”，“遯”统一写作“遁”。"""
import json
t = json.load(open("data/hexagrams.trad.json", encoding="utf8"))
s = json.load(open("data/hexagrams.simp.json", encoding="utf8"))


def fix(a, b):
    if isinstance(a, str):
        assert len(a) == len(b), (a, b)
        return "".join("乾" if x == "乾" else y for x, y in zip(a, b)).replace("遯", "遁")
    if isinstance(a, list):
        return [fix(x, y) for x, y in zip(a, b)]
    if isinstance(a, dict):
        return {k: (b[k] if k in ("bits", "glyph", "kw") else fix(a[k], b[k])) for k in a}
    return b


s = fix(t, s)
json.dump(s, open("data/hexagrams.simp.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(s[0]["name"], s[0]["tuan"][:12], s[0]["lines"][2], s[32]["name"])
