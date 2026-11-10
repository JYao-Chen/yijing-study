"""引擎核对：古籍例子 + lunar_python 对照。在 dev-linux 用 uv 运行：
uv run --no-project --with quickjs --with lunar-python python tests/test_engine.py"""
import json, random, sys, quickjs, datetime as dt
from lunar_python import Solar
ctx = quickjs.Context()
ctx.eval(open('src/engine.js', encoding='utf8').read())
hexes = open('data/hexagrams.simp.json', encoding='utf8').read()
lunar = open('data/lunar.json', encoding='utf8').read()
ctx.eval('Yi.init(%s,%s)' % (hexes, lunar))
def J(expr): return json.loads(ctx.eval('JSON.stringify(%s)' % expr))
fails = []
def eq(name, got, want):
    if got != want: fails.append((name, got, want)); print('FAIL', name, got, want)
    else: print('ok  ', name)
B = {h['name']: h['bits'] for h in json.loads(hexes)}
T = "{year:'甲子',month:'丙寅',day:'甲子',hour:'甲子',dayIdx:0}"
def chart(values): return J('Yi.chart(%s,%s)' % (json.dumps(values), T))
def vals(bits, moving=()): return [(9 if b=='1' else 6) if i in moving else (7 if b=='1' else 8) for i,b in enumerate(bits)]
# 纳甲：乾为天 子寅辰午申戌，世六应三
c = chart(vals(B['乾']))
eq('乾纳甲', ''.join(l['zhi'] for l in c['lines']), '子寅辰午申戌')
eq('乾世', [l['i']+1 for l in c['lines'] if l['shi']], [6]); eq('乾应', [l['i']+1 for l in c['lines'] if l['ying']], [3])
# 火珠林：姤之鼎“世持辛丑”“第五爻壬申化己未火，火克本宫为鬼”
c = chart(vals(B['姤'], (4,)))
eq('姤世辛丑', [[l['gan'],l['zhi']] for l in c['lines'] if l['shi']], [['辛','丑']])
eq('姤五壬申化己未', (c['lines'][4]['gan']+c['lines'][4]['zhi'], c['lines'][4]['bian']['gan']+c['lines'][4]['bian']['zhi']), ('壬申','己未'))
eq('姤之鼎', c['bian'], B['鼎'])
# 火珠林：遁之姤“二爻丙午火是鬼，化辛亥水是子孙”
c = chart(vals(B['遁'], (1,)))
eq('遁二丙午官鬼', (c['lines'][1]['gan']+c['lines'][1]['zhi'], c['lines'][1]['qin']), ('丙午','官鬼'))
eq('化辛亥子孙', (c['lines'][1]['bian']['gan']+c['lines'][1]['bian']['zhi'], c['lines'][1]['bian']['qin']), ('辛亥','子孙'))
eq('遁之姤', c['bian'], B['姤'])
# 八宫覆盖 64 卦，乾宫序列
pm = J('Yi.palaceMap'); eq('八宫64', len(pm), 64)
eq('乾宫', [n for o in range(8) for n,b in B.items() if pm[b]['palace']=='乾' and pm[b]['order']==o], ['乾','姤','遁','否','观','剥','晋','大有'])
eq('坎宫', [n for o in range(8) for n,b in B.items() if pm[b]['palace']=='坎' and pm[b]['order']==o], ['坎','节','屯','既济','革','丰','明夷','师'])
eq('六冲卦', sorted(n for n,b in B.items() if J('Yi.isChongHex("%s")'%b)), sorted(['乾','坤','坎','离','艮','震','巽','兑','无妄','大壮']))
eq('六合卦', sorted(n for n,b in B.items() if J('Yi.isHeHex("%s")'%b)), sorted(['否','泰','复','豫','旅','节','困','贲']))
# 傅佩荣课堂例子：123 821 371 → 家人九五；520 → 坤，246 → 上爻
r = J('Yi.numberCast(123,821,371)'); eq('家人九五', (''.join('1' if v in (7,9) else '0' for v in r['values']), r['move']), (B['家人'], 5))
r = J('Yi.numberCast(569,520,246)'); eq('泰上六', (''.join('1' if v in (7,9) else '0' for v in r['values']), r['move']), (B['泰'], 6))
r = J('Yi.numberCast(357,735,257)'); eq('蛊六五', (''.join('1' if v in (7,9) else '0' for v in r['values']), r['move']), (B['蛊'], 5))
r = J('Yi.numberCast(161,201,122)'); eq('乾九二', (''.join('1' if v in (7,9) else '0' for v in r['values']), r['move']), (B['乾'], 2))
# 互、错、覆
eq('互既济', J('Yi.hu("%s")'%B['未济']), B['既济']); eq('覆屯蒙', J('Yi.zong("%s")'%B['屯']), B['蒙']); eq('变否泰', J('Yi.cuo("%s")'%B['否']), B['泰'])
# 变爻规则
def rd(mv, b='乾'): return J('Yi.reading(%s)'%json.dumps(vals(B[b],mv)))
eq('二爻取上', rd((1,3))['targets'][0]['i'], 3)
eq('四爻取之卦不变下爻', [rd((0,2,3,5))['targets'][0][k] for k in('hex','i')], ['zhi',1])
eq('五爻', [rd((0,1,2,3,5))['targets'][0][k] for k in('hex','i')], ['zhi',4])
eq('乾全变用九', rd(range(6))['targets'][0]['i'], 6)
eq('全变占之卦', rd(range(6),'泰')['targets'][0]['hex'], 'zhi')
# 大衍：余数只有四种，概率 1:5:7:3
import collections
ctx.eval('function rng(){return Math.random()} var c={6:0,7:0,8:0,9:0}; var rests={}; for(var i=0;i<200000;i++){var l=Yi.dayanLine(rng);c[l.value]++;rests[l.changes[0].removed]=(rests[l.changes[0].removed]||0)+1}')
c=J('c'); tot=sum(c.values()); print({k:round(v/tot*16,2) for k,v in c.items()}, J('rests'))
eq('大衍值域', sorted(c), ['6','7','8','9'])
eq('第一变只去5或9', sorted(J('rests')), ['5','9'])
for k,w in {'6':1,'7':5,'8':7,'9':3}.items():
    if abs(c[k]/tot*16-w)>0.25: fails.append(('prob',k,c[k]/tot*16))
