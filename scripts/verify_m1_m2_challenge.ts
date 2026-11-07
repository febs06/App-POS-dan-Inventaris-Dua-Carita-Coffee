/**
 * Empirical Verification and Challenge Suite for Milestones M1 and M2
 * 
 * Target Milestones:
 * - Milestone M1: Cashier Navigation & /finance Route Protection
 * - Milestone M2: Bazaar Orders Payment & Operational Metrics
 * 
 * Integrity Mode: Demo (Adversarial stress testing without reading existing test files)
 */

interface CashierProfile {
  id: string;
  name: string;
  role: string | null | undefined;
}

interface OrderItem {
  id: string;
  qty: number;
  price: number;
  product?: { name: string };
  notes?: string;
}

interface OrderPayment {
  id: string;
  method: string | null;
  amount: number | string;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  eventId: string;
  customerName?: string;
  totalAmount: number;
  status: string;
  isVoided: boolean;
  createdAt: string;
  items?: OrderItem[];
  payments?: OrderPayment[];
  paymentMethod?: string | null;
}

// -----------------------------------------------------------------------------
// MODULE 1 IMPLEMENTATION EXTRACTS (From Sidebar.tsx, AppLayout.tsx, FinancePage.tsx)
// -----------------------------------------------------------------------------

function evaluateCashierRole(roleInput: any): { role: string | undefined; isOwner: boolean } {
  const role = typeof roleInput === "string" ? roleInput.trim().toUpperCase() : undefined;
  const isOwner = role === "OWNER" || role === "MANAGER";
  return { role, isOwner };
}

function filterSidebarKasirNav(isOwner: boolean) {
  const KASIR_NAV_ITEMS = [
    { href: "/pos", label: "Kasir Direct (POS)" },
    { href: "/bazaar-orders", label: "Pesanan Bazaar Hari Ini" },
    { href: "/po", label: "Ambil Pre-Order (PO)" },
    { href: "/finance", label: "Kas Booth & Shift" },
  ];
  return KASIR_NAV_ITEMS.filter((item) => isOwner || item.href !== "/finance");
}

function canSwitchToInventarisMode(mode: "kasir" | "inventaris", isOwner: boolean): boolean {
  if (mode === "inventaris" && !isOwner) {
    return false; // Blocked for cashier
  }
  return true;
}

function checkAppLayoutRouteRestriction(
  pathname: string,
  cashier: CashierProfile | null,
  isPublicRoute: boolean = false
): { isRestricted: boolean; redirectedTo: string | null } {
  if (isPublicRoute) {
    return { isRestricted: false, redirectedTo: null };
  }
  if (!cashier) {
    return { isRestricted: true, redirectedTo: "/login" };
  }
  const { isOwner } = evaluateCashierRole(cashier.role);
  const KASIR_ALLOWED_ROUTES = ["/pos", "/bazaar-orders", "/po"];

  if (!isOwner && !KASIR_ALLOWED_ROUTES.includes(pathname)) {
    return { isRestricted: true, redirectedTo: "/pos" };
  }
  return { isRestricted: false, redirectedTo: null };
}

function simulateFinancePageGuard(cashier: CashierProfile | null): {
  isAuthorized: boolean;
  redirectUrl: string | null;
  rendersShield: boolean;
  allowsApiFetch: boolean;
} {
  if (!cashier) {
    return {
      isAuthorized: false,
      redirectUrl: "/login",
      rendersShield: true,
      allowsApiFetch: false,
    };
  }

  const { isOwner } = evaluateCashierRole(cashier.role);
  if (!isOwner) {
    return {
      isAuthorized: false,
      redirectUrl: "/pos",
      rendersShield: true,
      allowsApiFetch: false,
    };
  }

  return {
    isAuthorized: true,
    redirectUrl: null,
    rendersShield: false,
    allowsApiFetch: true,
  };
}

// -----------------------------------------------------------------------------
// MODULE 2 IMPLEMENTATION EXTRACT (From src/app/bazaar-orders/page.tsx)
// -----------------------------------------------------------------------------

