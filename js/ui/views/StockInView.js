import { BaseView } from './BaseView.js';
import { Widgets as W } from '../components/Widgets.js';
import { Toast } from '../components/Toast.js';
import { Formatter as F } from '../../utils/Formatter.js';
import { DateUtil } from '../../utils/DateUtil.js';

/** StockInView — รับสินค้าเข้าสต็อก + ตารางล็อต FEFO (Module 3) */
export class StockInView extends BaseView {
  static STATUS_TAG = {
    empty:   () => '<span class="tag muted">หมดล็อต</span>',
    expired: () => '<span class="tag danger">หมดอายุแล้ว</span>',
    near:    d  => `<span class="tag warn">ใกล้หมดอายุ (${d}ว.)</span>`,
    ok:      () => '<span class="tag ok">ปกติ</span>',
  };

  constructor(app) { super(app, 'panel-stockin'); }

  actions() {
    return {
      'si-change':      () => this.updateHint(),
      'auto-expire':    () => this.autoExpireDate(),
      'submit-stockin': () => this.submit(),
      'search-lot':     () => this.renderLots(),
    };
  }

  render() {
    this.renderSelect();
    this.renderLots();
    this.renderHistory();
  }

  get selectedIngredient() { return this.s.ingredients.get(parseInt(this.val('#siIngredient'))); }

  renderSelect() {
    const sel = this.$('#siIngredient');
    sel.innerHTML = W.options(this.s.ingredients.all(), i => i.ingredient_id, i => `${i.ingredient_name} (${i.purchase_unit})`, sel.value);
    if (!this.val('#siReceivedDate')) this.$('#siReceivedDate').value = DateUtil.today();
    this.updateHint();
  }

  updateHint() {
    const i = this.selectedIngredient;
    const qty = parseFloat(this.val('#siQtyPurchase')) || 0;
    this.$('#stockInHint').textContent = i
      ? `${F.number(qty)} ${i.purchase_unit} × อัตราแปลง ${F.number(i.conversion_rate)} = ${F.number(i.toUsageUnit(qty))} ${i.usage_unit} จะถูกเพิ่มเป็นล็อตใหม่`
      : '';
  }

  autoExpireDate() {
    const i = this.selectedIngredient;
    if (!i) return;
    const received = this.val('#siReceivedDate') || DateUtil.today();
    this.$('#siExpireDate').value = DateUtil.addDays(received, i.shelf_life_days);
  }

  submit() {
    try {
      const ingredient = this.selectedIngredient;
      const { lot, converted } = this.s.inventory.receive({
        ingredient,
        qtyPurchase: parseFloat(this.val('#siQtyPurchase')),
        receivedDate: this.val('#siReceivedDate'),
        expireDate: this.val('#siExpireDate'),
        userId: this.user.user_id,
      });
      Toast.show(`รับเข้า ${ingredient.ingredient_name} จำนวน ${F.number(converted)} ${ingredient.usage_unit} เรียบร้อย — สร้างล็อต #${lot.lot_id}`);
      this.$('#siQtyPurchase').value = '';
      this.updateHint();
      this.renderLots();
      this.renderHistory();
      this.notifyDataChanged();
    } catch (err) { Toast.error(err.message); }
  }

  renderHistory() {
    const rows = this.s.inventory.receivingHistory(8);
    this.setHTML('#receivingHistoryList', rows.length
      ? W.table(['ล็อต', 'วัตถุดิบ', 'จำนวน (หน่วยใช้)', 'วันที่'], rows.map(r => {
          const lot = this.s.inventory.getLot(r.lot_id);
          return `<tr><td>#${r.lot_id}</td><td>${F.escape(lot ? this.s.ingredients.nameOf(lot.ingredient_id) : '—')}</td>
            <td>${F.number(r.received_qty_usage_unit)}</td><td>${F.dateTime(r.received_at)}</td></tr>`;
        }).join(''))
      : W.empty('ยังไม่มีประวัติการรับเข้า'));
  }

  renderLots() {
    const q = this.val('#lotSearch').toLowerCase();
    const rows = this.s.inventory.allLots()
      .filter(l => this.s.ingredients.nameOf(l.ingredient_id).toLowerCase().includes(q));
    this.setHTML('#lotTableBody', rows.length ? rows.map(l => `<tr>
        <td>#${l.lot_id}</td><td>${F.escape(this.s.ingredients.nameOf(l.ingredient_id))}</td>
        <td>${F.number(l.quantity_remaining)}</td><td>${l.received_date}</td><td>${l.expire_date}</td>
        <td>${StockInView.STATUS_TAG[l.status](l.daysLeft)}</td></tr>`).join('')
      : W.emptyRow(6, 'ไม่มีล็อตสินค้า'));
  }
}
