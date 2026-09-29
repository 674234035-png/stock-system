import { EventDelegator } from '../components/EventDelegator.js';

/**
 * BaseView — คลาสแม่ (Abstract class) ของทุกหน้าจอ
 * ลูกทุกตัว "สืบทอด" (extends) และเขียนทับ (override) 2 method:
 *   - actions() : คืน object ของ handler ตาม data-action
 *   - render()  : วาดหน้าจอใหม่จากข้อมูลปัจจุบัน
 */
export class BaseView {
  /** @param {import('../../App.js').App} app */
  constructor(app, panelId) {
    if (new.target === BaseView) throw new Error('BaseView เป็นคลาสแม่ ห้าม new โดยตรง');
    this.app = app;
    this.panel = document.getElementById(panelId);
    EventDelegator.bind(this.panel, () => this.actions());
  }

  // ทางลัดที่ลูกทุกตัวใช้ร่วมกัน
  get s()     { return this.app.services; }
  get modal() { return this.app.modal; }
  get user()  { return this.app.services.auth.currentUser; }

  $(selector) { return this.panel.querySelector(selector); }
  val(selector) { return this.$(selector)?.value ?? ''; }
  setHTML(selector, html) { this.$(selector).innerHTML = html; }

  actions() { return {}; }                                   // ให้ลูก override
  render()  { throw new Error(`${this.constructor.name} ต้องเขียน render()`); }

  /** แจ้ง App ว่าข้อมูลเปลี่ยน → อัปเดตป้ายแจ้งเตือน และสั่งบันทึกลง Google Sheet */
  notifyDataChanged() { this.app.onDataChanged(); }
}
