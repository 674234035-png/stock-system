import { CONFIG } from './config.js';
import { ServiceContainer } from './core/ServiceContainer.js';
import { SheetApi } from './core/SheetApi.js';
import { SheetSync } from './core/SheetSync.js';
import { seedDatabase } from './data/seed.js';
import { Modal } from './ui/components/Modal.js';
import { Toast } from './ui/components/Toast.js';
import { Icons } from './ui/components/Icons.js';
import { DashboardView } from './ui/views/DashboardView.js';
import { MasterDataView } from './ui/views/MasterDataView.js';
import { StockInView } from './ui/views/StockInView.js';
import { SalesView } from './ui/views/SalesView.js';
import { WasteView } from './ui/views/WasteView.js';
import { ReportsView } from './ui/views/ReportsView.js';
import { LoginHistoryView } from './ui/views/LoginHistoryView.js';

/**
 * App — ตัวควบคุมหลัก (Controller) ของทั้งแอป
 * หน้าที่: สร้างทุกอย่าง, จัดการ login/logout, สลับหน้า (routing), อัปเดตแถบบน
 */
export class App {
  static MODULES = {
    dashboard: { title: 'ภาพรวม',              desc: 'สรุปสถานะร้านวันนี้' },
    master:    { title: 'ข้อมูลหลัก',          desc: 'จัดการเมนู วัตถุดิบ และสูตรเมนู (Module 2)' },
    stockin:   { title: 'รับสินค้าเข้าสต็อก',   desc: 'บันทึกวัตถุดิบที่รับเข้า พร้อมแปลงหน่วย (Module 3)' },
    sales:     { title: 'บันทึกการขาย',        desc: 'ขายเมนู ระบบตัดสต็อกอัตโนมัติตามสูตร (Module 4)' },
    waste:     { title: 'ของเสียและตัดสต็อก',   desc: 'บันทึกวัตถุดิบเสีย/หมดอายุ (Module 5)' },
    reports:   { title: 'รายงาน & แจ้งเตือน',   desc: 'สต็อกใกล้หมด วันหมดอายุ ยอดขาย ต้นทุน (Module 6)' },
    users:     { title: 'ประวัติการใช้งาน',     desc: 'ประวัติการเข้า-ออกระบบของผู้ใช้งานทุกคน (Module 1)' },
  };

  constructor() {
    this.services = new ServiceContainer();
    // สร้างตัวซิงก์เฉพาะเมื่อเปิดใช้ Google Sheet ใน config.js
    this.sync = CONFIG.USE_GOOGLE_SHEET
      ? new SheetSync(this.services.db, new SheetApi(CONFIG.SHEET_API_URL, CONFIG.API_KEY), (s, m) => this.#showSyncStatus(s, m))
      : null;

    this.modal = new Modal();
    this.currentModule = 'dashboard';
    this.views = {
      dashboard: new DashboardView(this),
      master:    new MasterDataView(this),
      stockin:   new StockInView(this),
      sales:     new SalesView(this),
      waste:     new WasteView(this),
      reports:   new ReportsView(this),
      users:     new LoginHistoryView(this),
    };
  }

  get auth() { return this.services.auth; }
  #el(id) { return document.getElementById(id); }

  start() {
    Icons.applyTo(document);
    this.#bindShellEvents();
    this.#el('loginUser').focus();
    // เตือนก่อนปิดแท็บ ถ้ายังบันทึกลง Sheet ไม่เสร็จ
    window.addEventListener('beforeunload', e => { if (this.sync?.isBusy) e.preventDefault(); });
  }

  /** โหลดข้อมูลตอนเปิดแอป: จาก Google Sheet (ถ้าเปิดใช้) หรือข้อมูลตัวอย่าง */
  async init() {
    if (!this.sync) { seedDatabase(this.services); return; }

    const btn = this.#el('loginBtn');
    const msg = this.#el('loginError');
    btn.disabled = true;
    msg.textContent = 'กำลังโหลดข้อมูลจาก Google Sheet…';
    try {
      const hasData = await this.sync.load();
      if (!hasData) {                       // Sheet ว่าง (ใช้ครั้งแรก) → ใส่ข้อมูลตัวอย่างแล้วบันทึกขึ้นไป
        seedDatabase(this.services);
        await this.sync.saveNow();
      }
      msg.textContent = '';
    } catch (err) {
      console.error(err);
      this.sync = null;                     // ตัดการซิงก์ แล้วใช้ข้อมูลตัวอย่างแทน เพื่อให้ยังใช้งานได้
      seedDatabase(this.services);
      msg.textContent = 'เชื่อม Google Sheet ไม่สำเร็จ — ใช้ข้อมูลตัวอย่างแทน (ดูรายละเอียดใน Console)';
    } finally {
      btn.disabled = false;
    }
  }

  /** เรียกเมื่อข้อมูลเปลี่ยน: อัปเดตป้ายแจ้งเตือน + สั่งบันทึกลง Sheet */
  onDataChanged() {
    this.updateTopAlerts();
    this.sync?.schedule();
  }

  #showSyncStatus(state, message = '') {
    const el = this.#el('syncStatus');
    const text = {
      pending: 'มีการเปลี่ยนแปลง รอบันทึก…',
      saving:  'กำลังบันทึกลง Google Sheet…',
      saved:   'บันทึกลง Google Sheet แล้ว ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      error:   'บันทึกไม่สำเร็จ: ' + message,
    };
    el.hidden = false;
    el.textContent = text[state];
    el.classList.toggle('error', state === 'error');
  }

