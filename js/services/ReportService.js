/** ReportService — คำนวณตัวเลขสรุปสำหรับหน้ารายงาน (Module 6) */
export class ReportService {
  constructor(salesService, wasteService) {
    this.sales = salesService;
    this.waste = wasteService;
  }

  summary() {
    const sales = this.sales.allSales();
    const totalRevenue = sales.reduce((s, x) => s + x.total_amount, 0);
    const billCount = sales.length;
    return {
      totalRevenue,
      billCount,
      avgBill: billCount ? totalRevenue / billCount : 0,
      totalCups: this.sales.allDetails().reduce((s, d) => s + d.quantity, 0),
      wasteCount: this.waste.count(),
    };
  }

  /** เมนูขายดี เรียงตามจำนวนแก้ว */
  topMenus() {
    const map = new Map();
    this.sales.allDetails().forEach(d => {
      const cur = map.get(d.menu_id) || { menu_id: d.menu_id, qty: 0, revenue: 0 };
      cur.qty += d.quantity;
      cur.revenue += d.subtotal;
      map.set(d.menu_id, cur);
    });
    return [...map.values()].sort((a, b) => b.qty - a.qty);
  }
}
