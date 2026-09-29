import { User } from '../models/User.js';
import { CartItem } from '../models/Cart.js';
import { LoginRecord } from '../models/Records.js';
import { DateUtil } from '../utils/DateUtil.js';

/**
 * seedDatabase — ใส่ข้อมูลตัวอย่างสำหรับทดลองใช้
 * ใช้ service จริงในการสร้างข้อมูล จึงผ่านการตรวจสอบเหมือนผู้ใช้กรอกเอง
 * @param {import('../core/ServiceContainer.js').ServiceContainer} s
 */
export function seedDatabase(s) {
  const { db } = s;
  const T = DateUtil.today;

  // ---- ผู้ใช้ (D1) ----
  db.users.add(new User({ user_id: db.users.nextId(), username: 'owner', password: '1234', full_name: 'สมชาย',   role: 'owner',    created_at: '2026-01-05' }));
  db.users.add(new User({ user_id: db.users.nextId(), username: 'staff', password: '1234', full_name: 'สมศักดิ์', role: 'employee', created_at: '2026-02-10' }));

  // ---- วัตถุดิบ/บรรจุภัณฑ์ (D3) ----
  const ing = (name, type, pu, uu, rate, reorder, shelf) => s.ingredients.save(null, {
    ingredient_name: name, type, purchase_unit: pu, usage_unit: uu,
    conversion_rate: rate, reorder_point: reorder, shelf_life_days: shelf,
  }).ingredient_id;

  const RAW = 'raw_material', PACK = 'packaging';
  const coconut   = ing('ลูกมะพร้าว', RAW, 'กระสอบ (20 ลูก)',   'ลูก',   20,   15,   5);
  const ice       = ing('น้ำแข็ง',     RAW, 'ถุง (5 กก.)',        'กรัม',  5000, 5000, 2);
  const sugar     = ing('น้ำตาล',      RAW, 'ถุง (1 กก.)',        'กรัม',  1000, 500,  365);
  const sweetMilk = ing('นมข้นหวาน',   RAW, 'กระป๋อง (380 ก.)',  'กรัม',  380,  400,  180);
  const evapMilk  = ing('นมข้นจืด',    RAW, 'กระป๋อง (385 มล.)', 'มล.',   385,  400,  180);
  const palm      = ing('วุ้นลูกตาล',  RAW, 'ถุง (1 กก.)',        'กรัม',  1000, 500,  5);
  const basil     = ing('แมงลัก',      RAW, 'ถุง (500 ก.)',       'กรัม',  500,  150,  180);
  const iceCream  = ing('ไอศกรีม',     RAW, 'ถัง (2 ลิตร)',       'สกู๊ป', 25,   10,   30);
  const cup       = ing('แก้วน้ำ',     PACK, 'แพ็ค (50 ใบ)',      'ใบ',    50,   60,   365);
  const dome      = ing('ฝาโดม',       PACK, 'แพ็ค (50 ใบ)',      'ใบ',    50,   50,   365);
  const flat      = ing('ฝาตัด',       PACK, 'แพ็ค (50 ใบ)',      'ใบ',    50,   30,   365);
  const straw     = ing('หลอด',        PACK, 'แพ็ค (100 หลอด)',   'หลอด',  100,  60,   365);
  const spoon     = ing('ช้อน',        PACK, 'แพ็ค (100 คัน)',    'คัน',   100,  50,   365);
  const bag       = ing('ถุงหิ้ว',     PACK, 'แพ็ค (100 ใบ)',     'ใบ',    100,  60,   365);

  // ---- เมนู (D2) ----
  const menu = (name, price, category) => s.menus.save(null, { menu_name: name, price, category, status: 'active' }).menu_id;
  const mFresh     = menu('น้ำมะพร้าวสด',       40, 'น้ำมะพร้าว');
  const mBlend     = menu('มะพร้าวปั่น',        50, 'มะพร้าวปั่น');
  const mBlendMilk = menu('มะพร้าวปั่นนมสด',    60, 'มะพร้าวปั่น');
  const mBlendIce  = menu('มะพร้าวปั่นไอศกรีม', 65, 'มะพร้าวปั่น');

  // ---- สูตร / BOM (D4): [ingredient_id, ปริมาณต่อแก้ว] ----
  const recipe = (menuId, pairs) => s.menus.saveRecipe(menuId, pairs.map(([ingredient_id, quantity_used]) => ({ ingredient_id, quantity_used })));
  const blendPack = [[cup, 1], [dome, 1], [straw, 1], [spoon, 1], [bag, 1]];
  recipe(mFresh,     [[coconut, 1], [ice, 150], [cup, 1], [flat, 1], [straw, 1], [bag, 1]]);
  recipe(mBlend,     [[coconut, 1], [ice, 250], [sugar, 15], [palm, 40], [basil, 5], ...blendPack]);
  recipe(mBlendMilk, [[coconut, 1], [ice, 250], [sugar, 10], [sweetMilk, 20], [evapMilk, 40], [palm, 40], [basil, 5], ...blendPack]);
  recipe(mBlendIce,  [[coconut, 1], [ice, 200], [sweetMilk, 15], [iceCream, 1], [palm, 40], [basil, 5], ...blendPack]);

  // ---- ล็อต (D5) + ประวัติรับเข้า (D8): ระบุเป็นหน่วยใช้งาน แล้วแปลงกลับเป็นหน่วยซื้อ ----
  const lot = (id, usageQty, recvOffset, expOffset) => {
    const ingredient = s.ingredients.get(id);
    s.inventory.receive({
      ingredient, qtyPurchase: usageQty / ingredient.conversion_rate,
      receivedDate: T(recvOffset), expireDate: T(expOffset), userId: 1,
      receivedAt: T(recvOffset) + 'T08:00',
    });
  };
  lot(coconut, 20, -4, 1);     // ล็อตเก่า ใกล้หมดอายุ
  lot(coconut, 40, -1, 4);
  lot(ice, 20000, 0, 2);
  lot(sugar, 3000, -20, 345);
  lot(sweetMilk, 1520, -10, 170);
  lot(evapMilk, 1540, -10, 170);
  lot(palm, 1500, -2, 3);      // ใกล้หมดอายุ
  lot(basil, 450, -30, 150);
  lot(iceCream, 12, -7, 23);   // ใกล้หมด
  lot(cup, 300, -5, 360);
  lot(dome, 200, -5, 360);
  lot(flat, 100, -5, 360);
  lot(straw, 400, -5, 360);
  lot(spoon, 55, -5, 360);     // ใกล้หมด
  lot(bag, 300, -5, 360);

  // ---- ขายตัวอย่าง (D6/D7) ----
  const sale = (userId, dayOffset, items) => {
    const when = new Date(); when.setDate(when.getDate() + dayOffset);
    s.sales.checkout(items.map(([m, q, ex = []]) => new CartItem(m, q, ex)), userId, when.toISOString());
  };
  sale(2, -1, [[mFresh, 2], [mBlend, 1]]);
  sale(2, -1, [[mBlendMilk, 2, [basil]], [mBlendIce, 1]]);
  sale(1, -1, [[mFresh, 3, [ice]]]);
  sale(2,  0, [[mBlend, 2], [mFresh, 1]]);
  sale(2,  0, [[mBlendIce, 2], [mBlendMilk, 1, [palm]]]);

  // ---- ประวัติเข้าใช้ระบบ (D11) ----
  [[1, -2, 8, 5, 17, 40], [2, -2, 9, 0, 18, 2], [2, -1, 8, 55, 17, 58], [1, -1, 10, 12, 15, 30]]
    .forEach(([uid, off, h1, m1, h2, m2]) => db.logins.add(new LoginRecord({
      log_id: db.logins.nextId(), user_id: uid,
      login_time: DateUtil.at(off, h1, m1), logout_time: DateUtil.at(off, h2, m2),
    }), { prepend: true }));
}
