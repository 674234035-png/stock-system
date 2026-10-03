/**
 * SheetSerializer — แปลงข้อมูลไป-กลับระหว่าง object ใน JavaScript กับตารางใน Google Sheet
 *   object  →  { headers: ['menu_id', ...], rows: [['1', ...], ...] }  (ทุกช่องเป็นข้อความ)
 *   และแปลงกลับ พร้อมคืนชนิดข้อมูล (ตัวเลข, array, null)
 */
export class SheetSerializer {
  /** คอลัมน์ที่ต้องเป็นข้อความเสมอ แม้หน้าตาเหมือนตัวเลข (เช่นรหัสผ่าน '0123') */
  static TEXT_FIELDS = new Set([
    'username', 'password', 'full_name', 'menu_name', 'category', 'ingredient_name',
    'purchase_unit', 'usage_unit', 'reason', 'status', 'role', 'type',
  ]);

  static toTable(entities) {
    const plain = entities.map(e => (typeof e.toJSON === 'function' ? e.toJSON() : { ...e }));
    if (!plain.length) return { headers: [], rows: [] };
    const headers = Object.keys(plain[0]);
    return { headers, rows: plain.map(obj => headers.map(h => SheetSerializer.toCell(obj[h]))) };
  }

  static toCell(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);   // array เช่น excluded_ingredients
    return String(value);
  }

  static fromTable({ headers = [], rows = [] }) {
    return rows
      .filter(row => row.some(cell => cell !== ''))                  // ข้ามแถวว่าง
      .map(row => Object.fromEntries(headers.map((h, i) => [h, SheetSerializer.fromCell(row[i], h)])));
  }

  static fromCell(cell, field) {
    if (cell === '' || cell === null || cell === undefined) return null;
    const text = String(cell);
    if (SheetSerializer.TEXT_FIELDS.has(field)) return text;
    if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
    if (/^[[{]/.test(text)) {
      try { return JSON.parse(text); } catch { /* ไม่ใช่ JSON ก็คืนเป็นข้อความ */ }
    }
    return text;
  }
}
