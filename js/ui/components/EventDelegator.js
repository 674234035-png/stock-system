/**
 * EventDelegator — ผูก event ครั้งเดียวที่ element แม่ แล้วแยกงานตาม data-action
 *
 *   <button data-action="save">          → เรียก handlers.save(el, event) ตอน click
 *   <select data-action="pick">          → เรียกตอน change
 *   <input  data-action="find" data-on="input"> → เรียกทุกครั้งที่พิมพ์
 *
 * ข้อดี: HTML ที่สร้างใหม่ด้วย innerHTML ก็ยังทำงาน ไม่ต้องผูก event ซ้ำ
 * และไม่ต้องใช้ onclick="..." ซึ่งใช้กับ ES Module ไม่ได้
 */
export class EventDelegator {
  static EVENTS = ['click', 'change', 'input'];

  /** @param {() => Record<string, Function>} getHandlers */
  static bind(root, getHandlers) {
    EventDelegator.EVENTS.forEach(type => {
      root.addEventListener(type, event => {
        const el = event.target.closest('[data-action]');
        if (!el || !root.contains(el)) return;

        const isField = el.matches('input, select, textarea');
        const expected = el.dataset.on || (isField ? 'change' : 'click');
        if (expected !== type) return;

        const handler = getHandlers()[el.dataset.action];
        if (handler) handler(el, event);
      });
    });
  }
}
