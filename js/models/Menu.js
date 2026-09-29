/** Menu — เมนูที่ขายในร้าน (tbl_menu) */
export class Menu {
  constructor({ menu_id, menu_name, price, category, status = 'active' }) {
    this.menu_id = menu_id;
    this.menu_name = menu_name;
    this.price = price;
    this.category = category;
    this.status = status;
  }

  get isActive() { return this.status === 'active'; }

  update({ menu_name, price, category, status }) {
    Object.assign(this, { menu_name, price, category, status });
  }
}
