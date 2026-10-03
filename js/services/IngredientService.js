import { Ingredient } from '../models/Ingredient.js';
import { ValidationError } from '../core/errors.js';

/** IngredientService — จัดการข้อมูลหลักวัตถุดิบ/บรรจุภัณฑ์ (Module 2) */
export class IngredientService {
  constructor(db) { this.db = db; }

  all() { return this.db.ingredients.all(); }
  get(id) { return this.db.ingredients.getById(id); }
  nameOf(id) { return this.get(id)?.ingredient_name ?? '—'; }

  search(query = '') {
    const q = query.trim().toLowerCase();
    return this.db.ingredients.where(i => i.ingredient_name.toLowerCase().includes(q));
  }

  /** id = null → เพิ่มใหม่, มี id → แก้ไข */
  save(id, data) {
    if (!data.ingredient_name) throw new ValidationError('กรุณาระบุชื่อวัตถุดิบ');
    if (!(data.conversion_rate > 0)) throw new ValidationError('อัตราแปลงต้องมากกว่า 0');

    if (id) {
      const ing = this.get(id);
      ing.update(data);
      return ing;
    }
    return this.db.ingredients.add(new Ingredient({ ingredient_id: this.db.ingredients.nextId(), ...data }));
  }

  delete(id) {
    if (this.db.recipes.some(r => r.ingredient_id === id)) {
      throw new ValidationError('ลบไม่ได้ — มีการใช้ในสูตรเมนูอยู่');
    }
    this.db.ingredients.removeWhere(i => i.ingredient_id === id);
    this.db.lots.removeWhere(l => l.ingredient_id === id);
  }
}
