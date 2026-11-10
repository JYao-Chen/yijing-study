#!/usr/bin/env python3
"""Parse 维基文库《周易》六十四卦 wikitext into data/hexagrams.trad.json.
usage: parse_wikisource.py <raw_dir> <out.json>"""
import json, re, sys, os

NAMES = "乾 坤 屯 蒙 需 訟 師 比 小畜 履 泰 否 同人 大有 謙 豫 隨 蠱 臨 觀 噬嗑 賁 剝 復 无妄 大畜 頤 大過 坎 離 咸 恒 遯 大壯 晉 明夷 家人 睽 蹇 解 損 益 夬 姤 萃 升 困 井 革 鼎 震 艮 漸 歸妹 豐 旅 巽 兌 渙 節 中孚 小過 既濟 未濟".split()
TRI = {"乾": "111", "兌": "110", "離": "101", "震": "100", "巽": "011", "坎": "010", "艮": "001", "坤": "000"}
TRI_ALT = {"兑": "兌", "离": "離"}


def clean(s):
    s = re.sub(r"\{\{\*\|[^{}]*\}\}", "", s)
    s = re.sub(r"\{\{另\|([^|{}]*)\|[^{}]*\}\}", r"\1", s)
    s = re.sub(r"\{\{[^{}|]*\|([^{}|]*)\}\}", r"\1", s)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"-\{(?:[a-zA-Z]\|)?([^{}]*)\}-", r"\1", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = s.replace("'''", "").replace("''", "")
    return s.strip()


def parse(name, text):
    sections, cur = {}, None
    text = re.sub(r"<span\s+style", "<span style", text)
    for line in text.splitlines():
        m = re.match(r"\*(?:<span[^>]*>)?'''\s*(易經|彖曰|象曰|文言曰)", line)
        if m:
            cur = m.group(1)
            sections[cur] = []
            continue
        if cur and line.startswith("*"):
            sections[cur].append(line)
    jing = sections["易經"]
    judgment = None
    lines = []
    for raw in jing:
        c = clean(raw.lstrip("*#"))
        if raw.startswith("**"):
            judgment = (judgment or "") + (c.split("：", 1)[1] if judgment is None and "：" in c else c)
        elif raw.startswith("*#"):
            label, body = re.match(r"([初上用][九六]|[九六][二三四五])[：，](.*)", c).groups()
            lines.append({"label": label, "text": body})
    tuan = "".join(clean(x.lstrip("*#")) for x in sections.get("彖曰", []))
    xiang = sections.get("象曰", [])
    daxiang = next((clean(x.lstrip("*#")) for x in xiang if x.startswith("**")), "")
    small = [clean(x.lstrip("*#")) for x in xiang if x.startswith("*#")]
    m = re.search(r"([乾坤震巽坎離离艮兌兑]|-\{乾\}-)[-{}]*下[-{]*([乾坤震巽坎離离艮兌兑])", clean(text))
    lo, up = m.group(1), m.group(2)
    lo, up = TRI_ALT.get(lo, lo), TRI_ALT.get(up, up)
    alt = chr(0x4DC0 + NAMES.index(name))
    found = re.search(r"alt=(.)", text)
    assert not found or found.group(1) == alt, name
    return dict(name=name, kw=NAMES.index(name) + 1, lower=lo, upper=up, bits=TRI[lo] + TRI[up], glyph=alt,
                judgment=judgment, tuan=tuan, daxiang=daxiang, lines=lines, smallxiang=small)


def main(raw, out):
    res = []
    for n in NAMES:
        h = parse(n, open(os.path.join(raw, n + ".txt"), encoding="utf8").read())
        assert len(h["lines"]) == (7 if n in ("乾", "坤") else 6), (n, len(h["lines"]))
        for i, l in enumerate(h["lines"][:6]):
            pos = "初二三四五上"[i]
            bit = h["bits"][i]
            num = "九" if bit == "1" else "六"
            want = pos + num if i in (0, 5) else num + pos
            assert l["label"] == want, (n, i, l["label"], want)
        assert h["judgment"] and h["tuan"] and h["daxiang"], n
        res.append(h)
    json.dump(res, open(out, "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    print(len(res), "hexagrams", os.path.getsize(out), "bytes")
    print({k: res[33][k] for k in ("name", "lower", "upper", "bits", "judgment", "daxiang")})
    print(sum(len(h["smallxiang"]) for h in res), "small xiang")


main(sys.argv[1], sys.argv[2])
