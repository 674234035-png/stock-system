/**
 * Custom Error classes — ตัวอย่างการสืบทอด (Inheritance) จาก Error
 * ทำให้ฝั่ง UI แยกได้ว่า error ชนิดไหน และดึงข้อมูลเพิ่มเติมได้
 */
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InsufficientStockError extends Error {
  /** @param {{id:number, need:number, have:number}[]} shortages */
  constructor(shortages, message = 'วัตถุดิบไม่เพียงพอ') {
    super(message);
    this.name = 'InsufficientStockError';
    this.shortages = shortages;
  }
}
