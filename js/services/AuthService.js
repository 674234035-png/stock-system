import { LoginRecord } from '../models/Records.js';
import { ValidationError } from '../core/errors.js';

/** AuthService — เข้า/ออกระบบ และตรวจสิทธิ์การเข้าถึงโมดูล (Module 1) */
export class AuthService {
  /** โมดูลที่จำกัดสิทธิ์ — โมดูลที่ไม่อยู่ในนี้ทุกคนเข้าได้ */
  static RULES = {
    master: { allow: ['owner'],    message: 'เฉพาะเจ้าของร้านเท่านั้นที่เข้าถึงส่วนนี้ได้' },
    sales:  { allow: ['employee'], message: 'ส่วนนี้สำหรับพนักงานเท่านั้น' },
    waste:  { allow: ['employee'], message: 'ส่วนนี้สำหรับพนักงานเท่านั้น' },
  };

  constructor(db) {
    this.db = db;
    this.currentUser = null;
  }

  get isLoggedIn() { return this.currentUser !== null; }

  login(username, password) {
    const user = this.db.users.first(u => u.username === username && u.checkPassword(password));
    if (!user) throw new ValidationError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    if (!user.isActive) throw new ValidationError('บัญชีนี้ถูกปิดการใช้งาน');

    this.currentUser = user;
    this.db.logins.add(new LoginRecord({
      log_id: this.db.logins.nextId(),
      user_id: user.user_id,
      login_time: new Date().toISOString(),
    }), { prepend: true });
    return user;
  }

  logout() {
    if (!this.currentUser) return;
    const open = this.db.logins.first(l => l.user_id === this.currentUser.user_id && l.isOpen);
    if (open) open.close();
    this.currentUser = null;
  }

  canAccess(module) {
    const rule = AuthService.RULES[module];
    return !rule || (this.isLoggedIn && rule.allow.includes(this.currentUser.role));
  }

  denyMessage(module) { return AuthService.RULES[module]?.message ?? ''; }
}
