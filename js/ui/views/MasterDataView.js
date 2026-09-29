import { BaseView } from './BaseView.js';
import { Widgets as W } from '../components/Widgets.js';
import { Toast } from '../components/Toast.js';
import { Formatter as F } from '../../utils/Formatter.js';

/** MasterDataView — ข้อมูลหลัก: เมนู / วัตถุดิบ / สูตรเมนู (Module 2) */
export class MasterDataView extends BaseView {
  constructor(app) {
    super(app, 'panel-master');
    this.tab = 'menu';
    this.recipeDraft = [];   // สูตรที่กำลังแก้ (ยังไม่บันทึก)
  }

  actions() {
    return {
      'tab':                el => this.setTab(el.dataset.tab),
      'search-menu':        () => this.renderMenuTable(),
      'add-menu':           () => this.openMenuModal(null),
      'edit-menu':          el => this.openMenuModal(+el.dataset.id),
      'search-ing':         () => this.renderIngredientTable(),
      'add-ing':            () => this.openIngredientModal(null),
      'edit-ing':           el => this.openIngredientModal(+el.dataset.id),
      'select-recipe-menu': () => this.loadRecipeDraft(),
      'recipe-ing':         el => { this.recipeDraft[+el.dataset.idx].ingredient_id = el.value ? +el.value : null; },
      'recipe-qty':         el => { this.recipeDraft[+el.dataset.idx].quantity_used = parseFloat(el.value) || 0; },
      'add-recipe-line':    () => { this.recipeDraft.push(this.#blankLine()); this.drawRecipeLines(); },
      'remove-recipe-line': el => this.removeRecipeLine(+el.dataset.idx),
      'save-recipe':        () => this.saveRecipe(),
    };
  }

  render() {
    this.renderMenuTable();
    this.renderIngredientTable();
    this.renderRecipeMenuSelect();
  }

  setTab(tab) {
    this.tab = tab;
    this.panel.querySelectorAll('.mt-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    this.panel.querySelectorAll('.mt-panel').forEach(p => { p.hidden = p.id !== 'mt-' + tab; });
    if (tab === 'recipe') this.renderRecipeMenuSelect();
  }

  // ================= เมนู =================
  renderMenuTable() {
    const rows = this.s.menus.search(this.val('#menuSearch'));
    this.setHTML('#menuTableBody', rows.length ? rows.map(m => {
      const count = this.s.menus.recipeOf(m.menu_id).length;
      return `<tr>
        <td>#${m.menu_id}</td><td>${F.escape(m.menu_name)}</td><td>${F.escape(m.category)}</td><td>${F.money(m.price)}</td>
        <td>${m.isActive ? '<span class="tag ok">เปิดขาย</span>' : '<span class="tag muted">ปิด</span>'}</td>
        <td>${count ? `<span class="tag ok">${count} วัตถุดิบ</span>` : '<span class="tag warn">ยังไม่ตั้งสูตร</span>'}</td>
        <td><button class="btn small" data-action="edit-menu" data-id="${m.menu_id}">แก้ไข</button></td>
      </tr>`;
    }).join('') : W.emptyRow(7, 'ไม่พบเมนู'));
  }

  openMenuModal(id) {
    const m = id ? this.s.menus.get(id) : { menu_name: '', category: '', price: '', status: 'active' };
    const e = F.escape;
    this.modal.open(`
      <h3>${id ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h3>
      <p class="modal-sub">ข้อมูลนี้จะถูกบันทึกลง tbl_menu</p>
      <div class="form-grid">
        <div class="f span-all"><label for="fMenuName">ชื่อเมนู</label><input id="fMenuName" value="${e(m.menu_name)}"></div>
        <div class="f"><label for="fMenuCat">หมวดหมู่</label><input id="fMenuCat" value="${e(m.category)}" placeholder="น้ำมะพร้าว / มะพร้าวปั่น"></div>
        <div class="f"><label for="fMenuPrice">ราคาขาย (บาท)</label><input id="fMenuPrice" type="number" step="0.01" min="0" value="${e(m.price)}"></div>
        <div class="f"><label for="fMenuStatus">สถานะ</label>
          <select id="fMenuStatus">
            <option value="active" ${m.status === 'active' ? 'selected' : ''}>เปิดขาย</option>
            <option value="inactive" ${m.status === 'inactive' ? 'selected' : ''}>ปิดขาย</option>
          </select></div>
      </div>
      <div class="modal-actions">
        ${id ? '<button class="btn danger" data-action="delete">ลบเมนู</button>' : ''}
        <button class="btn" data-action="close">ยกเลิก</button>
        <button class="btn primary" data-action="save">บันทึก</button>
      </div>`, {
      save:   () => this.saveMenu(id),
      delete: () => this.deleteMenu(id),
    });
  }

  saveMenu(id) {
    const md = this.modal;
    try {
      this.s.menus.save(id, {
        menu_name: md.value('#fMenuName').trim(),
        category: md.value('#fMenuCat').trim() || 'ทั่วไป',
        price: parseFloat(md.value('#fMenuPrice')) || 0,
        status: md.value('#fMenuStatus'),
      });
      Toast.show(id ? 'บันทึกการแก้ไขเมนูแล้ว' : 'เพิ่มเมนูใหม่แล้ว');
      this.notifyDataChanged();
      md.close();
      this.renderMenuTable();
      this.renderRecipeMenuSelect();
    } catch (err) { Toast.error(err.message); }
  }

  deleteMenu(id) {
    if (!confirm(`ลบเมนู "${this.s.menus.nameOf(id)}" และสูตรของเมนูนี้?`)) return;
    this.s.menus.delete(id);
    this.modal.close();
    this.renderMenuTable();
    this.renderRecipeMenuSelect();
    Toast.show('ลบเมนูแล้ว');
    this.notifyDataChanged();
  }

  // ================= วัตถุดิบ =================
  renderIngredientTable() {
    const rows = this.s.ingredients.search(this.val('#ingSearch'));
    this.setHTML('#ingTableBody', rows.length ? rows.map(i => {
      const rem = this.s.inventory.stockRemaining(i.ingredient_id);
      const unit = F.escape(i.usage_unit);
      return `<tr>
        <td>#${i.ingredient_id}</td><td>${F.escape(i.ingredient_name)}</td><td>${i.typeLabel}</td>
        <td>${F.escape(i.purchase_unit)} → ${unit}</td><td>${F.number(i.conversion_rate)}</td>
        <td><span class="tag ${rem <= i.reorder_point ? 'warn' : 'ok'}">${F.number(rem)} ${unit}</span></td>
        <td>${F.number(i.reorder_point)} ${unit}</td><td>${i.shelf_life_days} วัน</td>
        <td><button class="btn small" data-action="edit-ing" data-id="${i.ingredient_id}">แก้ไข</button></td>
      </tr>`;
    }).join('') : W.emptyRow(9, 'ไม่พบวัตถุดิบ'));
  }

  openIngredientModal(id) {
    const i = id ? this.s.ingredients.get(id) : {
      ingredient_name: '', type: 'raw_material', purchase_unit: '', usage_unit: '',
      conversion_rate: '', reorder_point: '', shelf_life_days: '',
    };
    const e = F.escape;
    this.modal.open(`
      <h3>${id ? 'แก้ไขวัตถุดิบ' : 'เพิ่มวัตถุดิบ/บรรจุภัณฑ์'}</h3>
      <p class="modal-sub">ข้อมูลนี้จะถูกบันทึกลง tbl_ingredients</p>
      <div class="form-grid">
        <div class="f span-all"><label for="fIngName">ชื่อวัตถุดิบ</label><input id="fIngName" value="${e(i.ingredient_name)}"></div>
        <div class="f"><label for="fIngType">ประเภท</label>
          <select id="fIngType">
            <option value="raw_material" ${i.type === 'raw_material' ? 'selected' : ''}>วัตถุดิบ</option>
            <option value="packaging" ${i.type === 'packaging' ? 'selected' : ''}>บรรจุภัณฑ์</option>
          </select></div>
        <div class="f"><label for="fIngShelf">อายุเก็บ (วัน)</label><input id="fIngShelf" type="number" min="0" value="${e(i.shelf_life_days)}"></div>
        <div class="f"><label for="fIngPU">หน่วยที่ซื้อ</label><input id="fIngPU" value="${e(i.purchase_unit)}" placeholder="เช่น ถุง, ลัง"></div>
        <div class="f"><label for="fIngUU">หน่วยที่ใช้จริง</label><input id="fIngUU" value="${e(i.usage_unit)}" placeholder="เช่น กรัม, มล., ชิ้น"></div>
        <div class="f"><label for="fIngRate">อัตราแปลง (ซื้อ→ใช้)</label><input id="fIngRate" type="number" step="0.0001" min="0" value="${e(i.conversion_rate)}"></div>
        <div class="f"><label for="fIngReorder">จุดแจ้งเตือนสต็อกต่ำ (หน่วยใช้)</label><input id="fIngReorder" type="number" step="0.01" min="0" value="${e(i.reorder_point)}"></div>
      </div>
      <div class="modal-actions">
        ${id ? '<button class="btn danger" data-action="delete">ลบ</button>' : ''}
        <button class="btn" data-action="close">ยกเลิก</button>
        <button class="btn primary" data-action="save">บันทึก</button>
      </div>`, {
      save:   () => this.saveIngredient(id),
      delete: () => this.deleteIngredient(id),
    });
  }

  saveIngredient(id) {
    const md = this.modal;
    try {
      this.s.ingredients.save(id, {
        ingredient_name: md.value('#fIngName').trim(),
        type: md.value('#fIngType'),
        shelf_life_days: parseInt(md.value('#fIngShelf')) || 0,
        purchase_unit: md.value('#fIngPU').trim(),
        usage_unit: md.value('#fIngUU').trim(),
        conversion_rate: parseFloat(md.value('#fIngRate')) || 1,
        reorder_point: parseFloat(md.value('#fIngReorder')) || 0,
      });
      Toast.show(id ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มวัตถุดิบใหม่แล้ว');
      md.close();
      this.renderIngredientTable();
      this.notifyDataChanged();
    } catch (err) { Toast.error(err.message); }
  }

  deleteIngredient(id) {
    try {
      if (!confirm(`ลบ "${this.s.ingredients.nameOf(id)}" และล็อตคงเหลือทั้งหมดของวัตถุดิบนี้?`)) return;
      this.s.ingredients.delete(id);
      this.modal.close();
      this.renderIngredientTable();
      this.notifyDataChanged();
      Toast.show('ลบวัตถุดิบแล้ว');
    } catch (err) { Toast.error(err.message); }
  }

  // ================= สูตรเมนู (BOM) =================
  #blankLine() { return { ingredient_id: null, quantity_used: '' }; }

  renderRecipeMenuSelect() {
    const sel = this.$('#recipeMenuSelect');
    const current = sel.value;
    const menus = this.s.menus.all();
    sel.innerHTML = W.options(menus, m => m.menu_id, m => m.menu_name, current);
    this.loadRecipeDraft();
  }

  loadRecipeDraft() {
    const menuId = parseInt(this.val('#recipeMenuSelect'));
    this.recipeDraft = this.s.menus.recipeOf(menuId).map(r => ({ ingredient_id: r.ingredient_id, quantity_used: r.quantity_used }));
    if (!this.recipeDraft.length) this.recipeDraft.push(this.#blankLine());
    this.setHTML('#recipeSaveHint', '');
    this.drawRecipeLines();
  }

  drawRecipeLines() {
    const ingredients = this.s.ingredients.all();
    this.setHTML('#recipeLines', this.recipeDraft.map((line, idx) => `
      <div class="recipe-line">
        <select data-action="recipe-ing" data-idx="${idx}" aria-label="วัตถุดิบ">
          <option value="">— เลือกวัตถุดิบ —</option>
          ${W.options(ingredients, i => i.ingredient_id, i => `${i.ingredient_name} (${i.usage_unit})`, line.ingredient_id)}
        </select>
        <input type="number" step="0.01" min="0" placeholder="ปริมาณ/ที่" aria-label="ปริมาณต่อที่"
               value="${F.escape(line.quantity_used)}" data-action="recipe-qty" data-on="input" data-idx="${idx}">
        <button class="btn small danger" type="button" data-action="remove-recipe-line" data-idx="${idx}">ลบ</button>
      </div>`).join(''));
  }

  removeRecipeLine(idx) {
    this.recipeDraft.splice(idx, 1);
    if (!this.recipeDraft.length) this.recipeDraft.push(this.#blankLine());
    this.drawRecipeLines();
  }

  saveRecipe() {
    const menuId = parseInt(this.val('#recipeMenuSelect'));
    if (!menuId) { Toast.error('กรุณาเพิ่มเมนูก่อน'); return; }
    try {
      this.s.menus.saveRecipe(menuId, this.recipeDraft);
      this.setHTML('#recipeSaveHint', 'บันทึกสูตรแล้ว');
      Toast.show('บันทึกสูตรเมนูแล้ว');
      this.notifyDataChanged();
      this.renderMenuTable();
    } catch (err) {
      this.setHTML('#recipeSaveHint', F.escape(err.message));
    }
  }
}
