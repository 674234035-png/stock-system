import { BaseView } from './BaseView.js';
import { Widgets as W } from '../components/Widgets.js';
import { Toast } from '../components/Toast.js';
import { Formatter as F } from '../../utils/Formatter.js';
import { Cart, CartItem } from '../../models/Cart.js';
import { InsufficientStockError } from '../../core/errors.js';

/** SalesView — หน้าขาย (POS) เลือกวัตถุดิบที่ไม่ใส่ + ตัดสต็อกอัตโนมัติ (Module 4) */
export class SalesView extends BaseView {
  constructor(app) {
    super(app, 'panel-sales');
    this.cart = new Cart();
    this.custom = null;   // สถานะของป๊อปอัพปรับแต่งเมนู {menu_id, excluded:Set, qty, editKey}
  }

  actions() {
    return {
      'pick-menu': el => this.openCustomize(+el.dataset.id),
      'edit-cart': el => this.openCustomize(+el.dataset.id, el.dataset.key),
      'cart-dec':  el => this.changeQty(el.dataset.key, -1),
      'cart-inc':  el => this.changeQty(el.dataset.key, +1),
      'checkout':  () => this.checkout(),
    };
  }

  render() {
    this.renderMenuGrid();
    this.renderCart();
    this.renderHistory();
  }

  reset() {
    this.cart.clear();
    this.setHTML('#deductSummary', '');
    this.setHTML('#checkoutHint', '');
  }

  #price = id => this.s.menus.priceOf(id);

  // ---------- เมนู ----------
  renderMenuGrid() {
    const menus = this.s.menus.active();
    this.setHTML('#posMenuGrid', menus.length ? menus.map(m => {
      const a = this.s.sales.menuAvailability(m.menu_id, this.cart.items);
      return `<button class="menu-tile" data-action="pick-menu" data-id="${m.menu_id}" ${a.ok ? '' : 'disabled'}>
        <div class="mname">${F.escape(m.menu_name)}</div>
        <div class="mprice">${F.money(m.price)}</div>
        ${a.reason ? `<div class="mflag">${a.reason}</div>` : ''}
      </button>`;
    }).join('') : W.empty('ยังไม่มีเมนู — เพิ่มเมนูในโมดูลข้อมูลหลักก่อน'));
  }

  // ---------- ป๊อปอัพเลือกวัตถุดิบที่ไม่ใส่ ----------
  openCustomize(menuId, editKey = null) {
    const existing = editKey ? this.cart.find(editKey) : null;
    this.custom = {
      menu_id: menuId,
      excluded: new Set(existing ? existing.excluded : []),
      qty: existing ? existing.qty : 1,
      editKey,
    };
    this.drawCustomize();
  }

  get #draftItem() { return new CartItem(this.custom.menu_id, this.custom.qty, [...this.custom.excluded]); }

