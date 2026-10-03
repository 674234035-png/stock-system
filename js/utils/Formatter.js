/**
 * Formatter — รวมฟังก์ชันจัดรูปแบบตัวเลข/เงิน/วันที่ และป้องกัน XSS
 * ใช้เป็น static method (ไม่ต้อง new) เพราะไม่มี state ภายใน
 */
export class Formatter {
  static number(n) {
    return Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  static money(n) {
    return '฿' + Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  static dateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) + ' ' +
           d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }

  /** แปลงอักขระพิเศษก่อนแทรกลง innerHTML — กันชื่อเมนูอย่าง <script> ทำลายหน้าเว็บ */
  static escape(value) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(value ?? '').replace(/[&<>"']/g, ch => map[ch]);
  }
}
