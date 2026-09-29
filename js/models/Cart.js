/**
 * CartItem — สินค้า 1 รายการในตะกร้า (เมนู + จำนวน + วัตถุดิบที่ไม่ใส่)
 * รายการที่เป็นเมนูเดียวกันแต่ "ไม่ใส่" ต่างกัน จะถือเป็นคนละรายการ (key ต่างกัน)
 */
export class CartItem {
  constructor(menu_id, qty = 1, excluded = []) {
    this.menu_id = menu_id;
    this.qty = qty;
    this.excluded = [...excluded].sort((a, b) => a - b);
  }

  get key() { return `${this.menu_id}|${this.excluded.join(',')}`; }

  isExcluded(ingredientId) { return this.excluded.includes(ingredientId); }
  withQty(qty) { return new CartItem(this.menu_id, qty, this.excluded); }
}

/** Cart — ตะกร้าขายสินค้าในหน้าขาย (อยู่แค่ในหน่วยความจำ ยังไม่ใช่ข้อมูลในฐานข้อมูล) */
export class Cart {
  #items = [];

  get items()   { return [...this.#items]; }
  get isEmpty() { return this.#items.length === 0; }

  find(key) { return this.#items.find(i => i.key === key) || null; }

  /** รายการอื่นๆ ยกเว้น key ที่ระบุ — ใช้ตอนตรวจสต็อกขณะแก้ไขรายการ */
  itemsExcept(key) { return this.#items.filter(i => i.key !== key); }

  /** เพิ่มรายการ (ถ้ามี key เดียวกันอยู่แล้วให้รวมจำนวน) / replaceKey = รายการเดิมที่กำลังแก้ไข */
  upsert(item, replaceKey = null) {
    const others = this.itemsExcept(replaceKey);
    const same = others.find(i => i.key === item.key);
    if (same) same.qty += item.qty;
    else others.push(item);
    this.#items = others;
  }

  /** จำลองผลลัพธ์ถ้าเปลี่ยนจำนวน (ยังไม่แก้จริง) */
  previewQty(key, qty) {
    return this.#items.map(i => (i.key === key ? i.withQty(qty) : i));
  }

  setQty(key, qty) {
    if (qty <= 0) { this.#items = this.itemsExcept(key); return; }
    const item = this.find(key);
    if (item) item.qty = qty;
  }

  clear() { this.#items = []; }

  total(priceOf) { return this.#items.reduce((sum, i) => sum + priceOf(i.menu_id) * i.qty, 0); }
}
