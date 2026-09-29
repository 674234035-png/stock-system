import { StockLot } from '../models/StockLot.js';
import { ReceivingRecord } from '../models/Records.js';
import { ValidationError, InsufficientStockError } from '../core/errors.js';

/**
 * InventoryService — หัวใจของระบบสต็อก: รับเข้า, ตัดสต็อกแบบ FEFO,
 * คำนวณคงเหลือ, แจ้งเตือนใกล้หมด/ใกล้หมดอายุ (Module 3 + ส่วนหนึ่งของ 6)
 */
export class InventoryService {
  constructor(db) { this.db = db; }

  /** ล็อตของวัตถุดิบ เรียงตาม FEFO */
  lotsOf(ingredientId, { availableOnly = true } = {}) {
    return this.db.lots
      .where(l => l.ingredient_id === ingredientId && (!availableOnly || !l.isEmpty))
      .sort(StockLot.compareFEFO);
  }

  allLots() { return this.db.lots.all().sort(StockLot.compareFEFO); }
  getLot(id) { return this.db.lots.getById(id); }

  stockRemaining(ingredientId) {
    return this.lotsOf(ingredientId, { availableOnly: false })
      .reduce((sum, l) => sum + l.quantity_remaining, 0);
  }

  /** รับของเข้าสต็อก: แปลงหน่วย → สร้างล็อตใหม่ → บันทึกประวัติรับเข้า */
  receive({ ingredient, qtyPurchase, receivedDate, expireDate, userId, receivedAt = new Date().toISOString() }) {
    if (!ingredient) throw new ValidationError('กรุณาเลือกวัตถุดิบ');
    if (!(qtyPurchase > 0)) throw new ValidationError('กรุณาระบุจำนวนที่รับเข้า');
    if (!receivedDate || !expireDate) throw new ValidationError('กรุณาระบุวันที่รับเข้าและวันหมดอายุ');
    if (expireDate < receivedDate) throw new ValidationError('วันหมดอายุต้องไม่ก่อนวันที่รับเข้า');

    const converted = ingredient.toUsageUnit(qtyPurchase);
    const lot = this.db.lots.add(new StockLot({
      lot_id: this.db.lots.nextId(),
      ingredient_id: ingredient.ingredient_id,
      quantity_remaining: converted,
      received_date: receivedDate,
      expire_date: expireDate,
    }));
    this.db.receivings.add(new ReceivingRecord({
      receiving_id: this.db.receivings.nextId(),
      lot_id: lot.lot_id,
      received_qty_purchase_unit: qtyPurchase,
      received_qty_usage_unit: converted,
      received_by: userId,
      received_at: receivedAt,
    }), { prepend: true });
    return { lot, converted };
  }

  receivingHistory(limit = 8) { return this.db.receivings.all().slice(0, limit); }

  /** ตรวจว่าวัตถุดิบพอไหม — คืนรายการที่ขาด (ว่าง = พอทั้งหมด) */
  shortages(needMap) {
    const result = [];
    needMap.forEach((need, id) => {
      const have = this.stockRemaining(id);
      if (have + 1e-9 < need) result.push({ id, need, have });
    });
    return result;
  }

  /**
   * ตัดสต็อกแบบ FEFO ข้ามหลายล็อต
   * @returns {{ingredient_id:number, lot_id:number, qty:number, left:number}[]} รายการที่ตัดแต่ละล็อต
   */
  consume(ingredientId, qty) {
    const have = this.stockRemaining(ingredientId);
    if (have + 1e-9 < qty) throw new InsufficientStockError([{ id: ingredientId, need: qty, have }]);

    const movements = [];
    let remaining = qty;
    for (const lot of this.lotsOf(ingredientId)) {
      if (remaining <= 1e-9) break;
      const taken = lot.take(remaining);
      remaining -= taken;
      movements.push({ ingredient_id: ingredientId, lot_id: lot.lot_id, qty: taken, left: lot.quantity_remaining });
    }
    return movements;
  }

  /** ตัดจากล็อตที่ระบุโดยตรง */
  consumeFromLot(lotId, qty) {
    const lot = this.getLot(lotId);
    if (!lot || lot.quantity_remaining + 1e-9 < qty) throw new ValidationError('จำนวนในล็อตไม่พอ');
    lot.take(qty);
    return lot;
  }

  /** ระดับสต็อกทุกวัตถุดิบ */
  stockLevels() {
    return this.db.ingredients.all().map(ingredient => ({ ingredient, remaining: this.stockRemaining(ingredient.ingredient_id) }));
  }

  lowStockList() {
    return this.stockLevels().filter(s => s.remaining <= s.ingredient.reorder_point);
  }

  expiringLots(days = 7) {
    return this.db.lots.where(l => !l.isEmpty && l.daysLeft <= days).sort(StockLot.compareFEFO);
  }
}
