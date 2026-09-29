import { BaseView } from './BaseView.js';
import { Widgets as W, PALETTE } from '../components/Widgets.js';
import { Formatter as F } from '../../utils/Formatter.js';

/** DashboardView — หน้าภาพรวม */
export class DashboardView extends BaseView {
  constructor(app) { super(app, 'panel-dashboard'); }

  render() {
    const { inventory, sales, menus, users, ingredients } = this.s;
    const low = inventory.lowStockList();
    const exp = inventory.expiringLots(5);
    const today = sales.todaySales();
    const todayTotal = today.reduce((s, x) => s + x.total_amount, 0);

    this.setHTML('#dashStats',
      W.statCard('g-deep', 'cash', 'ยอดขายวันนี้', F.money(todayTotal), `${today.length} บิล`) +
      W.statCard('g-mid', 'cup', 'จำนวนแก้วที่ขายวันนี้', `${sales.cupsOf(today)} แก้ว`, 'รวมทุกเมนู') +
      W.statCard('g-cream', 'down', 'วัตถุดิบใกล้หมด', `${low.length} รายการ`, low.length ? 'ควรสั่งซื้อเพิ่ม' : 'อยู่ในระดับปกติ') +
      W.statCard('g-white', 'clock', 'ล็อตใกล้หมดอายุ', `${exp.length} ล็อต`, 'ภายใน 5 วัน'));

    this.setHTML('#dashLowStock', low.length
      ? low.map(x => W.stockBar(x.ingredient, x.remaining)).join('')
      : W.allGood('ไม่มีวัตถุดิบใกล้หมด'));

    this.setHTML('#dashExpiring', exp.length
      ? exp.map(lot => {
          const ing = ingredients.get(lot.ingredient_id);
          return `<div class="exp-item" style="border-left-color:${W.expBorder(lot.daysLeft)}">
            <div><div class="en">${F.escape(ing?.ingredient_name ?? '—')}</div>
            <div class="es">ล็อต #${lot.lot_id} · คงเหลือ ${F.number(lot.quantity_remaining)} ${F.escape(ing?.usage_unit ?? '')}</div></div>
            ${W.expChip(lot.daysLeft)}</div>`;
        }).join('')
      : W.allGood('ไม่มีล็อตใกล้หมดอายุ'));

    const mix = sales.menuMix(today);
    this.setHTML('#dashMenuMix', mix.length
      ? W.donut(mix.map((m, i) => ({ label: menus.nameOf(m.menu_id), value: m.qty, color: PALETTE[i % PALETTE.length] })), 'แก้ว')
      : W.empty('ยังไม่มีการขายวันนี้'));

    const recent = sales.recent(8);
    this.setHTML('#dashRecentSales', recent.length
      ? W.table(['บิล', 'เวลา', 'พนักงาน', 'ยอดรวม'], recent.map(s => `<tr>
          <td><span class="bill-chip">#${s.sale_id}</span></td><td>${F.dateTime(s.sale_datetime)}</td>
          <td>${F.escape(users.nameOf(s.user_id))}</td><td class="money-strong">${F.money(s.total_amount)}</td></tr>`).join(''))
      : W.empty('ยังไม่มีการขาย'));
  }
}
