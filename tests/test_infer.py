"""推理引擎对照《增刪卜易》卦例。uv run --no-project --with quickjs python tests/test_infer.py [报告目录]
1. 全部排盘一致、月日齐全的卦例都能跑完推理；
2. 用神：书中明说“某爲用神”的卦例，问事分类取到的六亲是否一致；
3. 应期：书中“果……”记下的应验地支是否落在候选集合内，并与同样大小的随机集合的命中概率对比。
应期命中只说明规则实现贴近野鹤的断法，不说明占卜有预测力。"""
import json, sys, os, collections
from math import comb
import quickjs
ctx = quickjs.Context()
ctx.eval(open('src/engine.js', encoding='utf8').read())
ctx.eval(open('src/infer.js', encoding='utf8').read())
ctx.eval('Yi.init(%s,%s)' % (open('data/hexagrams.simp.json', encoding='utf8').read(), open('data/lunar.json', encoding='utf8').read()))
def J(expr): return json.loads(ctx.eval('JSON.stringify(%s)' % expr))
GAN, ZHI = '甲乙丙丁戊己庚辛壬癸', '子丑寅卯辰巳午未申酉戌亥'
GZ60 = [GAN[i % 10] + ZHI[i % 12] for i in range(60)]
T2S = str.maketrans('孫財應', '孙财应')
cases = [c for c in json.load(open('data/zsby_cases.json', encoding='utf8')) if c.get('chart_ok') and c['month'] and c['day'] and len(c['day']) == 2]
fails, rows = [], []
yong_ok = yong_n = 0
hit = n_yq = 0; chance = 0.0; sizes = []
# 卷一（子页面）卦例用于定规则，卷二至卷四（main）作留出集分别统计
split = collections.defaultdict(lambda: [0, 0, 0.0, 0])
verdicts = collections.Counter()
for c in cases:
    t = {'year': '甲子', 'month': '丙' + c['month'], 'day': c['day'], 'hour': '甲子', 'dayIdx': GZ60.index(c['day'])}
    q = c['question'] or c['head']
    try:
        r = J('(function(){var c=Yi.chart(%s,%s);return YiInfer.infer(c,{question:%s});})()' % (json.dumps(c['values']), json.dumps(t, ensure_ascii=False), json.dumps(q, ensure_ascii=False)))
    except Exception as e:
        fails.append((c['id'], str(e)[:120])); continue
    verdicts[r['verdict']] += 1
    row = {'id': c['id'], 'chapter': c['chapter'], 'q': q, 'yong': r['want'], 'label': r['label'], 'verdict': r['verdict'],
           'plus': r['plus'], 'minus': r['minus'], 'cands': [y['zhi'] for y in r['yingqi']]}
    if c['yong']:
        book = {y.translate(T2S) for y in c['yong']}
        book = {'世' if b == '世爻' else '应' if b == '應爻' else b for b in book}
        yong_n += 1; ok = r['want'] in book; yong_ok += ok
        row['yong_book'] = sorted(book); row['yong_ok'] = ok
    targets = sorted({y['zhi'] for y in c['yingqi']})
    if targets:
        S = set(row['cands']); k = len(targets); s = len(S)
        h = any(z in S for z in targets)
        n_yq += 1; hit += h; sizes.append(s)
        p = 1 - comb(12 - s, k) / comb(12, k)
        chance += p
        g = split['卷一（定规则用）' if c['src'] != 'main' else '卷二至四（留出）']
        g[0] += h; g[1] += 1; g[2] += p; g[3] += s
        row.update(book_yq=targets, hit=h, outcome=c['outcomes'][0][:80] if c['outcomes'] else '')
    rows.append(row)
print('CASES', len(cases), 'RAN', len(rows), 'ERRORS', len(fails))
for f in fails[:10]: print('  ERR', f)
print('VERDICTS', dict(verdicts))
print('YONG explicit %d/%d' % (yong_ok, yong_n))
for r in rows:
    if 'yong_ok' in r and not r['yong_ok']: print('  yong miss', r['id'], r['q'][:24], 'mine', r['yong'], 'book', r['yong_book'])
if n_yq:
    print('YINGQI hit %d/%d = %.0f%%, mean candidates %.1f/12, random same-size hit %.0f%%' % (hit, n_yq, 100 * hit / n_yq, sum(sizes) / len(sizes), 100 * chance / n_yq))
    for name, (h, n, p, s) in split.items():
        print('  %s hit %d/%d = %.0f%%, mean candidates %.1f, random %.0f%%' % (name, h, n, 100 * h / n, s / n, 100 * p / n))
if len(sys.argv) > 1:
    os.makedirs(sys.argv[1], exist_ok=True)
    json.dump(rows, open(os.path.join(sys.argv[1], 'infer_report.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)
