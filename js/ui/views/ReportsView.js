import { BaseView } from './BaseView.js';
import { Widgets as W, PALETTE } from '../components/Widgets.js';
import { Formatter as F } from '../../utils/Formatter.js';

/** ReportsView — รายงานและแจ้งเตือน (Module 6) */
export class ReportsView extends BaseView {
  constructor(app) { super(app, 'panel-reports'); }

  render() {
    const { inventory, reports, waste, ingredients, menus } = this.s;
    const sum = reports.summary();

    this.setHTML('#reportStats',
      W.statCard('g-deep', 'coin', 'ยอดขายรวมทั้งหมด', F.money(sum.totalRevenue), `${sum.totalCups} แก้ว`) +
      W.statCard('g-mid', 'receipt', 'บิลขายทั้งหมด', `${sum.billCount} บิล`, 'นับจาก tbl_sales') +
      W.statCard('g-cream', 'chart', 'ยอดเฉลี่ยต่อบิล', F.money(sum.avgBill), 'รายได้ ÷ จำนวนบิล') +
      W.statCard('g-white', 'trash', 'บันทึกของเสีย', `${sum.wasteCount} รายการ`, 'จาก tbl_waste_record'));

    const low = inventory.lowStockList();
    this.setHTML('#reportLowStockBody', low.length ? low.map(({ ingredient: i, remaining }) => `<tr>
        <td>${F.escape(i.ingredient_name)}</td><td>${F.number(remaining)} ${F.escape(i.usage_unit)}</td>
        <td>${F.number(i.reorder_point)} ${F.escape(i.usage_unit)}</td>
        <td><span class="chip ${remaining <= 0 ? 'c-deep' : 'c-cream'}">${remaining <= 0 ? 'หมด' : 'ใกล้หมด'}</span></td></tr>`).join('')
      : `<tr><td colspan="4">${W.allGood('สต็อกทุกรายการอยู่ในระดับปกติ')}</td></tr>`);

    const exp = inventory.expiringLots(7);
    this.setHTML('#reportExpBody', exp.length ? exp.map(l => `<tr>
        <td>${F.escape(ingredients.nameOf(l.ingredient_id))}</td><td><span class="bill-chip">#${l.lot_id}</span></td>
        <td>${F.number(l.quantity_remaining)}</td><td>${l.expire_date}<br>${W.expChip(l.daysLeft)}</td></tr>`).join('')
      : `<tr><td colspan="4">${W.allGood('ไม่มีล็อตใกล้หมดอายุ')}</td></tr>`);

    this.setHTML('#reportStockLevels',
      inventory.stockLevels().map(x => W.stockBar(x.ingredient, x.remaining)).join('') || W.empty('ยังไม่มีวัตถุดิบ'));

    const top = reports.topMenus();
    const maxQty = top[0]?.qty || 1;
    const rankClass = idx => ['r1', 'r2', 'r3'][idx] || 'rn';
    this.setHTML('#reportTopMenu', top.length ? top.map((m, idx) => `<div class="bar-row">
        <div class="bar-top"><span><span class="rank ${rankClass(idx)}">${idx + 1}</span>${F.escape(menus.nameOf(m.menu_id))}</span>
        <span class="muted">${m.qty} แก้ว · ${F.money(m.revenue)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${m.qty / maxQty * 100}%; background:${PALETTE[Math.min(idx, 5)]};"></div></div>
      </div>`).join('') : W.empty('ยังไม่มีข้อมูลการขาย'));

    const reasons = waste.countByReason();
    this.setHTML('#reportWaste', reasons.length
      ? W.donut(reasons.map((r, i) => ({ label: r.reason, value: r.count, color: PALETTE[(i * 2 + 1) % PALETTE.length] })), 'รายการ')
      : W.allGood('ยังไม่มีของเสีย'));

    this.setHTML('#reportProfit', `
      <div class="grid-3">
        ${W.statCard('g-deep', 'cash', 'รายได้จากการขาย', F.money(sum.totalRevenue))}
        ${W.statCard('g-cream', 'cup', 'จำนวนแก้วที่ขายได้', `${sum.totalCups} แก้ว`)}
        ${W.statCard('g-white', 'calc', 'ต้นทุนวัตถุดิบ', 'ยังไม่มีข้อมูล', 'ต้องเพิ่มฟิลด์ unit_cost')}
      </div>
      <div class="hint" style="margin-top:12px;">หมายเหตุ: สคีมาต้นฉบับยังไม่มีราคาต้นทุนต่อหน่วย จึงยังคำนวณกำไร-ขาดทุนเป็นเงินบาทไม่ได้ — แนะนำเพิ่มฟิลด์ unit_cost ใน tbl_receiving_history</div>`);
  }
}