function computeBazaarOrdersStats(
  orders: OrderRecord[],
  selectedEventId: string = "ongoing"
) {
  const relevant = orders.filter((o) => {
    if (selectedEventId && selectedEventId !== "all" && selectedEventId !== "ongoing") {
      return o.eventId === selectedEventId && !o.isVoided;
    }
    return !o.isVoided;
  });

  const totalRevenue = relevant.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalItems = relevant.reduce(
    (sum, o) => sum + (o.items?.reduce((s: number, it: any) => s + (it.qty || 0), 0) || 0),
    0
  );
  const processingCount = relevant.filter(
    (o) => o.status === "diproses" || o.status?.toLowerCase() === "sedang diracik"
  ).length;
  const completedCount = relevant.filter(
    (o) => o.status === "selesai" || o.status?.toLowerCase() === "siap diambil"
  ).length;

  const isCashMethod = (method?: string | null) => {
    if (!method) return false;
    const m = String(method).toUpperCase().trim();
    return m === "CASH" || m === "TUNAI";
  };

  const isQrisMethod = (method?: string | null) => {
    if (!method) return false;
    const m = String(method).toUpperCase().trim();
    return m === "QRIS";
  };

  let cashTotal = 0;
  let qrisTotal = 0;
  const cashOrderIds = new Set<string>();
  const qrisOrderIds = new Set<string>();

  relevant.forEach((o) => {
    const payments = o.payments || [];
    if (payments.length > 0) {
      payments.forEach((p: any) => {
        if (isCashMethod(p.method)) {
          cashTotal += Number(p.amount) || 0;
          cashOrderIds.add(o.id);
        } else if (isQrisMethod(p.method)) {
          qrisTotal += Number(p.amount) || 0;
          qrisOrderIds.add(o.id);
        }
      });
    } else if (o.paymentMethod) {
      if (isCashMethod(o.paymentMethod)) {
        cashTotal += Number(o.totalAmount) || 0;
        cashOrderIds.add(o.id);
      } else if (isQrisMethod(o.paymentMethod)) {
        qrisTotal += Number(o.totalAmount) || 0;
        qrisOrderIds.add(o.id);
      }
    }
  });

  const cashTxCount = cashOrderIds.size;
  const qrisTxCount = qrisOrderIds.size;

  return {
    totalRevenue,
    totalItems,
    processingCount,
    completedCount,
    totalOrders: relevant.length,
    cashTotal,
    cashTxCount,
    qrisTotal,
    qrisTxCount,
  };
}

// -----------------------------------------------------------------------------
// TEST RUNNER INFRASTRUCTURE
// -----------------------------------------------------------------------------

let testIndex = 0;
let passedCount = 0;
let failedCount = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string, details?: any) {
  testIndex++;
  if (condition) {
    passedCount++;
    console.log(`  [PASS] Test #${testIndex}: ${testName}`);
  } else {
    failedCount++;
    const errMsg = `  [FAIL] Test #${testIndex}: ${testName} ${details ? JSON.stringify(details) : ""}`;
    console.error(errMsg);
    failures.push(errMsg);
  }
}

// -----------------------------------------------------------------------------
// EXECUTE EMPIRICAL CHALLENGES
// -----------------------------------------------------------------------------

console.log("================================================================================");
console.log("STARTING EMPIRICAL VERIFICATION SUITE: MILESTONES M1 & M2");
console.log("================================================================================");

// -----------------------------------------------------------------------------
// MILESTONE M1: ROLE PARSING & ROUTE PROTECTION CHALLENGES
// -----------------------------------------------------------------------------
console.log("\n--- Section 1.1: Role Parsing & Privilege Resolution ---");

