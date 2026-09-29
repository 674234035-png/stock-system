/**
 * config.js — ค่าตั้งค่าของระบบ
 * แก้ไฟล์นี้ไฟล์เดียวเพื่อเปิด/ปิดการเชื่อมต่อ Google Sheet
 */
export const CONFIG = {
  // true = อ่าน/บันทึกข้อมูลกับ Google Sheet, false = เก็บในหน่วยความจำอย่างเดียว (แบบเดิม)
  USE_GOOGLE_SHEET: true,

  // URL ของ Web App ที่ได้จาก Apps Script (ลงท้ายด้วย /exec)
  SHEET_API_URL: 'https://script.google.com/macros/s/AKfycbz2taXnZy568zyfy0gRVCuTy5lgQ0PFxD20UtqxJjbwbop6HWeAmp9el6j7ADQaIFd3/exec',

  // ต้องตรงกับ API_KEY ในไฟล์ Code.gs
  API_KEY: 'mprw-2026-x7Kq9',
};
