import { describe, it, expect, runAllSuites } from "./harness";

export interface DepletionItem {
  productId: string;
  variantId: string;
  qty: number;
}

export interface InventoryState {
  rawMaterials: Map<string, number>;
  productStocks: Map<string, number>;
  variantStocks: Map<string, number>;
}

export interface VariantRecipe {
  variantId: string;
  productId: string;
  ingredients: { rawMaterialId: string; amount: number }[];
}

/**
 * Authoritative POS Inventory Depletion Simulation
 */
export function simulatePosCheckout(
  items: DepletionItem[],
  inventory: InventoryState,
  recipes: Map<string, VariantRecipe>
): {
  depletedMaterials: Map<string, number>;
  success: boolean;
  error?: string;
} {
  const requiredMaterials = new Map<string, number>();

  // 1. Calculate required materials strictly from variant recipes
  for (const item of items) {
    if (item.qty <= 0) {
      return { depletedMaterials: new Map(), success: false, error: "Invalid item quantity" };
    }

    const recipe = recipes.get(item.variantId);
    if (!recipe) {
      return { depletedMaterials: new Map(), success: false, error: `Recipe not found for variant ${item.variantId}` };
    }

    for (const ing of recipe.ingredients) {
      const current = requiredMaterials.get(ing.rawMaterialId) || 0;
      requiredMaterials.set(ing.rawMaterialId, current + ing.amount * item.qty);
    }
  }

  // 2. Apply stock deductions
  for (const [matId, amount] of requiredMaterials.entries()) {
    const currentStock = inventory.rawMaterials.get(matId) || 0;
    inventory.rawMaterials.set(matId, currentStock - amount);
  }

  for (const item of items) {
    const prodStock = inventory.productStocks.get(item.productId) || 0;
    inventory.productStocks.set(item.productId, prodStock - item.qty);

    const varStock = inventory.variantStocks.get(item.variantId) || 0;
    inventory.variantStocks.set(item.variantId, varStock - item.qty);
  }

  return { depletedMaterials: requiredMaterials, success: true };
}

/**
 * Authoritative POS Void / Stock Restoration Simulation
 */
export function simulatePosVoid(
  items: DepletionItem[],
  inventory: InventoryState,
  recipes: Map<string, VariantRecipe>
): {
  restoredMaterials: Map<string, number>;
  success: boolean;
} {
  const restoredMaterials = new Map<string, number>();

  for (const item of items) {
    const recipe = recipes.get(item.variantId);
    if (recipe) {
      for (const ing of recipe.ingredients) {
        const toRestore = ing.amount * item.qty;
        const current = restoredMaterials.get(ing.rawMaterialId) || 0;
        restoredMaterials.set(ing.rawMaterialId, current + toRestore);

        const currentStock = inventory.rawMaterials.get(ing.rawMaterialId) || 0;
        inventory.rawMaterials.set(ing.rawMaterialId, currentStock + toRestore);
      }
    }

    const prodStock = inventory.productStocks.get(item.productId) || 0;
    inventory.productStocks.set(item.productId, prodStock + item.qty);

    const varStock = inventory.variantStocks.get(item.variantId) || 0;
    inventory.variantStocks.set(item.variantId, varStock + item.qty);
  }

  return { restoredMaterials, success: true };
}

