/** Toast — ข้อความแจ้งเตือนมุมขวาบน หายไปเองใน 3.2 วินาที */
export class Toast {
  static DURATION = 3200;

  static show(message, kind = 'info') {
    const el = document.createElement('div');
    el.className = 'toast' + (kind === 'danger' ? ' danger' : '');
    el.setAttribute('role', 'status');
    el.textContent = message;               // textContent ปลอดภัยจาก XSS
    document.getElementById('toastStack').appendChild(el);
    setTimeout(() => el.remove(), Toast.DURATION);
  }

  static error(message) { Toast.show(message, 'danger'); }
}
