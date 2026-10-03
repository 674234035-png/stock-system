/**
 * Records — คลาสของ "บันทึกเหตุการณ์" ต่างๆ ที่เพิ่มอย่างเดียว ไม่ค่อยแก้ไข
 * รวมไว้ไฟล์เดียวเพราะเป็นคลาสเล็กๆ ที่ใช้เก็บข้อมูลเป็นหลัก
 */

/** tbl_sales — หัวบิล */
export class Sale {
  constructor({ sale_id, user_id, sale_datetime, total_amount }) {
    Object.assign(this, { sale_id, user_id, sale_datetime, total_amount });
  }
}

/** tbl_sales_detail — รายการในบิล */
export class SaleDetail {
  constructor({ sales_detail_id, sale_id, menu_id, quantity, subtotal, excluded_ingredients = [] }) {
    Object.assign(this, { sales_detail_id, sale_id, menu_id, quantity, subtotal, excluded_ingredients });
  }
}

/** tbl_receiving_history — ประวัติรับของเข้า */
export class ReceivingRecord {
  constructor({ receiving_id, lot_id, received_qty_purchase_unit, received_qty_usage_unit, received_by, received_at }) {
    Object.assign(this, { receiving_id, lot_id, received_qty_purchase_unit, received_qty_usage_unit, received_by, received_at });
  }
}

/** tbl_waste_record — บันทึกของเสีย */
export class WasteRecord {
  static REASONS = ['หมดอายุ', 'ทำตก/เสียหาย', 'คุณภาพไม่ผ่าน', 'ปนเปื้อน', 'ลูกค้าคืนสินค้า', 'อื่นๆ'];

  constructor({ waste_id, ingredient_id, lot_id, quantity_wasted, reason, recorded_by, recorded_at }) {
    Object.assign(this, { waste_id, ingredient_id, lot_id, quantity_wasted, reason, recorded_by, recorded_at });
  }
}

/** tbl_login_history — ประวัติเข้า/ออกระบบ */
export class LoginRecord {
  constructor({ log_id, user_id, login_time, logout_time = null }) {
    Object.assign(this, { log_id, user_id, login_time, logout_time });
  }

  get isOpen() { return !this.logout_time; }
  close() { this.logout_time = new Date().toISOString(); }
}
