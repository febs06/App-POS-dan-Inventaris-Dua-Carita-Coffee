import { describe, it, expect, runAllSuites } from "./harness";
import {
  calculateVariantHpp,
  calculateVariantReadiness,
  RawMaterialItem,
  VariantIngredientItem,
} from "./hpp_readiness_suite";
import {
  simulatePosCheckout,
  simulatePosVoid,
  InventoryState,
  VariantRecipe,
} from "./pos_depletion_suite";

export function registerScenariosSuite() {
  const materials = new Map<string, RawMaterialItem>([
    ["raw-robusta", { id: "raw-robusta", name: "Kopi Robusta", category: "Bahan Minuman", unit: "gram", stock: 2000, costPerUnit: 159.0 }],
    ["raw-uht", { id: "raw-uht", name: "Susu UHT", category: "Bahan Minuman", unit: "ml", stock: 10000, costPerUnit: 19.5 }],
    ["raw-cup-12", { id: "raw-cup-12", name: "Cup Injection 12 Oz", category: "Kemasan & Packaging", unit: "pcs", stock: 300, costPerUnit: 1036.0 }],
    ["raw-tutup-cup", { id: "raw-tutup-cup", name: "Tutup Cup Injection", category: "Kemasan & Packaging", unit: "pcs", stock: 300, costPerUnit: 440.0 }],
    ["raw-botol-250", { id: "raw-botol-250", name: "Botol 250 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 150, costPerUnit: 1075.0 }],
    ["raw-stiker-250", { id: "raw-stiker-250", name: "Stiker 250 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 150, costPerUnit: 555.56 }],
    ["raw-botol-1000", { id: "raw-botol-1000", name: "Botol 1000 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 80, costPerUnit: 2800.0 }],
    ["raw-stiker-1000", { id: "raw-stiker-1000", name: "Stiker 1000 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 80, costPerUnit: 1071.43 }],
    ["raw-water", { id: "raw-water", name: "Air Demineral", category: "Bahan Minuman", unit: "ml", stock: 50000, costPerUnit: 0.3125 }],
    ["raw-promo-bag", { id: "raw-promo-bag", name: "Paper Bag Promosi", category: "Kemasan & Packaging", unit: "pcs", stock: 500, costPerUnit: 0 }],
  ]);

  const recipes = new Map<string, VariantRecipe>([
    [
      "v-cup",
      {
        variantId: "v-cup",
        productId: "p-coffee",
        ingredients: [
          { rawMaterialId: "raw-robusta", amount: 10 },
          { rawMaterialId: "raw-uht", amount: 40 },
          { rawMaterialId: "raw-cup-12", amount: 1 },
          { rawMaterialId: "raw-tutup-cup", amount: 1 },
        ],
      },
    ],
    [
      "v-cup-large",
      {
        variantId: "v-cup-large",
        productId: "p-coffee",
        ingredients: [
          { rawMaterialId: "raw-robusta", amount: 13 },
          { rawMaterialId: "raw-uht", amount: 52 },
          { rawMaterialId: "raw-cup-12", amount: 1 },
          { rawMaterialId: "raw-tutup-cup", amount: 1 },
        ],
      },
    ],
    [
      "v-botol-250",
      {
        variantId: "v-botol-250",
        productId: "p-coffee",
        ingredients: [
          { rawMaterialId: "raw-robusta", amount: 10 },
          { rawMaterialId: "raw-uht", amount: 60 },
          { rawMaterialId: "raw-botol-250", amount: 1 },
          { rawMaterialId: "raw-stiker-250", amount: 1 },
        ],
      },
    ],
    [
      "v-botol-1000",
      {
        variantId: "v-botol-1000",
        productId: "p-coffee",
        ingredients: [
          { rawMaterialId: "raw-robusta", amount: 40 },
          { rawMaterialId: "raw-uht", amount: 240 },
          { rawMaterialId: "raw-botol-1000", amount: 1 },
          { rawMaterialId: "raw-stiker-1000", amount: 1 },
        ],
      },
    ],
  ]);

  function getFreshInventory(): InventoryState {
    const rawMap = new Map<string, number>();
    materials.forEach((m, id) => rawMap.set(id, m.stock));
    return {
      rawMaterials: rawMap,
      productStocks: new Map([["p-coffee", 500]]),
      variantStocks: new Map([
        ["v-cup", 200],
        ["v-cup-large", 100],
        ["v-botol-250", 100],
        ["v-botol-1000", 50],
      ]),
    };
  }

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("TC-B01: Zero-cost raw material does not produce NaN or error in HPP calculation", () => {
      const promoIngredients: VariantIngredientItem[] = [
        { rawMaterialId: "raw-robusta", amount: 10 },
        { rawMaterialId: "raw-promo-bag", amount: 1 }, // cost = 0
      ];
      const hpp = calculateVariantHpp(promoIngredients, materials);
      expect(Number.isNaN(hpp)).toBe(false);
      expect(hpp).toBe(1590); // 10 * 159
    });

    it("TC-B02: High-decimal precision ingredients calculate accurately without precision drift", () => {
      const precisionIngredients: VariantIngredientItem[] = [
        { rawMaterialId: "raw-water", amount: 90 }, // 90 * 0.3125 = 28.125
      ];
      const hpp = calculateVariantHpp(precisionIngredients, materials);
      expect(hpp).toBe(28.13);
    });

    it("TC-B03: Large bulk order (500 units) scales depletion accurately", () => {
      const inv = getFreshInventory();
      // Restock to handle 500
      inv.rawMaterials.set("raw-cup-12", 1000);
      inv.rawMaterials.set("raw-tutup-cup", 1000);
      inv.rawMaterials.set("raw-robusta", 10000);
      inv.rawMaterials.set("raw-uht", 30000);

      const order = [{ productId: "p-coffee", variantId: "v-cup", qty: 500 }];
      const res = simulatePosCheckout(order, inv, recipes);

      expect(res.success).toBe(true);
      expect(inv.rawMaterials.get("raw-cup-12")).toBe(500);
      expect(inv.rawMaterials.get("raw-robusta")).toBe(5000); // 10000 - (500 * 10)
    });

    it("TC-B04: Extreme packaging isolation: 100 bottle checkouts consume zero cups and zero lids", () => {
      const inv = getFreshInventory();
      const initialCups = inv.rawMaterials.get("raw-cup-12")!;
      const initialLids = inv.rawMaterials.get("raw-tutup-cup")!;

      const bottleOrder = [
        { productId: "p-coffee", variantId: "v-botol-250", qty: 50 },
        { productId: "p-coffee", variantId: "v-botol-1000", qty: 25 },
      ];

      simulatePosCheckout(bottleOrder, inv, recipes);

      // Invariant: Cup and lid counts are EXACTLY the initial values
      expect(inv.rawMaterials.get("raw-cup-12")).toBe(initialCups);
      expect(inv.rawMaterials.get("raw-tutup-cup")).toBe(initialLids);
    });

    it("TC-B05: Bottle vs Cup isolation: 100 cup checkouts consume zero bottles and zero stickers", () => {
      const inv = getFreshInventory();
      const initialBottles = inv.rawMaterials.get("raw-botol-250")!;
      const initialStickers = inv.rawMaterials.get("raw-stiker-250")!;

      const cupOrder = [{ productId: "p-coffee", variantId: "v-cup", qty: 100 }];
      simulatePosCheckout(cupOrder, inv, recipes);

      expect(inv.rawMaterials.get("raw-botol-250")).toBe(initialBottles);
      expect(inv.rawMaterials.get("raw-stiker-250")).toBe(initialStickers);
    });
  });

  describe("Tier 3: Cross-Feature Combinations", () => {
    it("TC-C01: Mixed multi-variant basket depletes distinct ingredients accurately", () => {
      const inv = getFreshInventory();
      const basket = [
        { productId: "p-coffee", variantId: "v-cup", qty: 2 },
        { productId: "p-coffee", variantId: "v-cup-large", qty: 1 },
        { productId: "p-coffee", variantId: "v-botol-250", qty: 3 },
        { productId: "p-coffee", variantId: "v-botol-1000", qty: 1 },
      ];

      const res = simulatePosCheckout(basket, inv, recipes);
      expect(res.success).toBe(true);

      // Total cups: 2 (reguler) + 1 (large) = 3
      expect(inv.rawMaterials.get("raw-cup-12")).toBe(300 - 3);
      // Total bottles: 3 (250ml) and 1 (1000ml)
      expect(inv.rawMaterials.get("raw-botol-250")).toBe(150 - 3);
      expect(inv.rawMaterials.get("raw-botol-1000")).toBe(80 - 1);

      // Coffee beans: (2 * 10) + (1 * 13) + (3 * 10) + (1 * 40) = 20 + 13 + 30 + 40 = 103g
      expect(inv.rawMaterials.get("raw-robusta")).toBe(2000 - 103);
    });

    it("TC-C02: Restock immediately restores variant availability status", () => {
      const constrainedMaterials = new Map(materials);
      // Bottle stock = 0
      constrainedMaterials.set("raw-botol-250", {
        ...materials.get("raw-botol-250")!,
        stock: 0,
      });

      const beforeRestock = calculateVariantReadiness(
        recipes.get("v-botol-250")!.ingredients,
        constrainedMaterials
      );
      expect(beforeRestock.isAvailableByIngredients).toBe(false);
      expect(beforeRestock.maxProducible).toBe(0);

      // Restock 50 bottles
      constrainedMaterials.set("raw-botol-250", {
        ...materials.get("raw-botol-250")!,
        stock: 50,
      });

      const afterRestock = calculateVariantReadiness(
        recipes.get("v-botol-250")!.ingredients,
        constrainedMaterials
      );
      expect(afterRestock.isAvailableByIngredients).toBe(true);
      expect(afterRestock.maxProducible).toBe(50);
    });
  });

  describe("Tier 4: Real-World Production Scenarios", () => {
    it("TC-S01: Peak Morning Rush — 10 consecutive diverse orders maintain perfect ledger consistency", () => {
      const inv = getFreshInventory();
      const initialTotalBeans = inv.rawMaterials.get("raw-robusta")!;
      let cumulativeBeansDepleted = 0;

      // 10 consecutive transactions
      const orders = [
        [{ productId: "p-coffee", variantId: "v-cup", qty: 2 }], // 20g
        [{ productId: "p-coffee", variantId: "v-botol-250", qty: 1 }], // 10g
        [{ productId: "p-coffee", variantId: "v-cup-large", qty: 3 }], // 39g
        [{ productId: "p-coffee", variantId: "v-botol-1000", qty: 2 }], // 80g
        [{ productId: "p-coffee", variantId: "v-cup", qty: 1 }], // 10g
        [{ productId: "p-coffee", variantId: "v-botol-250", qty: 2 }], // 20g
        [{ productId: "p-coffee", variantId: "v-cup", qty: 4 }], // 40g
        [{ productId: "p-coffee", variantId: "v-botol-1000", qty: 1 }], // 40g
        [{ productId: "p-coffee", variantId: "v-cup-large", qty: 1 }], // 13g
        [{ productId: "p-coffee", variantId: "v-botol-250", qty: 1 }], // 10g
      ];

      const expectedDepletionPerOrder = [20, 10, 39, 80, 10, 20, 40, 40, 13, 10];

      for (let i = 0; i < orders.length; i++) {
        simulatePosCheckout(orders[i], inv, recipes);
        cumulativeBeansDepleted += expectedDepletionPerOrder[i];
        expect(inv.rawMaterials.get("raw-robusta")).toBe(initialTotalBeans - cumulativeBeansDepleted);
      }

      // Total beans depleted = 282g
      expect(cumulativeBeansDepleted).toBe(282);
      expect(inv.rawMaterials.get("raw-robusta")).toBe(initialTotalBeans - 282);
    });

    it("TC-S02: Customer Order Cancellation & Packaging Variant Swap", () => {
      const inv = getFreshInventory();
      const originalCupStock = inv.rawMaterials.get("raw-cup-12")!;
      const originalBottleStock = inv.rawMaterials.get("raw-botol-250")!;

      // Customer orders 2 Cups
      const order1 = [{ productId: "p-coffee", variantId: "v-cup", qty: 2 }];
      simulatePosCheckout(order1, inv, recipes);
      expect(inv.rawMaterials.get("raw-cup-12")).toBe(originalCupStock - 2);

      // Customer changes mind -> Void order 1
      simulatePosVoid(order1, inv, recipes);
      expect(inv.rawMaterials.get("raw-cup-12")).toBe(originalCupStock);

      // Customer orders 2 Bottles 250 ML instead
      const order2 = [{ productId: "p-coffee", variantId: "v-botol-250", qty: 2 }];
      simulatePosCheckout(order2, inv, recipes);

      // Net result: cups completely untouched, bottles depleted by 2
      expect(inv.rawMaterials.get("raw-cup-12")).toBe(originalCupStock);
      expect(inv.rawMaterials.get("raw-botol-250")).toBe(originalBottleStock - 2);
    });

    it("TC-S03: Large Catering Pre-Order Allocation Calculation", () => {
      // 50 bottles of 1.000 ML
      const qty = 50;
      const recipe1000 = recipes.get("v-botol-1000")!;

      const requiredRobusta = recipe1000.ingredients.find(i => i.rawMaterialId === "raw-robusta")!.amount * qty;
      const requiredUht = recipe1000.ingredients.find(i => i.rawMaterialId === "raw-uht")!.amount * qty;
      const requiredBottles = recipe1000.ingredients.find(i => i.rawMaterialId === "raw-botol-1000")!.amount * qty;

      expect(requiredRobusta).toBe(2000); // 2 kg
      expect(requiredUht).toBe(12000); // 12 Liters
      expect(requiredBottles).toBe(50); // 50 bottles
    });
  });
}

if (process.argv[1]?.endsWith("scenarios_suite.ts")) {
  registerScenariosSuite();
  runAllSuites().then((success) => process.exit(success ? 0 : 1));
}