# 干支、农历与 lunar_python 对照
random.seed(7); n=4000; bad={'year':0,'month':0,'day':0,'hour':0,'lunar':0}; shown=0
start=dt.datetime(1901,3,1); span=(dt.datetime(2099,12,1)-start).days
for _ in range(n):
    d=start+dt.timedelta(days=random.randrange(span),hours=random.randrange(0,23),minutes=random.randrange(60))
    s=Solar.fromYmdHms(d.year,d.month,d.day,d.hour,d.minute,0); l=s.getLunar()
    g=J('Yi.ganzhi(%d,%d,%d,%d,%d)'%(d.year,d.month,d.day,d.hour,d.minute))
    w={'year':l.getYearInGanZhiExact(),'month':l.getMonthInGanZhiExact(),'day':l.getDayInGanZhi(),'hour':l.getTimeInGanZhi()}
    for k in w:
        if g[k]!=w[k]:
            bad[k]+=1
            if shown<8: print(d,k,g[k],w[k],round(g['sunLon'],3)); shown+=1
    if (g['lunar']['month'],g['lunar']['day'],g['lunar']['leap'])!=(abs(l.getMonth()),l.getDay(),l.getMonth()<0): bad['lunar']+=1
print('mismatch of',n,bad)
if bad['day'] or bad['hour'] or bad['lunar'] or bad['year']>4 or bad['month']>4: fails.append(('calendar',bad))
# 旬空
eq('甲子旬空戌亥', J('Yi.xunKong(0)'), ['戌','亥']); eq('甲戌旬空申酉', J('Yi.xunKong(10)'), ['申','酉']); eq('癸亥旬空子丑', J('Yi.xunKong(59)'), ['子','丑'])
print('FAILS', len(fails), fails); sys.exit(1 if fails else 0)
