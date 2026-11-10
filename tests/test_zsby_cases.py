"""《增刪卜易》卦例排盘校验：书中每盘的纳甲地支、六亲、世应、变爻干支六亲，逐项与本引擎比对。
uv run --no-project --with quickjs python tests/test_zsby_cases.py
一致的卦例写回 data/zsby_cases.json 的 chart_ok 字段，供推理测试使用；不一致的多为录入错误，列出前若干条。"""
import json, quickjs
ctx = quickjs.Context()
ctx.eval(open('src/engine.js', encoding='utf8').read())
ctx.eval('Yi.init(%s,%s)' % (open('data/hexagrams.simp.json', encoding='utf8').read(), open('data/lunar.json', encoding='utf8').read()))
def J(expr): return json.loads(ctx.eval('JSON.stringify(%s)' % expr))
T2S = {'孫': '孙', '財': '财'}
def simp(s): return ''.join(T2S.get(c, c) for c in s) if s else s
cases = json.load(open('data/zsby_cases.json', encoding='utf8'))
ok, bad = 0, []
for c in cases:
    t = {'year': '甲子', 'month': '丙' + (c['month'] or '寅'), 'day': c['day'] if c['day'] and len(c['day']) == 2 else '甲' + (c['day'] or '子')[-1:], 'hour': '甲子', 'dayIdx': 0}
    ch = J('Yi.chart(%s,%s)' % (json.dumps(c['values']), json.dumps(t, ensure_ascii=False)))
    why = []
    for i, (L, B) in enumerate(zip(ch['lines'], c['lines'])):
        if (L['zhi'], L['qin']) != (B['zhi'], simp(B['qin'])): why.append('%d爻 书%s%s 引擎%s%s' % (i + 1, B['qin'], B['zhi'], L['qin'], L['zhi']))
        sy = '世' if L['shi'] else '應' if L['ying'] else ''
        if B['sy'] and B['sy'] != sy: why.append('%d爻 书%s 引擎%s' % (i + 1, B['sy'], sy or '无'))
        if L['moving'] and B['bian'] and (L['bian']['zhi'], L['bian']['qin']) != (B['bian']['zhi'], simp(B['bian']['qin'])):
            why.append('%d爻变 书%s%s 引擎%s%s' % (i + 1, B['bian']['qin'], B['bian']['zhi'], L['bian']['qin'], L['bian']['zhi']))
    if not any(B['sy'] == '世' for B in c['lines']): why.append('书中未标世')
    c['chart_ok'] = not why
    if why: bad.append((c['id'], c['chapter'], c['head'][:30], why[:3]))
    else: ok += 1
json.dump(cases, open('data/zsby_cases.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('CASES', len(cases), 'CHART_OK', ok, 'MISMATCH', len(bad))
for b in bad[:25]: print(' ', b)
