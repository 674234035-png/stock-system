import { Icons } from './Icons.js';
import { Formatter as F } from '../../utils/Formatter.js';

export const PALETTE = ['#1E4630', '#2E6B4A', '#4A8C66', '#7DB592', '#A9CFB4', '#D6C392', '#EBDFBF', '#B9A774'];

/** Widgets — ชิ้นส่วน UI เล็กๆ ที่คืนค่าเป็น HTML string ใช้ซ้ำหลายหน้า */
export class Widgets {
  static statCard(cls, icon, label, value, foot = '') {
    return `<div class="stat-fancy ${cls}">
      <div class="sf-icon">${Icons.svg(icon)}</div>
      <div class="sf-label">${label}</div>
      <div class="sf-value">${value}</div>
      ${foot ? `<div class="sf-foot">${foot}</div>` : ''}
    </div>`;
  }

  static allGood(message) { return `<div class="all-good">${Icons.svg('check')}${message}</div>`; }
  static empty(message) { return `<div class="empty">${message}</div>`; }
  static emptyRow(colspan, message) { return `<tr><td colspan="${colspan}">${Widgets.empty(message)}</td></tr>`; }

  static table(headers, rowsHtml) {
    return `<div class="table-wrap"><table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table></div>`;
  }

  static stockColor(remaining, reorderPoint) {
    if (remaining <= 0) return '#B9A774';
    return remaining <= reorderPoint ? '#D6C392' : '#4A8C66';
  }

  /** แถบระดับสต็อก (เต็มแถบ = 3 เท่าของจุดสั่งซื้อ) */
  static stockBar(ingredient, remaining) {
    const cap = Math.max(ingredient.reorder_point * 3, 1);
    const pct = Math.max(2, Math.min(100, remaining / cap * 100));
    const color = Widgets.stockColor(remaining, ingredient.reorder_point);
    return `<div class="bar-row">
      <div class="bar-top">
        <span><span class="dot-i" style="background:${color}"></span>${F.escape(ingredient.ingredient_name)}</span>
        <span class="muted">${F.number(remaining)} / ${F.number(ingredient.reorder_point)} ${F.escape(ingredient.usage_unit)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${color};"></div></div>
    </div>`;
  }

  static expChip(days) {
    if (days < 0) return `<span class="chip c-deep">หมดอายุแล้ว</span>`;
    if (days <= 2) return `<span class="chip c-cream">อีก ${days} วัน</span>`;
    return `<span class="chip c-mid">อีก ${days} วัน</span>`;
  }

  static expBorder(days) { return days < 0 ? '#1E4630' : days <= 2 ? '#D6C392' : '#7DB592'; }

  /** แผนภูมิโดนัท (ใช้ conic-gradient ของ CSS) — items: [{label, value, color}] */
  static donut(items, centerLabel) {
    const total = items.reduce((s, x) => s + x.value, 0);
    let acc = 0;
    const stops = items.map(x => {
      const a = acc / total * 360; acc += x.value; const b = acc / total * 360;
      return `${x.color} ${a}deg ${b}deg`;
    });
    return `<div class="donut-wrap">
      <div class="donut" style="background:conic-gradient(${stops.join(',')});">
        <div class="donut-center"><b>${F.number(total)}</b>${centerLabel}</div>
      </div>
      <div class="legend">${items.map(x => `
        <div class="legend-row"><span><span class="dot-i" style="background:${x.color}"></span>${F.escape(x.label)}</span><b>${F.number(x.value)}</b></div>`).join('')}
      </div>
    </div>`;
  }

  /** สร้าง <option> จาก array */
  static options(list, getValue, getLabel, selected = null) {
    return list.map(item => {
      const v = getValue(item);
      return `<option value="${F.escape(v)}" ${String(v) === String(selected) ? 'selected' : ''}>${F.escape(getLabel(item))}</option>`;
    }).join('');
  }
}