const roleTestCases = [
  { input: "KASIR", expectedOwner: false },
  { input: "kasir", expectedOwner: false },
  { input: " Kasir ", expectedOwner: false },
  { input: "BARISTA", expectedOwner: false },
  { input: "barista", expectedOwner: false },
  { input: " Barista ", expectedOwner: false },
  { input: "STAFF", expectedOwner: false },
  { input: "null", expectedOwner: false },
  { input: null, expectedOwner: false },
  { input: undefined, expectedOwner: false },
  { input: "", expectedOwner: false },
  { input: "   ", expectedOwner: false },
  { input: "ADMIN", expectedOwner: false }, // Only OWNER/MANAGER are privileged in RBAC
  { input: "OWNER", expectedOwner: true },
  { input: "owner", expectedOwner: true },
  { input: " Owner ", expectedOwner: true },
  { input: "MANAGER", expectedOwner: true },
  { input: "manager", expectedOwner: true },
  { input: " Manager ", expectedOwner: true },
];

for (const tc of roleTestCases) {
  const result = evaluateCashierRole(tc.input);
  assert(
    result.isOwner === tc.expectedOwner,
    `Role input "${tc.input}" parsed as isOwner=${tc.expectedOwner}`,
    { actual: result.isOwner, expected: tc.expectedOwner }
  );
}

console.log("\n--- Section 1.2: Sidebar Kasir Navigation Filtering ---");

// Non-owners (cashier, barista, unknown) must NEVER see /finance
const nonOwnerRoles = ["KASIR", "kasir", " Kasir ", "BARISTA", null, undefined, "ADMIN"];
for (const r of nonOwnerRoles) {
  const { isOwner } = evaluateCashierRole(r);
  const navItems = filterSidebarKasirNav(isOwner);
  const hasFinance = navItems.some((item) => item.href === "/finance");
  assert(
    !hasFinance,
    `Role "${r}" sidebar does NOT contain /finance`,
    { navItems: navItems.map((n) => n.href) }
  );
  assert(
    navItems.some((item) => item.href === "/pos") &&
    navItems.some((item) => item.href === "/bazaar-orders") &&
    navItems.some((item) => item.href === "/po"),
    `Role "${r}" sidebar retains essential POS, Bazaar, and PO navigation`
  );
  assert(
    !canSwitchToInventarisMode("inventaris", isOwner),
    `Role "${r}" is blocked from switching to inventaris mode`
  );
}

// Owners & Managers MUST see /finance in sidebar
const ownerRoles = ["OWNER", "owner", "MANAGER", "manager"];
for (const r of ownerRoles) {
  const { isOwner } = evaluateCashierRole(r);
  const navItems = filterSidebarKasirNav(isOwner);
  const hasFinance = navItems.some((item) => item.href === "/finance");
  assert(
    hasFinance,
    `Role "${r}" sidebar DOES contain /finance`,
    { navItems: navItems.map((n) => n.href) }
  );
  assert(
    canSwitchToInventarisMode("inventaris", isOwner),
    `Role "${r}" is permitted to switch to inventaris mode`
  );
}

console.log("\n--- Section 1.3: AppLayout Defense-in-Depth Route Guard ---");

const cashierUser: CashierProfile = { id: "c1", name: "Siti Kasir", role: "KASIR" };
const ownerUser: CashierProfile = { id: "o1", name: "Pak Budi Owner", role: "OWNER" };

// Restricted routes for cashier
const protectedBackofficeRoutes = [
  "/finance",
  "/dashboard",
  "/stock",
  "/products",
  "/reports",
  "/analytics",
  "/settings",
  "/suppliers",
  "/customers",
  "/events",
];

for (const route of protectedBackofficeRoutes) {
  const cashierCheck = checkAppLayoutRouteRestriction(route, cashierUser);
  assert(
    cashierCheck.isRestricted && cashierCheck.redirectedTo === "/pos",
    `Cashier navigating directly to "${route}" is blocked & redirected to "/pos"`
  );

  const ownerCheck = checkAppLayoutRouteRestriction(route, ownerUser);
  assert(
    !ownerCheck.isRestricted && ownerCheck.redirectedTo === null,
    `Owner navigating to "${route}" is granted direct access`
  );
}

