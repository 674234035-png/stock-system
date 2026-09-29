import { DateUtil } from '../utils/DateUtil.js';

/** StockLot — ล็อตสินค้า 1 ล็อต มีวันหมดอายุของตัวเอง (tbl_stock_lot) */
export class StockLot {
  static NEAR_EXPIRY_DAYS = 5;

  constructor({ lot_id, ingredient_id, quantity_remaining, received_date, expire_date }) {
    this.lot_id = lot_id;
    this.ingredient_id = ingredient_id;
    this.quantity_remaining = quantity_remaining;
    this.received_date = received_date;
    this.expire_date = expire_date;
  }

  get daysLeft() { return DateUtil.daysUntil(this.expire_date); }
  get isEmpty()  { return this.quantity_remaining <= 0; }

  /** สถานะของล็อต: empty | expired | near | ok */
  get status() {
    if (this.isEmpty) return 'empty';
    if (this.daysLeft < 0) return 'expired';
    if (this.daysLeft <= StockLot.NEAR_EXPIRY_DAYS) return 'near';
    return 'ok';
  }

  /** ตัดของออกจากล็อตนี้ได้ไม่เกินที่มี — คืนค่าจำนวนที่ตัดได้จริง */
  take(qty) {
    const taken = Math.min(this.quantity_remaining, qty);
    this.quantity_remaining = +(this.quantity_remaining - taken).toFixed(4);
    return taken;
  }

  /** เรียงแบบ FEFO (First Expired, First Out) — ล็อตที่หมดอายุก่อนใช้ก่อน */
  static compareFEFO(a, b) { return a.expire_date.localeCompare(b.expire_date); }
}
