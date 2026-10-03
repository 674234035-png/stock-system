/** Ingredient — วัตถุดิบ/บรรจุภัณฑ์ (tbl_ingredients) */
export class Ingredient {
  static TYPES = { RAW: 'raw_material', PACKAGING: 'packaging' };

  constructor({ ingredient_id, ingredient_name, type, purchase_unit, usage_unit,
                conversion_rate, reorder_point, shelf_life_days }) {
    this.ingredient_id = ingredient_id;
    this.ingredient_name = ingredient_name;
    this.type = type;
    this.purchase_unit = purchase_unit;
    this.usage_unit = usage_unit;
    this.conversion_rate = conversion_rate;
    this.reorder_point = reorder_point;
    this.shelf_life_days = shelf_life_days;
  }

  get isPackaging() { return this.type === Ingredient.TYPES.PACKAGING; }
  get typeLabel()   { return this.isPackaging ? 'บรรจุภัณฑ์' : 'วัตถุดิบ'; }

  /** แปลงจำนวน "หน่วยซื้อ" → "หน่วยใช้งาน" เช่น 2 กระสอบ × 20 = 40 ลูก */
  toUsageUnit(qtyPurchase) { return qtyPurchase * this.conversion_rate; }

  update(data) { Object.assign(this, data); }
}