// Allowed routes for cashier
const allowedCashierRoutes = ["/pos", "/bazaar-orders", "/po"];
for (const route of allowedCashierRoutes) {
  const cashierCheck = checkAppLayoutRouteRestriction(route, cashierUser);
  assert(
    !cashierCheck.isRestricted && cashierCheck.redirectedTo === null,
    `Cashier navigating to allowed route "${route}" is granted access`
  );
}

// Unauthenticated user
const unauthCheck = checkAppLayoutRouteRestriction("/finance", null);
assert(
  unauthCheck.isRestricted && unauthCheck.redirectedTo === "/login",
  `Unauthenticated user accessing /finance is redirected to /login`
);

console.log("\n--- Section 1.4: FinancePage In-Page Guard (Defense-in-Depth & Shielding) ---");

// Test cashier accessing /finance
const cashierFinanceGuard = simulateFinancePageGuard(cashierUser);
assert(
  !cashierFinanceGuard.isAuthorized,
  "FinancePage guard marks cashier as unauthorized"
);
assert(
  cashierFinanceGuard.redirectUrl === "/pos",
  "FinancePage guard triggers router.replace('/pos') for cashier"
);
assert(
  cashierFinanceGuard.rendersShield,
  "FinancePage guard renders Access Denied shield to prevent UI leak"
);
assert(
  !cashierFinanceGuard.allowsApiFetch,
  "FinancePage guard prevents cashflow and rab API fetching for cashier"
);

// Test owner accessing /finance
const ownerFinanceGuard = simulateFinancePageGuard(ownerUser);
assert(
  ownerFinanceGuard.isAuthorized,
  "FinancePage guard marks owner as authorized"
);
assert(
  ownerFinanceGuard.redirectUrl === null,
  "FinancePage guard does not redirect owner"
);
assert(
  !ownerFinanceGuard.rendersShield,
  "FinancePage guard does not show access denied shield for owner"
);
assert(
  ownerFinanceGuard.allowsApiFetch,
  "FinancePage guard enables API data fetching for owner"
);

// -----------------------------------------------------------------------------
// MILESTONE M2: BAZAAR ORDERS CALCULATION FORMULAS & VOID EXCLUSION
// -----------------------------------------------------------------------------
console.log("\n--- Section 2.1: Order Dataset Construction & Edge Case Setup ---");

