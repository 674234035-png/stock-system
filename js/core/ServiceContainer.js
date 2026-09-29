import { Database } from './Database.js';
import { AuthService } from '../services/AuthService.js';
import { UserService } from '../services/UserService.js';
import { IngredientService } from '../services/IngredientService.js';
import { MenuService } from '../services/MenuService.js';
import { InventoryService } from '../services/InventoryService.js';
import { SalesService } from '../services/SalesService.js';
import { WasteService } from '../services/WasteService.js';
import { ReportService } from '../services/ReportService.js';

/**
 * ServiceContainer — สร้าง service ทั้งหมดและ "ต่อสาย" ให้กัน (Composition Root)
 * ไม่มี DOM เลย จึงนำไปทดสอบด้วย Node.js ได้โดยไม่ต้องเปิดเบราว์เซอร์
 */
export class ServiceContainer {
  constructor(db = new Database()) {
    this.db = db;
    this.auth        = new AuthService(db);
    this.users       = new UserService(db);
    this.ingredients = new IngredientService(db);
    this.menus       = new MenuService(db);
    this.inventory   = new InventoryService(db);
    this.sales       = new SalesService(db, this.menus, this.inventory);
    this.waste       = new WasteService(db, this.inventory);
    this.reports     = new ReportService(this.sales, this.waste);
  }
}
