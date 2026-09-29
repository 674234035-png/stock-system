/**
 * SheetApi — คุยกับ Google Apps Script Web App ผ่าน HTTP
 * รู้แค่เรื่อง "ส่ง/รับ" ข้อมูล ไม่รู้จัก Model หรือ Repository
 */
export class SheetApi {
  constructor(url, apiKey) {
    this.url = url;
    this.apiKey = apiKey;
  }

  /** ดึงข้อมูลทุกแท็บ → { users: {headers, rows}, menus: {...}, ... } */
  async loadAll() {
    const res = await fetch(`${this.url}?key=${encodeURIComponent(this.apiKey)}`);
    return this.#unwrap(res).then(json => json.data);
  }

  /** เขียนทับข้อมูลทุกแท็บที่ส่งไป */
  async saveAll(tables) {
    const res = await fetch(this.url, {
      method: 'POST',
      // ต้องใช้ text/plain เพราะ Apps Script ไม่รองรับ CORS preflight ของ application/json
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key: this.apiKey, tables }),
    });
    return this.#unwrap(res);
  }

  async #unwrap(res) {
    if (!res.ok) throw new Error(`เชื่อมต่อ Google Sheet ไม่ได้ (HTTP ${res.status})`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Google Sheet ตอบกลับผิดพลาด');
    return json;
  }
}