  #bindShellEvents() {
    this.#el('loginBtn').addEventListener('click', () => this.login());
    ['loginUser', 'loginPass'].forEach(id =>
      this.#el(id).addEventListener('keydown', e => { if (e.key === 'Enter') this.login(); }));
    this.#el('logoutBtn').addEventListener('click', () => this.logout());

    document.querySelectorAll('.navlink').forEach(btn =>
      btn.addEventListener('click', () => this.showModule(btn.dataset.mod)));
    document.querySelectorAll('[data-goto]').forEach(btn =>
      btn.addEventListener('click', () => this.showModule(btn.dataset.goto)));
  }

  // ---------------- Auth ----------------
  login() {
    const errorEl = this.#el('loginError');
    try {
      this.auth.login(this.#el('loginUser').value.trim(), this.#el('loginPass').value);
      errorEl.textContent = '';
      this.sync?.schedule();   // บันทึกประวัติการเข้าระบบ
      this.#enterApp();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  }

  logout() {
    this.auth.logout();
    this.sync?.schedule();     // บันทึกเวลาออกจากระบบ
    this.modal.close();
    this.views.sales.reset();
    this.#el('app').classList.remove('active');
    this.#el('loginScreen').hidden = false;
    this.#el('loginUser').value = '';
    this.#el('loginPass').value = '';
    this.#el('loginUser').focus();
  }

  #enterApp() {
    const user = this.auth.currentUser;
    this.#el('loginScreen').hidden = true;
    this.#el('app').classList.add('active');
    this.#el('whoName').textContent = user.full_name;
    this.#el('whoRole').textContent = user.roleLabel;
    this.#el('whoAvatar').textContent = user.initial;
    this.#applyPermissions();
    this.showModule('dashboard');
  }

  /** ซ่อนเมนูด้านข้างที่ผู้ใช้ไม่มีสิทธิ์ */
  #applyPermissions() {
    document.querySelectorAll('.navlink').forEach(btn => { btn.hidden = !this.auth.canAccess(btn.dataset.mod); });
  }

  // ---------------- Routing ----------------
  showModule(mod) {
    if (!this.auth.canAccess(mod)) { Toast.error(this.auth.denyMessage(mod)); return; }

    this.currentModule = mod;
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + mod));
    document.querySelectorAll('.navlink').forEach(n => n.classList.toggle('active', n.dataset.mod === mod));
    this.#el('topbarTitle').textContent = App.MODULES[mod].title;
    this.#el('topbarDesc').textContent = App.MODULES[mod].desc;

    this.views[mod].render();   // Polymorphism: ทุก view มี render() แต่ทำงานต่างกัน
    this.updateTopAlerts();
  }

  updateTopAlerts() {
    const low = this.services.inventory.lowStockList().length;
    const exp = this.services.inventory.expiringLots(5).length;
    this.#el('topAlertLowCount').textContent = low;
    this.#el('topAlertExpCount').textContent = exp;
    this.#el('topAlertLow').hidden = low === 0;
    this.#el('topAlertExp').hidden = exp === 0;
  }
}
