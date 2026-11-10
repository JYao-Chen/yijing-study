"""从《增刪卜易》wikitext 抽取卦例 → data/zsby_cases.json。
每个卦例：章节、占问月日、事由、六爻排盘（初→上）、断语、书中所称用神、“果……”结果句与其中的应期地支。
排盘是否与本引擎一致由 tests/test_zsby_cases.py 校验，这里只做结构抽取。"""
import json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZHI = '子丑寅卯辰巳午未申酉戌亥'
GAN = '甲乙丙丁戊己庚辛壬癸'
QIN = '父母|兄弟|子孫|妻財|官鬼'
LINE = re.compile(r'^(%s)([%s])([金木水火土])([⚊⚋○ㄨ])(世|應)?[\s　]*(?:(%s)([%s])([金木水火土])([⚊⚋]))?' % (QIN, ZHI, QIN, ZHI))
MONTH_NUM = {'正': 1, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '冬': 11, '十二': 12, '臘': 12}
SIMP = str.maketrans('孫財應爲於', '孙财应为于')

def clean(text):
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\[\[(?:[^]|]*\|)?([^]]*)\]\]', r'\1', text)
    return [l.strip().lstrip('*').strip() for l in text.split('\n') if l.strip()]

def sources():
    d = os.path.join(R, 'corpus/zsby')
    def key(f):
        m = re.match(r'(\d+)(又(\d*))?', f)
        return (int(m.group(1)), 1 if m.group(2) else 0, int(m.group(3) or 0))
    subs = sorted((f for f in os.listdir(d) if re.match(r'\d', f)), key=key)
    for f in subs: yield f[:-5], open(os.path.join(d, f), encoding='utf8').read()
    yield 'main', open(os.path.join(d, 'main.wiki'), encoding='utf8').read()

def month_zhi(s):
    m = re.search(r'([%s])月' % ZHI, s)
    if m: return m.group(1)
    m = re.search(r'(十一|十二|正|冬|臘|[一二三四五六七八九十])月', s)
    return ZHI[(MONTH_NUM[m.group(1)] + 1) % 12] if m else None

def yingqi(sentence):
    """“果……”句中的应期：干支或地支 + 年/月/日/時，以及数字月份。"""
    out = []
    for m in re.finditer(r'([%s]?)([%s])(年|月|日|時)' % (GAN, ZHI), sentence):
        out.append({'unit': m.group(3), 'zhi': m.group(2), 'gz': m.group(1) + m.group(2), 'text': m.group(0)})
    for m in re.finditer(r'(十一|十二|正|冬|臘|[一二三四五六七八九十])月', sentence):
        if m.start() > 0 and sentence[m.start() - 1] in ZHI + GAN: continue
        out.append({'unit': '月', 'zhi': ZHI[(MONTH_NUM[m.group(1)] + 1) % 12], 'gz': '', 'text': m.group(0)})
    return out

cases, chapter = [], ''
for src, raw in sources():
    lines = clean(raw)
    sec = re.search(r'section\s*=\s*(\S+)', raw)
    chapter = sec.group(1) if sec else chapter
    i = 0
    while i < len(lines):
        m = re.match(r'^(\S{1,18}章第\S{1,8})$', lines[i])
        if m: chapter = m.group(1); i += 1; continue
        block = []
        while i + len(block) < len(lines) and LINE.match(lines[i + len(block)]): block.append(LINE.match(lines[i + len(block)]))
        if len(block) < 6: i += 1; continue
        if len(block) != 6:  # 连排两盘或残缺，按 6 行切；不能整除则跳过
            if len(block) % 6: i += len(block); continue
        for g in range(0, len(block), 6):
            b = block[g:g + 6][::-1]  # 书中上爻在前，转成初→上
            head = ' '.join(lines[max(0, i - 2):i]) if g == 0 else ''
            j = i + len(block)
            tail = []
            while j < len(lines) and len(tail) < 8 and not LINE.match(lines[j]):
                if re.search(r'([%s])月.{0,6}日.{0,3}占' % ZHI, lines[j]) and tail: break
                tail.append(lines[j]); j += 1
            comment = ''.join(tail)
            values = []
            for x in b:
                mark = x.group(4)
                values.append({'⚊': 7, '⚋': 8, '○': 9, 'ㄨ': 6}[mark])
            day = re.search(r'([%s]?)([%s])日' % (GAN, ZHI), head)
            q = re.search(r'占(.{1,30}?)(?:[，,。﹐、]|得|$)', head)
            yong = sorted(set(re.findall(r'(%s|世爻|應爻)[^，。﹐]{0,4}?爲用神' % QIN, comment)))
            outs = [s + '。' for s in re.split(r'[。]', comment) if '果' in s]
            cases.append({
                'id': 'zsby-%03d' % (len(cases) + 1), 'src': src, 'chapter': chapter, 'head': head,
                'month': month_zhi(head), 'day': (day.group(1) + day.group(2)) if day else None,
                'question': q.group(1) if q else None,
                'lines': [{'qin': x.group(1), 'zhi': x.group(2), 'wx': x.group(3), 'mark': x.group(4), 'sy': x.group(5) or '',
                           'bian': {'qin': x.group(6), 'zhi': x.group(7), 'wx': x.group(8)} if x.group(6) else None} for x in b],
                'values': values, 'comment': comment, 'yong': yong,
                'outcomes': outs, 'yingqi': [y for s in outs for y in yingqi(s[s.index('果'):])],
            })
        i += len(block)

json.dump(cases, open(os.path.join(R, 'data/zsby_cases.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
full = [c for c in cases if c['month'] and c['day']]
print('cases', len(cases), 'with month+day', len(full), 'with 果', sum(1 for c in cases if c['outcomes']),
      'with 应期', sum(1 for c in cases if c['yingqi']), 'with 用神', sum(1 for c in cases if c['yong']))