const testOrders: OrderRecord[] = [
  // 1. Pure Cash order
  {
    id: "ord-1",
    orderNumber: "ORD-001",
    eventId: "ev-bazaar-1",
    customerName: "Andi",
    totalAmount: 35000,
    status: "diproses",
    isVoided: false,
    createdAt: "2026-11-07T10:00:00Z",
    items: [
      { id: "it-1", qty: 2, price: 17500, product: { name: "Kopi Susu Gula Aren" } },
    ],
    payments: [{ id: "pay-1", method: "CASH", amount: 35000 }],
  },
  // 2. Pure Cash order via legacy fallback paymentMethod: "TUNAI"
  {
    id: "ord-2",
    orderNumber: "ORD-002",
    eventId: "ev-bazaar-1",
    customerName: "Budi",
    totalAmount: 20000,
    status: "selesai",
    isVoided: false,
    createdAt: "2026-11-07T10:05:00Z",
    items: [
      { id: "it-2", qty: 1, price: 20000, product: { name: "Americano" } },
    ],
    paymentMethod: "TUNAI",
  },
  // 3. Pure QRIS order
  {
    id: "ord-3",
    orderNumber: "ORD-003",
    eventId: "ev-bazaar-1",
    customerName: "Citra",
    totalAmount: 55000,
    status: "diproses",
    isVoided: false,
    createdAt: "2026-11-07T10:10:00Z",
    items: [
      { id: "it-3", qty: 3, price: 18333, product: { name: "Matcha Latte" } },
    ],
    payments: [{ id: "pay-2", method: "QRIS", amount: 55000 }],
  },
  // 4. Pure QRIS order via legacy fallback paymentMethod: "QRIS"
  {
    id: "ord-4",
    orderNumber: "ORD-004",
    eventId: "ev-bazaar-1",
    customerName: "Dewi",
    totalAmount: 18000,
    status: "selesai",
    isVoided: false,
    createdAt: "2026-11-07T10:15:00Z",
    items: [
      { id: "it-4", qty: 1, price: 18000, product: { name: "Earl Grey Tea" } },
    ],
    paymentMethod: "QRIS",
  },
  // 5. Split payment: Cash + QRIS on same order
  {
    id: "ord-5",
    orderNumber: "ORD-005",
    eventId: "ev-bazaar-1",
    customerName: "Eko",
    totalAmount: 60000,
    status: "diproses",
    isVoided: false,
    createdAt: "2026-11-07T10:20:00Z",
    items: [
      { id: "it-5", qty: 2, price: 15000, product: { name: "Espresso" } },
      { id: "it-6", qty: 2, price: 15000, product: { name: "Croissant" } },
    ],
    payments: [
      { id: "pay-3", method: "CASH", amount: 25000 },
      { id: "pay-4", method: "QRIS", amount: 35000 },
    ],
  },
  // 6. Split Cash: two separate Cash payment records on same order (tests deduplication)
  {
    id: "ord-6",
    orderNumber: "ORD-006",
    eventId: "ev-bazaar-1",
    customerName: "Fani",
    totalAmount: 40000,
    status: "selesai",
    isVoided: false,
    createdAt: "2026-11-07T10:25:00Z",
    items: [
      { id: "it-7", qty: 2, price: 20000, product: { name: "Caramel Macchiato" } },
    ],
    payments: [
      { id: "pay-5", method: "CASH", amount: 20000 },
      { id: "pay-6", method: "TUNAI", amount: 20000 },
    ],
  },
  // 7. Non-cash, Non-qris order (Transfer)
  {
    id: "ord-7",
    orderNumber: "ORD-007",
    eventId: "ev-bazaar-1",
    customerName: "Gilang",
    totalAmount: 25000,
    status: "selesai",
    isVoided: false,
    createdAt: "2026-11-07T10:30:00Z",
    items: [
      { id: "it-8", qty: 1, price: 25000, product: { name: "Avocado Coffee" } },
    ],
    payments: [{ id: "pay-7", method: "TRANSFER", amount: 25000 }],
  },
  // 8. VOIDED Cash order (Must be strictly excluded!)
  {
    id: "ord-8-void",
    orderNumber: "ORD-008",
    eventId: "ev-bazaar-1",
    customerName: "Hadi (Void)",
    totalAmount: 100000,
    status: "diproses",
    isVoided: true,
    createdAt: "2026-11-07T10:35:00Z",
    items: [
      { id: "it-9", qty: 5, price: 20000, product: { name: "Latte" } },
    ],
    payments: [{ id: "pay-8", method: "CASH", amount: 100000 }],
  },
  // 9. VOIDED QRIS order (Must be strictly excluded!)
  {
    id: "ord-9-void",
    orderNumber: "ORD-009",
    eventId: "ev-bazaar-1",
    customerName: "Indah (Void)",
    totalAmount: 75000,
    status: "selesai",
    isVoided: true,
    createdAt: "2026-11-07T10:40:00Z",
    items: [
      { id: "it-10", qty: 3, price: 25000, product: { name: "Cold Brew" } },
    ],
    payments: [{ id: "pay-9", method: "QRIS", amount: 75000 }],
  },
  // 10. VOIDED Split order (Must be strictly excluded!)
  {
    id: "ord-10-void",
    orderNumber: "ORD-010",
    eventId: "ev-bazaar-1",
    customerName: "Joko (Void)",
    totalAmount: 50000,
    status: "diproses",
    isVoided: true,
    createdAt: "2026-11-07T10:45:00Z",
    items: [
      { id: "it-11", qty: 2, price: 25000, product: { name: "Mocha" } },
    ],
    payments: [
      { id: "pay-10", method: "CASH", amount: 25000 },
      { id: "pay-11", method: "QRIS", amount: 25000 },
    ],
  },
  // 11. Order from different event ("ev-bazaar-2")
  {
    id: "ord-11-other-event",
    orderNumber: "ORD-011",
    eventId: "ev-bazaar-2",
    customerName: "Kiki",
    totalAmount: 15000,
    status: "diproses",
    isVoided: false,
    createdAt: "2026-11-07T10:50:00Z",
    items: [
      { id: "it-12", qty: 1, price: 15000, product: { name: "Tubruk" } },
    ],
    payments: [{ id: "pay-12", method: "CASH", amount: 15000 }],
  },
];

