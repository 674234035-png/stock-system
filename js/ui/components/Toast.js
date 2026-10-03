export class Toast {
  static DURATION = 3200;

  static show(message, kind = 'info') {
    const el = document.createElement('div');
    el.className = 'toast' + (kind !== 'info' ? ' ' + kind : '');
    el.setAttribute('role', 'status');
    el.textContent = message;
    document.getElementById('toastStack').appendChild(el);
    setTimeout(() => el.remove(), Toast.DURATION);
  }

  static success(message) { Toast.show(message, 'success'); }
  static error(message)   { Toast.show(message, 'danger'); }
}