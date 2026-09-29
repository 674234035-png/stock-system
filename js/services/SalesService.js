import { Sale, SaleDetail } from '../models/Records.js';
import { CartItem } from '../models/Cart.js';
import { ValidationError, InsufficientStockError } from '../core/errors.js';
import { DateUtil } from '../utils/DateUtil.js';

/** SalesService — ขายสินค้า + ตัดสต็อกอัตโนมัติตามสูตร (Module 4) */
export class SalesService {
  /**
   * Dependency Injection: รับ service อื่นเข้ามาทาง constructor
   * แทนที่จะไปสร้างเองข้างใน — ทำให้ทดสอบ/เปลี่ยนแทนได้ง่าย
   */
  constructor(db, menuService, inventoryService) {
    this.db = db;
    this.menus = menuService;
    this.inventory = inventoryService;
  }

  shortagesFor(items) {
    return this.inventory.shortages(this.menus.requirementOf(items));
  }

  /** เมนูนี้ขายได้ไหม เมื่อรวมกับของที่อยู่ในตะกร้าแล้ว */
  menuAvailability(menuId, cartItems = []) {
    if (!this.menus.recipeOf(menuId).length) return { ok: false, reason: 'ยังไม่ได้ตั้งสูตรเมนู' };
    const enough = this.shortagesFor([...cartItems, new CartItem(menuId, 1)]).length === 0;
    return { ok: true, reason: enough ? '' : 'วัตถุดิบบางรายการไม่พอ' };
  }

  /**
   * ปิดบิล: ตรวจสต็อกทั้งบิลก่อน (ถ้าไม่พอยกเลิกทั้งบิล) แล้วค่อยตัดจริง
   * @param {CartItem[]} items
   */
  checkout(items, userId, saleDateTime = new Date().toISOString()) {
    if (!items.length) throw new ValidationError('ยังไม่มีรายการในตะกร้า');

    const short = this.shortagesFor(items);
    if (short.length) throw new InsufficientStockError(short);

    // 1) ตัดสต็อก
    const movements = [];
    this.menus.requirementOf(items).forEach((qty, ingredientId) => {
      movements.push(...this.inventory.consume(ingredientId, qty));
    });

    // 2) บันทึกหัวบิล + รายการ
    const total = items.reduce((s, i) => s + this.menus.priceOf(i.menu_id) * i.qty, 0);
    const sale = this.db.sales.add(new Sale({
      sale_id: this.db.sales.nextId(), user_id: userId, sale_datetime: saleDateTime, total_amount: total,
    }), { prepend: true });

    items.forEach(i => this.db.saleDetails.add(new SaleDetail({
      sales_detail_id: this.db.saleDetails.nextId(),
      sale_id: sale.sale_id,
      menu_id: i.menu_id,
      quantity: i.qty,
      subtotal: this.menus.priceOf(i.menu_id) * i.qty,
      excluded_ingredients: [...i.excluded],
    })));

    // 3) สรุปวัตถุดิบที่ "ไม่ถูกตัด" เพราะลูกค้าไม่ใส่
    const saved = new Map();
    items.forEach(i => i.excluded.forEach(id => {
      const line = this.menus.recipeOf(i.menu_id).find(l => l.ingredient_id === id);
      if (line) saved.set(id, (saved.get(id) || 0) + line.quantity_used * i.qty);
    }));

    return { sale, movements, saved };
  }

  // ---------- query สำหรับหน้าจอ/รายงาน ----------
  allSales() { return this.db.sales.all(); }
  allDetails() { return this.db.saleDetails.all(); }

  recent(limit = 10) {
    return this.allSales().sort((a, b) => b.sale_datetime.localeCompare(a.sale_datetime)).slice(0, limit);
  }

  detailsOf(saleId) { return this.db.saleDetails.where(d => d.sale_id === saleId); }
  todaySales() { return this.db.sales.where(s => DateUtil.isToday(s.sale_datetime)); }

  cupsOf(sales) {
    const ids = new Set(sales.map(s => s.sale_id));
    return this.db.saleDetails.where(d => ids.has(d.sale_id)).reduce((s, d) => s + d.quantity, 0);
  }

  /** จำนวนแก้วแยกตามเมนู เรียงมาก → น้อย */
  menuMix(sales) {
    const ids = new Set(sales.map(s => s.sale_id));
    const map = new Map();
    this.db.saleDetails.where(d => ids.has(d.sale_id))
      .forEach(d => map.set(d.menu_id, (map.get(d.menu_id) || 0) + d.quantity));
    return [...map].map(([menu_id, qty]) => ({ menu_id, qty })).sort((a, b) => b.qty - a.qty);
  }
}
