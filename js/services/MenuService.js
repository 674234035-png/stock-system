import { Menu } from '../models/Menu.js';
import { RecipeLine } from '../models/RecipeLine.js';
import { ValidationError } from '../core/errors.js';

/** MenuService — จัดการเมนูและสูตรเมนู (BOM) (Module 2) */
export class MenuService {
  constructor(db) { this.db = db; }

  all() { return this.db.menus.all(); }
  active() { return this.db.menus.where(m => m.isActive); }
  get(id) { return this.db.menus.getById(id); }
  nameOf(id) { return this.get(id)?.menu_name ?? '—'; }
  priceOf(id) { return this.get(id)?.price ?? 0; }

  search(query = '') {
    const q = query.trim().toLowerCase();
    return this.db.menus.where(m => m.menu_name.toLowerCase().includes(q));
  }

  save(id, data) {
    if (!data.menu_name) throw new ValidationError('กรุณาระบุชื่อเมนู');
    if (data.price < 0) throw new ValidationError('ราคาต้องไม่ติดลบ');

    if (id) {
      const menu = this.get(id);
      menu.update(data);
      return menu;
    }
    return this.db.menus.add(new Menu({ menu_id: this.db.menus.nextId(), ...data }));
  }

  delete(id) {
    this.db.menus.removeWhere(m => m.menu_id === id);
    this.db.recipes.removeWhere(r => r.menu_id === id);
  }

  // ---------- สูตรเมนู (BOM) ----------
  recipeOf(menuId) { return this.db.recipes.where(r => r.menu_id === menuId); }

  /** แทนที่สูตรทั้งหมดของเมนูด้วยรายการใหม่ */
  saveRecipe(menuId, lines) {
    const valid = lines.filter(l => l.ingredient_id && l.quantity_used > 0);
    if (!valid.length) throw new ValidationError('กรุณาเพิ่มวัตถุดิบอย่างน้อย 1 รายการ');

    this.db.recipes.removeWhere(r => r.menu_id === menuId);
    valid.forEach(l => this.db.recipes.add(new RecipeLine({
      recipe_id: this.db.recipes.nextId(),
      menu_id: menuId,
      ingredient_id: l.ingredient_id,
      quantity_used: l.quantity_used,
    })));
  }

  /**
   * คำนวณวัตถุดิบที่ต้องใช้ทั้งหมดของรายการสินค้า (หักวัตถุดิบที่ลูกค้าไม่ใส่แล้ว)
   * @param {import('../models/Cart.js').CartItem[]} items
   * @returns {Map<number, number>} ingredient_id → ปริมาณที่ต้องใช้
   */
  requirementOf(items) {
    const need = new Map();
    items.forEach(item => {
      this.recipeOf(item.menu_id).forEach(line => {
        if (item.isExcluded(line.ingredient_id)) return;
        need.set(line.ingredient_id, (need.get(line.ingredient_id) || 0) + line.quantity_used * item.qty);
      });
    });
    return need;
  }
}
