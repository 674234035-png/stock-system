/**
 * Repository — ตัวแทน "ตาราง" หนึ่งตารางในฐานข้อมูล
 * ห่อหุ้ม (Encapsulation) array ของข้อมูลไว้ข้างใน และเปิดให้ใช้ผ่าน method เท่านั้น
 * ถ้าวันหนึ่งเปลี่ยนไปใช้ฐานข้อมูลจริง (เช่น API/MySQL) ก็แก้แค่คลาสนี้ที่เดียว
 */
export class Repository {
  #rows = [];     // # = private field เข้าถึงจากนอกคลาสไม่ได้
  #lastId = 0;

  /**
   * @param {string} idField      ชื่อคอลัมน์ Primary Key เช่น 'menu_id'
   * @param {Function} EntityClass คลาสของข้อมูลในตารางนี้ เช่น Menu — ใช้ตอนแปลงข้อมูลจาก Google Sheet กลับเป็น object
   */
  constructor(idField, EntityClass) {
    this.idField = idField;
    this.EntityClass = EntityClass;
  }

  /** แทนที่ข้อมูลทั้งตารางด้วยข้อมูลที่โหลดมา (plain object) แล้วตั้งเลข id ถัดไปให้ต่อจากค่าสูงสุด */
  load(plainRows) {
    this.#rows = plainRows.map(row => new this.EntityClass(row));
    this.#lastId = this.#rows.reduce((max, r) => Math.max(max, Number(r[this.idField]) || 0), 0);
  }

  nextId() { return ++this.#lastId; }

  add(entity, { prepend = false } = {}) {
    prepend ? this.#rows.unshift(entity) : this.#rows.push(entity);
    return entity;
  }

  getById(id) { return this.#rows.find(r => r[this.idField] === id) || null; }
  all() { return [...this.#rows]; }                 // คืนสำเนา กันการแก้ array ตรงๆ
  where(predicate) { return this.#rows.filter(predicate); }
  first(predicate) { return this.#rows.find(predicate) || null; }
  some(predicate) { return this.#rows.some(predicate); }
  count() { return this.#rows.length; }

  removeWhere(predicate) {
    const before = this.#rows.length;
    this.#rows = this.#rows.filter(r => !predicate(r));
    return before - this.#rows.length;
  }
}
