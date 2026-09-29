import { Repository } from './Repository.js';
import { User } from '../models/User.js';
import { Menu } from '../models/Menu.js';
import { Ingredient } from '../models/Ingredient.js';
import { RecipeLine } from '../models/RecipeLine.js';
import { StockLot } from '../models/StockLot.js';
import { Sale, SaleDetail, ReceivingRecord, WasteRecord, LoginRecord } from '../models/Records.js';

/**
 * Database — รวม Repository ทุกตาราง (ตรงกับ D1–D11 ใน DFD)
 * ชื่อ property (users, menus, ...) = ชื่อแท็บใน Google Sheet
 */
export class Database {
  constructor() {
    this.users        = new Repository('user_id', User);                  // tbl_users
    this.menus        = new Repository('menu_id', Menu);                  // tbl_menu
    this.ingredients  = new Repository('ingredient_id', Ingredient);      // tbl_ingredients
    this.recipes      = new Repository('recipe_id', RecipeLine);          // tbl_recipe (BOM)
    this.lots         = new Repository('lot_id', StockLot);               // tbl_stock_lot
    this.sales        = new Repository('sale_id', Sale);                  // tbl_sales
    this.saleDetails  = new Repository('sales_detail_id', SaleDetail);    // tbl_sales_detail
    this.receivings   = new Repository('receiving_id', ReceivingRecord);  // tbl_receiving_history
    this.wastes       = new Repository('waste_id', WasteRecord);          // tbl_waste_record
    this.logins       = new Repository('log_id', LoginRecord);            // tbl_login_history
  }

  /** คืน { ชื่อตาราง: Repository } ทั้งหมด — ใช้ตอนโหลด/บันทึกทุกตารางพร้อมกัน */
  get repositories() {
    return Object.fromEntries(Object.entries(this).filter(([, v]) => v instanceof Repository));
  }
}
