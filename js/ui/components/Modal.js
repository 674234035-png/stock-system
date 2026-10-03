import { EventDelegator } from './EventDelegator.js';

/**
 * Modal — หน้าต่างป๊อปอัพ ใช้ร่วมกันทุกโมดูล
 * view ส่ง HTML + handlers มาให้ แล้ว Modal จัดการ event ให้เอง
 */
export class Modal {
  #handlers = {};

  constructor() {
    this.backdrop = document.getElementById('modalBackdrop');
    this.body = document.getElementById('modalBody');

    this.backdrop.addEventListener('click', e => { if (e.target === this.backdrop) this.close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.isOpen) this.close(); });

    EventDelegator.bind(this.body, () => ({ close: () => this.close(), ...this.#handlers }));
  }

  get isOpen() { return this.backdrop.classList.contains('active'); }

  open(html, handlers = {}) {
    this.#handlers = handlers;
    this.body.innerHTML = html;
    this.backdrop.classList.add('active');
  }

  close() {
    this.backdrop.classList.remove('active');
    this.body.innerHTML = '';
    this.#handlers = {};
  }

  /** อ่านค่าจาก input ในป๊อปอัพ */
  value(selector) { return this.body.querySelector(selector)?.value ?? ''; }
}
