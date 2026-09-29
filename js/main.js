/**
 * main.js — จุดเริ่มต้นของโปรแกรม (Entry point)
 */
import { App } from './App.js';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  window.app = app;   // เปิดให้ลองเล่นใน DevTools Console
  app.start();        // ผูกปุ่มต่างๆ
  await app.init();   // โหลดข้อมูล (จาก Google Sheet หรือข้อมูลตัวอย่าง)
});