export function registerPosDepletionSuite() {
  const recipes = new Map<string, VariantRecipe>([
    [
      "var-cup-reg",
      {
        variantId: "var-cup-reg",
        productId: "prod-aren",
        ingredients: [
          { rawMaterialId: "mat-robusta", amount: 10 },
          { rawMaterialId: "mat-uht", amount: 40 },
          { rawMaterialId: "mat-cup-12", amount: 1 },
          { rawMaterialId: "mat-tutup-cup", amount: 1 },
        ],
      },
    ],
    [
      "var-botol-250",
      {
        variantId: "var-botol-250",
        productId: "prod-aren",
        ingredients: [
          { rawMaterialId: "mat-robusta", amount: 10 },
          { rawMaterialId: "mat-uht", amount: 60 },
          { rawMaterialId: "mat-botol-250", amount: 1 },
          { rawMaterialId: "mat-stiker-250", amount: 1 },
        ],
      },
    ],
    [
      "var-botol-1000",
      {
        variantId: "var-botol-1000",
        productId: "prod-aren",
        ingredients: [
          { rawMaterialId: "mat-robusta", amount: 40 },
          { rawMaterialId: "mat-uht", amount: 240 },
          { rawMaterialId: "mat-botol-1000", amount: 1 },
          { rawMaterialId: "mat-stiker-1000", amount: 1 },
        ],
      },
    ],
  ]);

  function createInitialInventory(): InventoryState {
    return {
      rawMaterials: new Map([
        ["mat-robusta", 1000],
        ["mat-uht", 5000],
        ["mat-cup-12", 200],
        ["mat-tutup-cup", 200],
        ["mat-botol-250", 100],
        ["mat-stiker-250", 100],
        ["mat-botol-1000", 50],
        ["mat-stiker-1000", 50],
      ]),
      productStocks: new Map([["prod-aren", 100]]),
      variantStocks: new Map([
        ["var-cup-reg", 50],
        ["var-botol-250", 30],
        ["var-botol-1000", 20],
      ]),
    };
  }

  describe("Tier 1: Feature 7 — Variant-Aware POS Inventory Depletion", () => {
    it("TC-F07-01: Ordering Cup Reguler deducts cups and leaves bottle packaging untouched", () => {
      const inv = createInitialInventory();
      const order = [{ productId: "prod-aren", variantId: "var-cup-reg", qty: 2 }];

      const result = simulatePosCheckout(order, inv, recipes);
      expect(result.success).toBe(true);

      // Cups & lids deducted by 2
      expect(inv.rawMaterials.get("mat-cup-12")).toBe(198);
      expect(inv.rawMaterials.get("mat-tutup-cup")).toBe(198);

      // Bottles and stickers MUST BE 100% UNCHANGED
      expect(inv.rawMaterials.get("mat-botol-250")).toBe(100);
      expect(inv.rawMaterials.get("mat-stiker-250")).toBe(100);
      expect(inv.rawMaterials.get("mat-botol-1000")).toBe(50);
      expect(inv.rawMaterials.get("mat-stiker-1000")).toBe(50);

      // Coffee beans: 2 * 10g = 20g deducted
      expect(inv.rawMaterials.get("mat-robusta")).toBe(980);
    });

    it("TC-F07-02: Ordering Botol 1.000 ML deducts 1L bottle and scaled 40g coffee beans", () => {
      const inv = createInitialInventory();
      const order = [{ productId: "prod-aren", variantId: "var-botol-1000", qty: 1 }];

      const result = simulatePosCheckout(order, inv, recipes);
      expect(result.success).toBe(true);

      // 1L bottle and sticker deducted by 1
      expect(inv.rawMaterials.get("mat-botol-1000")).toBe(49);
      expect(inv.rawMaterials.get("mat-stiker-1000")).toBe(49);

      // Cups and lids UNTOUCHED
      expect(inv.rawMaterials.get("mat-cup-12")).toBe(200);
      expect(inv.rawMaterials.get("mat-tutup-cup")).toBe(200);

      // Coffee beans deducted by 40g (not 10g single cup!)
      expect(inv.rawMaterials.get("mat-robusta")).toBe(960);
      // UHT milk deducted by 240ml
      expect(inv.rawMaterials.get("mat-uht")).toBe(4760);
    });

    it("TC-F07-03: Decrements both Product.stock and ProductVariant.stock by ordered quantity", () => {
      const inv = createInitialInventory();
      const order = [{ productId: "prod-aren", variantId: "var-botol-250", qty: 3 }];

      simulatePosCheckout(order, inv, recipes);

      // Product stock: 100 - 3 = 97
      expect(inv.productStocks.get("prod-aren")).toBe(97);
      // Variant stock: 30 - 3 = 27
      expect(inv.variantStocks.get("var-botol-250")).toBe(27);
      // Other variant stocks unchanged
      expect(inv.variantStocks.get("var-cup-reg")).toBe(50);
      expect(inv.variantStocks.get("var-botol-1000")).toBe(20);
    });

    it("TC-F07-04: Rejects order with zero or negative quantity", () => {
      const inv = createInitialInventory();
      const invalidOrder = [{ productId: "prod-aren", variantId: "var-cup-reg", qty: 0 }];

      const result = simulatePosCheckout(invalidOrder, inv, recipes);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid item quantity");
    });

    it("TC-F07-05: Rejects order when variant has no valid recipe registered", () => {
      const inv = createInitialInventory();
      const ghostOrder = [{ productId: "prod-aren", variantId: "var-unknown", qty: 1 }];

      const result = simulatePosCheckout(ghostOrder, inv, recipes);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Recipe not found");
    });
  });

  describe("Tier 1: Feature 8 — Order Void & Stock Restoration Conservation Law", () => {
    it("TC-F08-01: Voiding an order completely restores raw materials to initial baseline", () => {
      const inv = createInitialInventory();
      const initialRobusta = inv.rawMaterials.get("mat-robusta")!;
      const initialCups = inv.rawMaterials.get("mat-cup-12")!;

      const order = [{ productId: "prod-aren", variantId: "var-cup-reg", qty: 5 }];

      // Checkout
      simulatePosCheckout(order, inv, recipes);
      expect(inv.rawMaterials.get("mat-robusta")).toBe(initialRobusta - 50);

      // Void
      simulatePosVoid(order, inv, recipes);

      // Law of conservation: net delta == 0
      expect(inv.rawMaterials.get("mat-robusta")).toBe(initialRobusta);
      expect(inv.rawMaterials.get("mat-cup-12")).toBe(initialCups);
    });

    it("TC-F08-02: Voiding restores product and variant stocks accurately", () => {
      const inv = createInitialInventory();
      const order = [{ productId: "prod-aren", variantId: "var-botol-1000", qty: 2 }];

      simulatePosCheckout(order, inv, recipes);
      expect(inv.variantStocks.get("var-botol-1000")).toBe(18);

      simulatePosVoid(order, inv, recipes);
      expect(inv.variantStocks.get("var-botol-1000")).toBe(20);
      expect(inv.productStocks.get("prod-aren")).toBe(100);
    });

    it("TC-F08-03: Multi-item mixed order checkout and void maintains zero net delta", () => {
      const inv = createInitialInventory();
      const snapshot = new Map(inv.rawMaterials);

      const mixedOrder = [
        { productId: "prod-aren", variantId: "var-cup-reg", qty: 3 },
        { productId: "prod-aren", variantId: "var-botol-250", qty: 2 },
        { productId: "prod-aren", variantId: "var-botol-1000", qty: 1 },
      ];

      simulatePosCheckout(mixedOrder, inv, recipes);
      simulatePosVoid(mixedOrder, inv, recipes);

      for (const [matId, initialVal] of snapshot.entries()) {
        expect(inv.rawMaterials.get(matId)).toBe(initialVal);
      }
    });

    it("TC-F08-04: Partial item void restores only the voided item materials", () => {
      const inv = createInitialInventory();
      const mixedOrder = [
        { productId: "prod-aren", variantId: "var-cup-reg", qty: 2 },
        { productId: "prod-aren", variantId: "var-botol-1000", qty: 1 },
      ];

      simulatePosCheckout(mixedOrder, inv, recipes);

      // Void ONLY the 1L bottle item
      const voidItem = [{ productId: "prod-aren", variantId: "var-botol-1000", qty: 1 }];
      simulatePosVoid(voidItem, inv, recipes);

      // Botol 1000 ML restored to initial 50
      expect(inv.rawMaterials.get("mat-botol-1000")).toBe(50);
      // Cup 12 Oz remains depleted (200 - 2 = 198)
      expect(inv.rawMaterials.get("mat-cup-12")).toBe(198);
    });

    it("TC-F08-05: Historical void with missing recipe behaves safely without crashing", () => {
      const inv = createInitialInventory();
      const historicalItem = [{ productId: "prod-aren", variantId: "historical-null", qty: 1 }];

      // Should not throw
      const result = simulatePosVoid(historicalItem, inv, recipes);
      expect(result.success).toBe(true);
    });
  });
}

if (process.argv[1]?.endsWith("pos_depletion_suite.ts")) {
  registerPosDepletionSuite();
  runAllSuites().then((success) => process.exit(success ? 0 : 1));
}
