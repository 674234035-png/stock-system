import { SheetSerializer } from './SheetSerializer.js';

/**
 * SheetSync — ประสานงานระหว่าง Database (ในหน่วยความจำ) กับ Google Sheet
 *
 * หลักการ: โหลดทั้งหมดครั้งเดียวตอนเปิดแอป → ทำงานในหน่วยความจำ (เร็ว)
 *          → เมื่อข้อมูลเปลี่ยน รอ 1 วินาทีแล้วบันทึกทุกตารางกลับไป
 *          (ถ้ามีการเปลี่ยนติดๆ กันหลายครั้ง จะรวมเป็นการบันทึกครั้งเดียว = debounce)
 */
export class SheetSync {
  static DEBOUNCE_MS = 1000;

  #timer = null;
  #saving = false;
  #again = false;

  /**
   * @param {import('./Database.js').Database} db
   * @param {import('./SheetApi.js').SheetApi} api
   * @param {(state:'pending'|'saving'|'saved'|'error', message?:string) => void} onStatus
   */
  constructor(db, api, onStatus = () => {}) {
    this.db = db;
    this.api = api;
    this.onStatus = onStatus;
  }

  /** มีงานค้างที่ยังไม่ได้บันทึกหรือไม่ */
  get isBusy() { return this.#timer !== null || this.#saving; }

  /** โหลดข้อมูลจาก Sheet — คืน true ถ้ามีข้อมูลอยู่แล้ว, false ถ้า Sheet ยังว่าง */
  async load() {
    const data = await this.api.loadAll();
    let hasData = false;
    Object.entries(this.db.repositories).forEach(([name, repo]) => {
      const rows = SheetSerializer.fromTable(data[name] || {});
      if (rows.length) hasData = true;
      repo.load(rows);
    });
    return hasData;
  }

  /** เรียกทุกครั้งที่ข้อมูลเปลี่ยน */
  schedule() {
    clearTimeout(this.#timer);
    this.onStatus('pending');
    this.#timer = setTimeout(() => { this.#timer = null; this.saveNow(); }, SheetSync.DEBOUNCE_MS);
  }

  async saveNow() {
    if (this.#saving) { this.#again = true; return; }   // กำลังบันทึกอยู่ → รอบันทึกซ้ำอีกรอบหลังเสร็จ
    this.#saving = true;
    this.onStatus('saving');
    try {
      const tables = {};
      Object.entries(this.db.repositories).forEach(([name, repo]) => { tables[name] = SheetSerializer.toTable(repo.all()); });
      await this.api.saveAll(tables);
      this.onStatus('saved');
    } catch (err) {
      console.error(err);
      this.onStatus('error', err.message);
    } finally {
      this.#saving = false;
      if (this.#again) { this.#again = false; this.saveNow(); }
    }
  }
}
