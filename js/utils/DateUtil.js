/**
 * DateUtil — จัดการวันที่แบบ "เวลาท้องถิ่น"
 * (โค้ดเดิมใช้ toISOString() ซึ่งเป็นเวลา UTC ทำให้ในไทย (UTC+7)
 *  ช่วงตี 0–7 โมงเช้า วันที่จะเพี้ยนย้อนไป 1 วัน — คลาสนี้แก้ปัญหานั้น)
 */
export class DateUtil {
  /** Date → 'YYYY-MM-DD' ตามเวลาเครื่อง */
  static toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** วันนี้ (+/- จำนวนวัน) ในรูป 'YYYY-MM-DD' */
  static today(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return DateUtil.toISODate(d);
  }

  static addDays(isoDate, days) {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return DateUtil.toISODate(d);
  }

  /** นับจำนวนวันจากวันนี้ถึงวันที่กำหนด (ติดลบ = เลยมาแล้ว) */
  static daysUntil(isoDate) {
    const target = new Date(isoDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  static isToday(isoDateTime) {
    return DateUtil.toISODate(new Date(isoDateTime)) === DateUtil.today();
  }

  /** สร้างเวลา ISO ของวันที่ (วันนี้ + offset) เวลา h:m */
  static at(offsetDays, hours, minutes) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }
}
