"""排盘对照：本引擎 vs 开源 najia（MIT，github.com/bopo/najia）。在 dev-linux 运行：
uv run --no-project --with quickjs --with najia python tests/compare_najia.py
对照项：64 卦卦宫、世应、纳甲干支、六亲、伏神；10 个日干的六神；随机动爻的变卦干支与六亲。"""
import json, random, quickjs
from najia import const, utils
ctx = quickjs.Context()
ctx.eval(open('src/engine.js', encoding='utf8').read())
hexes = open('data/hexagrams.simp.json', encoding='utf8').read()
ctx.eval('Yi.init(%s,%s)' % (hexes, open('data/lunar.json', encoding='utf8').read()))
def J(expr): return json.loads(ctx.eval('JSON.stringify(%s)' % expr))
NAME = {h['bits']: h['name'] for h in json.loads(hexes)}
GZ = '甲乙丙丁戊己庚辛壬癸'
diffs, checks = [], 0
def eq(what, mine, theirs):
    global checks
    checks += 1
    if mine != theirs: diffs.append((what, mine, theirs)); print('DIFF', what, 'mine=', mine, 'najia=', theirs)
def T(day): return json.dumps({'year': '甲子', 'month': '丙寅', 'day': day, 'hour': '甲子', 'dayIdx': 0}, ensure_ascii=False)
def chart(values, day='甲子'): return J('Yi.chart(%s,%s)' % (json.dumps(values), T(day)))
def vals(bits, moving=()): return [(9 if b == '1' else 6) if i in moving else (7 if b == '1' else 8) for i, b in enumerate(bits)]
def theirs_qin(gong, gz): return utils.get_qin6(const.XING5[int(const.GUA5[gong])], const.ZHI5[const.ZHIS.index(gz[1])])

for bits in sorted(NAME):
    n = NAME[bits]; c = chart(vals(bits))
    shi, ying, _ = utils.set_shi_yao(bits); gong = utils.palace(bits, shi)
    eq(n + ' 世', [l['i'] + 1 for l in c['lines'] if l['shi']], [shi])
    eq(n + ' 应', [l['i'] + 1 for l in c['lines'] if l['ying']], [ying])
    eq(n + ' 卦宫', c['palace']['palace'], const.GUAS[gong])
    gzs = utils.get_najia(bits)
    eq(n + ' 纳甲', [l['gan'] + l['zhi'] for l in c['lines']], gzs)
    eq(n + ' 六亲', [l['qin'] for l in c['lines']], [theirs_qin(gong, g) for g in gzs])
    qins = [l['qin'] for l in c['lines']]
    if len(set(qins)) < 5:  # najia 只在六亲不全时给伏神
        mark = const.YAOS[gong] * 2; hq = [theirs_qin(gong, g) for g in utils.get_najia(mark)]
        seat = sorted(hq.index(q) for q in set(hq) - set(qins))
        eq(n + ' 伏神位', sorted(h['i'] for h in c['hidden']), seat)
    else:
        eq(n + ' 无伏神', c['hidden'], [])

for g in GZ:
    eq(g + '日 六神', [l['god'] for l in chart(vals('111111'), g + '子')['lines']], list(utils.get_god6(g + '子')))

random.seed(7)
for _ in range(200):
    bits = random.choice(sorted(NAME)); mv = tuple(i for i in range(6) if random.random() < .4) or (0,)
    c = chart(vals(bits, mv)); shi, _, _ = utils.set_shi_yao(bits); gong = utils.palace(bits, shi)
    bian = ''.join(str(int(b) ^ (i in mv)) for i, b in enumerate(bits))
    gzs = utils.get_najia(bian)
    eq(NAME[bits] + '变' + str(mv), [(l['bian']['gan'] + l['bian']['zhi'], l['bian']['qin']) for l in c['lines'] if l['moving']],
       [(gzs[i], theirs_qin(gong, gzs[i])) for i in mv])
print('CHECKS', checks, 'DIFFS', len(diffs))
raise SystemExit(1 if diffs else 0)
