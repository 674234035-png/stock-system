/** RecipeLine — 1 บรรทัดในสูตรเมนู: เมนูไหน ใช้วัตถุดิบอะไร เท่าไรต่อ 1 ที่ (tbl_recipe) */
export class RecipeLine {
  constructor({ recipe_id, menu_id, ingredient_id, quantity_used }) {
    this.recipe_id = recipe_id;
    this.menu_id = menu_id;
    this.ingredient_id = ingredient_id;
    this.quantity_used = quantity_used;
  }
}