  drawCustomize() {
    const c = this.custom;
    const menu = this.s.menus.get(c.menu_id);
    const short = this.s.sales.shortagesFor([...this.cart.itemsExcept(c.editKey), this.#draftItem]);
    const shortIds = new Set(short.map(x => x.id));
    const lines = this.s.menus.recipeOf(c.menu_id).map(l => ({ line: l, ing: this.s.ingredients.get(l.ingredient_id) }));

    const optionHTML = ({ line, ing }) => {
      const off = c.excluded.has(line.ingredient_id);
      const isShort = !off && shortIds.has(line.ingredient_id);
      return `<label class="ing-opt ${off ? 'off' : ''} ${isShort ? 'short' : ''}">
        <input type="checkbox" ${off ? '' : 'checked'} data-action="toggle" data-id="${line.ingredient_id}">
        <span class="io-name">${F.escape(ing.ingredient_name)}</span>
        ${isShort ? '<span class="io-flag">ไม่พอ</span>' : ''}
        <span class="io-qty">${F.number(line.quantity_used)} ${F.escape(ing.usage_unit)}/ที่</span>
      </label>`;
    };
    const group = (title, list) => list.length ? `<div class="io-group">${title}</div>${list.map(optionHTML).join('')}` : '';
    const excludedNames = [...c.excluded].map(id => this.s.ingredients.nameOf(id));

    this.modal.open(`
      <h3>${F.escape(menu.menu_name)}</h3>
      <p class="modal-sub">${F.money(menu.price)} · ติ๊กออกสำหรับวัตถุดิบที่ลูกค้า<b>ไม่ใส่</b> ระบบจะไม่ตัดวัตถุดิบนั้นออกจากล็อต</p>
      ${group('วัตถุดิบ', lines.filter(x => !x.ing.isPackaging))}
      ${group('บรรจุภัณฑ์', lines.filter(x => x.ing.isPackaging))}
      <div class="divider"></div>
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
        <div>
          <div style="font-size:.78rem; color:var(--ink-soft); margin-bottom:6px;">จำนวน</div>
          <div class="qty-stepper">
            <button type="button" data-action="qty-dec" aria-label="ลดจำนวน">−</button><span>${c.qty}</span>
            <button type="button" data-action="qty-inc" aria-label="เพิ่มจำนวน">+</button>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:.78rem; color:var(--ink-soft);">ไม่ใส่</div>
          <div style="font-size:.85rem; font-weight:600;">${excludedNames.length ? F.escape(excludedNames.join(', ')) : '— (ใส่ครบตามสูตร)'}</div>
        </div>
      </div>
      ${short.length ? `<div class="hint" style="color:#6B5A2E; margin-top:12px;">วัตถุดิบไม่พอ: ${short.map(x =>
        `${F.escape(this.s.ingredients.nameOf(x.id))} (ต้องใช้ ${F.number(x.need)} มี ${F.number(x.have)})`).join(', ')} — ลองติ๊กออกหรือลดจำนวน</div>` : ''}
      <div class="modal-actions">
        <button class="btn" data-action="close">ยกเลิก</button>
        <button class="btn primary" data-action="confirm" ${short.length ? 'disabled' : ''}>
          ${c.editKey ? 'บันทึกการแก้ไข' : 'เพิ่มลงรายการ'} · ${F.money(menu.price * c.qty)}</button>
      </div>`, {
      toggle:    el => this.toggleExclude(+el.dataset.id),
      'qty-dec': () => { c.qty = Math.max(1, c.qty - 1); this.drawCustomize(); },
      'qty-inc': () => { c.qty += 1; this.drawCustomize(); },
      confirm:   () => this.confirmCustomize(),
    });
  }

  toggleExclude(id) {
    const ex = this.custom.excluded;
    ex.has(id) ? ex.delete(id) : ex.add(id);
    this.drawCustomize();
  }

  confirmCustomize() {
    const item = this.#draftItem;
    if (this.s.sales.shortagesFor([...this.cart.itemsExcept(this.custom.editKey), item]).length) {
      Toast.error('วัตถุดิบไม่พอ'); return;
    }
    this.cart.upsert(item, this.custom.editKey);
    this.modal.close();
    this.renderCart();
    this.renderMenuGrid();
  }

  // ---------- ตะกร้า ----------
  changeQty(key, delta) {
    const item = this.cart.find(key);
    if (!item) return;
    const next = item.qty + delta;
    if (next > 0 && this.s.sales.shortagesFor(this.cart.previewQty(key, next)).length) {
      Toast.error('วัตถุดิบไม่พอ'); return;
    }
    this.cart.setQty(key, next);
    this.renderCart();
    this.renderMenuGrid();
  }

  renderCart() {
    const items = this.cart.items;
    this.$('#cartEmpty').hidden = items.length > 0;
    this.setHTML('#cartItems', items.map(c => {
      const m = this.s.menus.get(c.menu_id);
      const ex = c.excluded.map(id => this.s.ingredients.nameOf(id));
      const key = F.escape(c.key);
      return `<div class="cart-item">
        <div>
          <div>${F.escape(m.menu_name)}<button class="cart-edit" data-action="edit-cart" data-id="${c.menu_id}" data-key="${key}">แก้ไข</button></div>
          <div class="hint" style="margin:0;">${F.money(m.price)} × ${c.qty}</div>
          ${ex.length ? `<span class="cart-exclude">ไม่ใส่: ${F.escape(ex.join(', '))}</span>` : ''}
        </div>
        <div class="qtybtns">
          <button data-action="cart-dec" data-key="${key}" aria-label="ลด">−</button><span>${c.qty}</span>
          <button data-action="cart-inc" data-key="${key}" aria-label="เพิ่ม">+</button>
        </div>
      </div>`;
    }).join(''));
    this.$('#cartTotal').textContent = F.money(this.cart.total(this.#price));
  }

  // ---------- ปิดบิล ----------
  checkout() {
    try {
      const { sale, movements, saved } = this.s.sales.checkout(this.cart.items, this.user.user_id);
      this.renderDeductSummary(sale, movements, saved);
      Toast.show(`บันทึกการขายบิล #${sale.sale_id} สำเร็จ — ${F.money(sale.total_amount)}`);
      this.setHTML('#checkoutHint', '');
      this.cart.clear();
      this.render();
      this.notifyDataChanged();
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        const names = err.shortages.map(x => this.s.ingredients.nameOf(x.id)).join(', ');
        this.$('#checkoutHint').textContent = `วัตถุดิบไม่พอ: ${names} — ยกเลิกการขายทั้งบิล`;
        Toast.error('ยกเลิกการขาย: วัตถุดิบไม่เพียงพอ');
      } else {
        Toast.error(err.message);
      }
    }
  }

  renderDeductSummary(sale, movements, saved) {
    const ing = id => this.s.ingredients.get(id);
    const savedText = [...saved].map(([id, q]) => `${ing(id).ingredient_name} ${F.number(q)} ${ing(id).usage_unit}`).join(', ');
    this.setHTML('#deductSummary', `
      <div class="deduct-box">
        <div class="db-title">บิล #${sale.sale_id} — วัตถุดิบที่ถูกตัดออกจากล็อต (FEFO)</div>
        ${W.table(['วัตถุดิบ', 'ล็อต', 'ตัดออก', 'คงเหลือในล็อต'], movements.map(mv => `<tr>
          <td>${F.escape(ing(mv.ingredient_id).ingredient_name)}</td><td>#${mv.lot_id}</td>
          <td>${F.number(mv.qty)} ${F.escape(ing(mv.ingredient_id).usage_unit)}</td><td>${F.number(mv.left)}</td></tr>`).join(''))}
        ${saved.size ? `<div class="hint">ไม่ถูกตัด (ลูกค้าไม่ใส่): ${F.escape(savedText)}</div>` : ''}
      </div>`);
  }

  renderHistory() {
    const rows = this.s.sales.recent(10);
    this.setHTML('#salesHistoryBody', rows.length ? rows.map(s => {
      const items = this.s.sales.detailsOf(s.sale_id).map(d => {
        const ex = d.excluded_ingredients.map(id => this.s.ingredients.nameOf(id));
        return `${F.escape(this.s.menus.nameOf(d.menu_id))} ×${d.quantity}${ex.length ? ` <span class="cart-exclude">ไม่ใส่: ${F.escape(ex.join(', '))}</span>` : ''}`;
      }).join('<br>');
      return `<tr><td>#${s.sale_id}</td><td>${F.dateTime(s.sale_datetime)}</td><td>${F.escape(this.s.users.nameOf(s.user_id))}</td>
        <td>${items}</td><td>${F.money(s.total_amount)}</td></tr>`;
    }).join('') : W.emptyRow(5, 'ยังไม่มีรายการขาย'));
  }
}
