import { BaseView } from './BaseView.js';
import { Widgets as W } from '../components/Widgets.js';
import { Formatter as F } from '../../utils/Formatter.js';

/** LoginHistoryView — ประวัติการเข้า/ออกระบบ (Module 1) */
export class LoginHistoryView extends BaseView {
  constructor(app) { super(app, 'panel-users'); }

  render() {
    const rows = this.s.users.loginHistory();
    this.setHTML('#loginHistoryBody', rows.length ? rows.map(l => {
      const u = this.s.users.get(l.user_id);
      return `<tr>
        <td>${F.escape(u?.full_name ?? '—')}</td>
        <td><span class="tag ${u?.isOwner ? 'ok' : 'muted'}">${u?.roleLabel ?? '—'}</span></td>
        <td>${F.dateTime(l.login_time)}</td>
        <td>${l.logout_time ? F.dateTime(l.logout_time) : '<span class="tag warn">ยังไม่ออกจากระบบ</span>'}</td>
      </tr>`;
    }).join('') : W.emptyRow(4, 'ไม่มีประวัติ'));
  }
}
