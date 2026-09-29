/** User — ผู้ใช้งานระบบ (tbl_users) */
export class User {
  static ROLES = { OWNER: 'owner', EMPLOYEE: 'employee' };

  #password;  // private: ภายนอกอ่านรหัสผ่านตรงๆ ไม่ได้

  constructor({ user_id, username, password, full_name, role, status = 'active', created_at }) {
    this.user_id = user_id;
    this.username = username;
    this.#password = String(password);   // บังคับเป็นข้อความเสมอ (Sheet อาจส่งมาเป็นตัวเลข)
    this.full_name = full_name;
    this.role = role;
    this.status = status;
    this.created_at = created_at;
  }

  get isOwner()   { return this.role === User.ROLES.OWNER; }
  get isActive()  { return this.status === 'active'; }
  get roleLabel() { return this.isOwner ? 'เจ้าของร้าน' : 'พนักงาน'; }
  get initial()   { return this.full_name.slice(0, 1); }

  /** ตรวจรหัสผ่าน (ระบบจริงต้องเก็บเป็น hash เช่น bcrypt) */
  checkPassword(input) { return this.#password === String(input); }

  /**
   * JSON.stringify / การบันทึกลง Google Sheet จะเรียก method นี้
   * ต้องเขียนเองเพราะ private field (#password) จะไม่ถูกคัดลอกออกมาอัตโนมัติ
   */
  toJSON() {
    return {
      user_id: this.user_id, username: this.username, password: this.#password,
      full_name: this.full_name, role: this.role, status: this.status, created_at: this.created_at,
    };
  }
}
