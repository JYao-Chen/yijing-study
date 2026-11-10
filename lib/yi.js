import Yi from '../src/engine.js';
import YiInfer from '../src/infer.js';
import hexes from '../data/hexagrams.simp.json';
import lunar from '../data/lunar.json';

let ready = false;
export function yi() {
  if (!ready) { Yi.init(hexes, lunar); ready = true; }
  return { Yi, YiInfer };
}

// 校验并整理请求：六爻数值、北京时间、问题
export function parseCast(body) {
  const values = body && body.values;
  if (!Array.isArray(values) || values.length !== 6 || !values.every((v) => [6, 7, 8, 9].includes(v))) throw new Error('values 需为 6 个 6/7/8/9');
  const t = body.time || {};
  const nums = ['y', 'm', 'd', 'h', 'min'].map((k) => Number(t[k] ?? 0));
  if (!(nums[0] >= 1901 && nums[0] <= 2099) || !(nums[1] >= 1 && nums[1] <= 12) || !(nums[2] >= 1 && nums[2] <= 31) || !(nums[3] >= 0 && nums[3] <= 23)) throw new Error('time 需为 1901–2099 年的北京时间 {y,m,d,h,min}');
  const question = String(body.question || '').slice(0, 300);
  const yong = ['父母', '兄弟', '子孙', '妻财', '官鬼', '世', '应'].includes(body.yong) ? body.yong : null;
  // 问题解析阶段已由问事官定下的用神：带上理由，推算时不再重复调用
  const picked = yong && body.yongBy === 'wenshi' ? { reason: String(body.yongReason || '').slice(0, 300), confidence: Math.min(1, Math.max(0, Number(body.yongConfidence) || 0)) } : null;
  return { values, nums, question, yong, picked, mode: body.mode === 'compare' ? 'compare' : 'single' };
}

// 排盘 + 推理（不调用模型）
export function computeCast(p, yongOverride) {
  const { Yi, YiInfer } = yi();
  const t = Yi.ganzhi(...p.nums);
  const chart = Yi.chart(p.values, t);
  const baseline = YiInfer.classify(p.question);
  const yong = yongOverride || p.yong || baseline.yong;
  const infer = YiInfer.infer(chart, { yong });
  return { t, chart, baseline, yong, infer };
}

// 给模型看的精简排盘
export function chartBrief(chart) {
  const { Yi } = yi();
  return {
    本卦: Yi.fullName(chart.bits), 变卦: chart.moving.length ? Yi.fullName(chart.bian) : null,
    卦宫: chart.palace.palace + '宫' + chart.palace.wx, 月建: chart.t.month, 日辰: chart.t.day, 旬空: chart.kong.join(''),
    六冲卦: chart.chongHex, 六合卦: chart.heHex,
    爻: chart.lines.map((L) => ({
      位: L.i + 1, 六亲: L.qin, 干支: L.gan + L.zhi + L.wx, 六神: L.god, 世应: L.shi ? '世' : L.ying ? '应' : '',
      动: L.moving, 空: L.kong, 变: L.moving ? L.bian.qin + L.bian.gan + L.bian.zhi + L.bian.wx + (L.tags.length ? '（' + L.tags.join('、') + '）' : '') : null,
      月日: L.dr.state + (L.dr.monthBreak ? '·月破' : '') + (L.dr.anDong ? '·暗动' : '') + (L.dr.dayBreak ? '·日破' : '')
    })).reverse(),
    伏神: chart.hidden.map((h) => h.qin + h.gan + h.zhi + h.wx + '伏于' + (h.i + 1) + '爻下')
  };
}
