/** UserService — ค้นหาข้อมูลผู้ใช้ และประวัติการเข้าใช้งาน */
export class UserService {
  constructor(db) { this.db = db; }

  get(id)    { return this.db.users.getById(id); }
  nameOf(id) { return this.get(id)?.full_name ?? '—'; }
  loginHistory() { return this.db.logins.all(); }
}
