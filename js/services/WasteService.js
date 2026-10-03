import { WasteRecord } from '../models/Records.js';
import { ValidationError } from '../core/errors.js';

/** WasteService — บันทึกของเสียและตัดสต็อก (Module 5) */
export class WasteService {
  constructor(db, inventoryService) {
    this.db = db;
    this.inventory = inventoryService;
  }

  get reasons() { return WasteRecord.REASONS; }

  record({ ingredientId, lotId = null, qty, reason, userId }) {
    if (!(qty > 0)) throw new ValidationError('กรุณาระบุจำนวนที่เสีย');

    if (lotId) {
      this.inventory.consumeFromLot(lotId, qty);
    } else {
      if (this.inventory.stockRemaining(ingredientId) + 1e-9 < qty) {
        throw new ValidationError('จำนวนคงเหลือรวมของวัตถุดิบนี้ไม่พอ');
      }
      this.inventory.consume(ingredientId, qty);   // ไม่ระบุล็อต → ตัดแบบ FEFO
    }

    return this.db.wastes.add(new WasteRecord({
      waste_id: this.db.wastes.nextId(),
      ingredient_id: ingredientId,
      lot_id: lotId,
      quantity_wasted: qty,
      reason,
      recorded_by: userId,
      recorded_at: new Date().toISOString(),
    }), { prepend: true });
  }

  recent(limit = 10) { return this.db.wastes.all().slice(0, limit); }
  count() { return this.db.wastes.count(); }

  countByReason() {
    const map = new Map();
    this.db.wastes.all().forEach(w => map.set(w.reason, (map.get(w.reason) || 0) + 1));
    return [...map].map(([reason, count]) => ({ reason, count }));
  }
}