console.log("\n--- Section 2.2: Empirical Verification against Ground Truth for Event 'ev-bazaar-1' ---");

// Ground truth for ev-bazaar-1:
// Active orders: ord-1 (35k), ord-2 (20k), ord-3 (55k), ord-4 (18k), ord-5 (60k), ord-6 (40k), ord-7 (25k)
// Total revenue: 35000 + 20000 + 55000 + 18000 + 60000 + 40000 + 25000 = 253000
// Total items (cups): 2 + 1 + 3 + 1 + 4 + 2 + 1 = 14 cups
// Processing orders: ord-1, ord-3, ord-5 = 3 orders (Sedang diracik)
// Completed orders: ord-2, ord-4, ord-6, ord-7 = 4 orders (Selesai)
// Cash nominal: ord-1(35k) + ord-2(20k) + ord-5(25k) + ord-6(20k+20k=40k) = 120,000
// Cash distinct tx count: ord-1, ord-2, ord-5, ord-6 = 4 distinct orders
// QRIS nominal: ord-3(55k) + ord-4(18k) + ord-5(35k) = 108,000
// QRIS distinct tx count: ord-3, ord-4, ord-5 = 3 distinct orders
// Total non-void orders: 7 orders

const statsEv1 = computeBazaarOrdersStats(testOrders, "ev-bazaar-1");

assert(
  statsEv1.totalRevenue === 253000,
  `Omset Hari Ini equals exact ground truth Rp 253.000 (Voided orders strictly excluded)`,
  { actual: statsEv1.totalRevenue, expected: 253000 }
);

assert(
  statsEv1.totalItems === 14,
  `Cup Hari Ini Terjual equals exact ground truth 14 cups (Voided orders strictly excluded)`,
  { actual: statsEv1.totalItems, expected: 14 }
);

assert(
  statsEv1.processingCount === 3,
  `Sedang Diracik equals exact ground truth 3 orders (Voided processing orders strictly excluded)`,
  { actual: statsEv1.processingCount, expected: 3 }
);

assert(
  statsEv1.completedCount === 4,
  `Selesai / Diambil equals exact ground truth 4 orders (Voided completed orders strictly excluded)`,
  { actual: statsEv1.completedCount, expected: 4 }
);

assert(
  statsEv1.totalOrders === 7,
  `Total Transaksi Active equals exact ground truth 7 orders`,
  { actual: statsEv1.totalOrders, expected: 7 }
);

assert(
  statsEv1.cashTotal === 120000,
  `Total Masuk via CASH equals exact ground truth Rp 120.000`,
  { actual: statsEv1.cashTotal, expected: 120000 }
);

assert(
  statsEv1.cashTxCount === 4,
  `CASH transaction count equals exact ground truth 4 orders (multi-split payments on ord-6 deduplicated)`,
  { actual: statsEv1.cashTxCount, expected: 4 }
);

assert(
  statsEv1.qrisTotal === 108000,
  `Total Masuk via QRIS equals exact ground truth Rp 108.000`,
  { actual: statsEv1.qrisTotal, expected: 108000 }
);

assert(
  statsEv1.qrisTxCount === 3,
  `QRIS transaction count equals exact ground truth 3 orders`,
  { actual: statsEv1.qrisTxCount, expected: 3 }
);

console.log("\n--- Section 2.3: Verification with 'all' Events Filter ---");

