import { BaseView } from './BaseView.js';
import { Widgets as W } from '../components/Widgets.js';
import { Toast } from '../components/Toast.js';
import { Formatter as F } from '../../utils/Formatter.js';

/** WasteView — บันทึกของเสีย (Module 5) */
export class WasteView extends BaseView {
  constructor(app) {
    super(app, 'panel-waste');
    this.$('#wasteReason').innerHTML = W.options(app.services.waste.reasons, r => r, r => r);
  }

  actions() {
    return {
      'waste-ing-change': () => this.renderLotOptions(),
      'submit-waste':     () => this.submit(),
    };
  }

  render() {
    const sel = this.$('#wasteIngredient');
    sel.innerHTML = W.options(this.s.ingredients.all(), i => i.ingredient_id, i => i.ingredient_name, sel.value);
    this.renderLotOptions();
    this.renderHistory();
  }

  renderLotOptions() {
    const lots = this.s.inventory.lotsOf(parseInt(this.val('#wasteIngredient')));
    this.setHTML('#wasteLot', '<option value="">— ไม่ระบุล็อต (ตัดแบบ FEFO) —</option>' +
      W.options(lots, l => l.lot_id, l => `ล็อต #${l.lot_id} · คงเหลือ ${F.number(l.quantity_remaining)} · หมดอายุ ${l.expire_date}`));
  }

  submit() {
    try {
      const lotVal = this.val('#wasteLot');
      this.s.waste.record({
        ingredientId: parseInt(this.val('#wasteIngredient')),
        lotId: lotVal ? parseInt(lotVal) : null,
        qty: parseFloat(this.val('#wasteQty')),
        reason: this.val('#wasteReason'),
        userId: this.user.user_id,
      });
      this.setHTML('#wasteHint', '');
      this.$('#wasteQty').value = '';
      Toast.show('บันทึกของเสียแล้ว และตัดยอดคงเหลือเรียบร้อย');
      this.renderLotOptions();
      this.renderHistory();
      this.notifyDataChanged();
    } catch (err) {
      this.$('#wasteHint').textContent = err.message;
    }
  }

  renderHistory() {
    const rows = this.s.waste.recent(10);
    this.setHTML('#wasteHistoryList', rows.length
      ? W.table(['วัตถุดิบ', 'จำนวน', 'เหตุผล', 'บันทึกโดย', 'เวลา'], rows.map(w => `<tr>
          <td>${F.escape(this.s.ingredients.nameOf(w.ingredient_id))}</td><td>${F.number(w.quantity_wasted)}</td>
          <td>${F.escape(w.reason)}</td><td>${F.escape(this.s.users.nameOf(w.recorded_by))}</td><td>${F.dateTime(w.recorded_at)}</td></tr>`).join(''))
      : W.empty('ยังไม่มีบันทึกของเสีย'));
  }
}