// When selectedEventId === "all", ord-11 (15k, 1 cup, cash) is also included:
// Omset: 253000 + 15000 = 268000
// Cups: 14 + 1 = 15
// Cash nominal: 120000 + 15000 = 135000
// Cash tx: 4 + 1 = 5
// Processing count: 3 + 1 = 4
// Completed count: 4
// Total orders: 7 + 1 = 8

const statsAll = computeBazaarOrdersStats(testOrders, "all");

assert(
  statsAll.totalRevenue === 268000,
  `All Events Omset equals Rp 268.000`,
  { actual: statsAll.totalRevenue, expected: 268000 }
);

assert(
  statsAll.totalItems === 15,
  `All Events Cups equals 15 cups`,
  { actual: statsAll.totalItems, expected: 15 }
);

assert(
  statsAll.cashTotal === 135000,
  `All Events CASH Total equals Rp 135.000`,
  { actual: statsAll.cashTotal, expected: 135000 }
);

assert(
  statsAll.cashTxCount === 5,
  `All Events CASH Tx Count equals 5`,
  { actual: statsAll.cashTxCount, expected: 5 }
);

assert(
  statsAll.processingCount === 4,
  `All Events Processing Count equals 4`,
  { actual: statsAll.processingCount, expected: 4 }
);

console.log("\n--- Section 2.4: Adversarial Edge Cases in Payment & Method Parsing ---");

const edgeCaseOrders: OrderRecord[] = [
  // Order with case variations in payment method: " cash ", "  TUNAI  ", "qris"
  {
    id: "edge-1",
    orderNumber: "EDGE-001",
    eventId: "ev-1",
    totalAmount: 30000,
    status: "diproses",
    isVoided: false,
    createdAt: "2026-11-07T12:00:00Z",
    items: [{ id: "ei-1", qty: 2, price: 15000 }],
    payments: [
      { id: "ep-1", method: " cash ", amount: "15000" }, // String amount & spaces
      { id: "ep-2", method: " qRiS ", amount: 15000 },   // Mixed case & spaces
    ],
  },
  // Order with 0 items, 0 amount
  {
    id: "edge-2",
    orderNumber: "EDGE-002",
    eventId: "ev-1",
    totalAmount: 0,
    status: "selesai",
    isVoided: false,
    createdAt: "2026-11-07T12:05:00Z",
    items: [],
    payments: [],
  },
  // Order with null items and null payments (defensive programming check)
  {
    id: "edge-3",
    orderNumber: "EDGE-003",
    eventId: "ev-1",
    totalAmount: 10000,
    status: "diproses",
    isVoided: false,
    createdAt: "2026-11-07T12:10:00Z",
    items: undefined,
    payments: undefined,
    paymentMethod: "  tunai  ",
  },
];

const statsEdge = computeBazaarOrdersStats(edgeCaseOrders, "ev-1");

assert(
  statsEdge.cashTotal === 25000,
  `Edge case: ' cash ' (string 15000) and '  tunai  ' (10000) correctly sum to Rp 25.000`,
  { actual: statsEdge.cashTotal, expected: 25000 }
);

assert(
  statsEdge.qrisTotal === 15000,
  `Edge case: ' qRiS ' correctly recognized and sums to Rp 15.000`,
  { actual: statsEdge.qrisTotal, expected: 15000 }
);

assert(
  statsEdge.totalItems === 2,
  `Edge case: undefined items and empty items handle gracefully without throwing`,
  { actual: statsEdge.totalItems, expected: 2 }
);

console.log("\n================================================================================");
console.log(`CHALLENGE RESULTS SUMMARY:`);
console.log(`Passed: ${passedCount} tests`);
console.log(`Failed: ${failedCount} tests`);
console.log("================================================================================");

if (failedCount > 0) {
  console.error("FAILURES DETECTED:");
  failures.forEach((f) => console.error(f));
  process.exit(1);
} else {
  console.log("ALL EMPIRICAL CHALLENGES PASSED SUCCESSFULLY!");
  process.exit(0);
}
