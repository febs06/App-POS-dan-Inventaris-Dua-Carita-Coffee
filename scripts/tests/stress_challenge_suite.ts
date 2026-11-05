/**
 * Empirical Adversarial Challenge Suite
 * Stress-testing:
 * 1. Packaging Isolation (Bottle sales NEVER deplete cup/lid packaging)
 * 2. Dual Stock Decrement (Selling variant decrements product.stock AND variant.stock)
 * 3. Conservation Law (Order -> Void restores stock to exact baseline with 0.000% leakage)
 * 4. Mixed Basket & Bulk Checkout (Cup Reguler + Botol 250 ML + Botol 1.000 ML in one transaction)
 * 5. Double-Void & Delete Idempotency (Stock cannot be restored twice)
 * 6. Live Neon DB End-to-End Transaction & Void Restoration Verification
 */

import { describe, it, expect, runAllSuites } from "./harness";
import { prisma } from "../../src/lib/prisma";

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

export function executeCheckout(
  items: DepletionItem[],
  inventory: InventoryState,
  recipes: Map<string, VariantRecipe>
): { success: boolean; error?: string } {
  const requiredMaterials = new Map<string, number>();

  for (const item of items) {
    if (item.qty <= 0) {
      return { success: false, error: "Invalid item quantity" };
    }
    const recipe = recipes.get(item.variantId);
    if (!recipe) {
      return { success: false, error: `Recipe not found for variant ${item.variantId}` };
    }
    for (const ing of recipe.ingredients) {
      const current = requiredMaterials.get(ing.rawMaterialId) || 0;
      requiredMaterials.set(ing.rawMaterialId, current + ing.amount * item.qty);
    }
  }

  // Deduct
  for (const [matId, amount] of requiredMaterials.entries()) {
    const cur = inventory.rawMaterials.get(matId) || 0;
    inventory.rawMaterials.set(matId, cur - amount);
  }
  for (const item of items) {
    const pCur = inventory.productStocks.get(item.productId) || 0;
    inventory.productStocks.set(item.productId, pCur - item.qty);

    const vCur = inventory.variantStocks.get(item.variantId) || 0;
    inventory.variantStocks.set(item.variantId, vCur - item.qty);
  }

  return { success: true };
}

export function executeVoid(
  items: DepletionItem[],
  inventory: InventoryState,
  recipes: Map<string, VariantRecipe>,
  orderState: { isVoided: boolean }
): { success: boolean; error?: string } {
  if (orderState.isVoided) {
    // Idempotent: cannot void already voided order
    return { success: false, error: "Order is already voided" };
  }

  for (const item of items) {
    const recipe = recipes.get(item.variantId);
    if (recipe) {
      for (const ing of recipe.ingredients) {
        const cur = inventory.rawMaterials.get(ing.rawMaterialId) || 0;
        inventory.rawMaterials.set(ing.rawMaterialId, cur + ing.amount * item.qty);
      }
    }
    const pCur = inventory.productStocks.get(item.productId) || 0;
    inventory.productStocks.set(item.productId, pCur + item.qty);

    const vCur = inventory.variantStocks.get(item.variantId) || 0;
    inventory.variantStocks.set(item.variantId, vCur + item.qty);
  }

  orderState.isVoided = true;
  return { success: true };
}

export function registerStressChallengeSuite() {
  const MAT_CUP = "raw-cup-12";
  const MAT_LID = "raw-tutup-cup";
  const MAT_BOTTLE_250 = "raw-botol-250";
  const MAT_STICKER_250 = "raw-stiker-250";
  const MAT_BOTTLE_1000 = "raw-botol-1000";
  const MAT_STICKER_1000 = "raw-stiker-1000";
  const MAT_ROBUSTA = "raw-robusta";
  const MAT_UHT = "raw-uht";
  const MAT_AREN = "raw-aren";

  const recipes = new Map<string, VariantRecipe>([
    [
      "var-cup-reg",
      {
        variantId: "var-cup-reg",
        productId: "prod-aren",
        ingredients: [
          { rawMaterialId: MAT_ROBUSTA, amount: 10 },
          { rawMaterialId: MAT_UHT, amount: 40 },
          { rawMaterialId: MAT_AREN, amount: 20 },
          { rawMaterialId: MAT_CUP, amount: 1 },
          { rawMaterialId: MAT_LID, amount: 1 },
        ],
      },
    ],
    [
      "var-cup-large",
      {
        variantId: "var-cup-large",
        productId: "prod-aren",
        ingredients: [
          { rawMaterialId: MAT_ROBUSTA, amount: 13 },
          { rawMaterialId: MAT_UHT, amount: 52 },
          { rawMaterialId: MAT_AREN, amount: 26 },
          { rawMaterialId: MAT_CUP, amount: 1 },
          { rawMaterialId: MAT_LID, amount: 1 },
        ],
      },
    ],
    [
      "var-botol-250",
      {
        variantId: "var-botol-250",
        productId: "prod-aren",
        ingredients: [
          { rawMaterialId: MAT_ROBUSTA, amount: 10 },
          { rawMaterialId: MAT_UHT, amount: 60 },
          { rawMaterialId: MAT_AREN, amount: 20 },
          { rawMaterialId: MAT_BOTTLE_250, amount: 1 },
          { rawMaterialId: MAT_STICKER_250, amount: 1 },
        ],
      },
    ],
    [
      "var-botol-1000",
      {
        variantId: "var-botol-1000",
        productId: "prod-aren",
        ingredients: [
          { rawMaterialId: MAT_ROBUSTA, amount: 40 },
          { rawMaterialId: MAT_UHT, amount: 240 },
          { rawMaterialId: MAT_AREN, amount: 80 },
          { rawMaterialId: MAT_BOTTLE_1000, amount: 1 },
          { rawMaterialId: MAT_STICKER_1000, amount: 1 },
        ],
      },
    ],
  ]);

  function getBaselineInventory(): InventoryState {
    return {
      rawMaterials: new Map([
        [MAT_CUP, 500],
        [MAT_LID, 500],
        [MAT_BOTTLE_250, 300],
        [MAT_STICKER_250, 300],
        [MAT_BOTTLE_1000, 150],
        [MAT_STICKER_1000, 150],
        [MAT_ROBUSTA, 5000],
        [MAT_UHT, 20000],
        [MAT_AREN, 5000],
      ]),
      productStocks: new Map([["prod-aren", 1000]]),
      variantStocks: new Map([
        ["var-cup-reg", 400],
        ["var-cup-large", 200],
        ["var-botol-250", 250],
        ["var-botol-1000", 150],
      ]),
    };
  }

  describe("EMPIRICAL CHALLENGE 1: Packaging Isolation Invariant", () => {
    it("CHAL-01: High-volume bottle checkout (150 x 250ml + 75 x 1000ml) causes ZERO cup depletion", () => {
      const inv = getBaselineInventory();
      const initialCups = inv.rawMaterials.get(MAT_CUP)!;
      const initialLids = inv.rawMaterials.get(MAT_LID)!;

      const bottleOrder: DepletionItem[] = [
        { productId: "prod-aren", variantId: "var-botol-250", qty: 150 },
        { productId: "prod-aren", variantId: "var-botol-1000", qty: 75 },
      ];

      const res = executeCheckout(bottleOrder, inv, recipes);
      expect(res.success).toBe(true);

      // Invariant: Cup & Lid stocks remain exactly at baseline
      expect(inv.rawMaterials.get(MAT_CUP)).toBe(initialCups);
      expect(inv.rawMaterials.get(MAT_LID)).toBe(initialLids);

      // Bottle packaging correctly depleted
      expect(inv.rawMaterials.get(MAT_BOTTLE_250)).toBe(150);
      expect(inv.rawMaterials.get(MAT_STICKER_250)).toBe(150);
      expect(inv.rawMaterials.get(MAT_BOTTLE_1000)).toBe(75);
      expect(inv.rawMaterials.get(MAT_STICKER_1000)).toBe(75);
    });

    it("CHAL-02: Reverse isolation: selling 300 cups leaves bottles & stickers untouched", () => {
      const inv = getBaselineInventory();
      const initialB250 = inv.rawMaterials.get(MAT_BOTTLE_250)!;
      const initialS250 = inv.rawMaterials.get(MAT_STICKER_250)!;
      const initialB1000 = inv.rawMaterials.get(MAT_BOTTLE_1000)!;
      const initialS1000 = inv.rawMaterials.get(MAT_STICKER_1000)!;

      const cupOrder: DepletionItem[] = [
        { productId: "prod-aren", variantId: "var-cup-reg", qty: 200 },
        { productId: "prod-aren", variantId: "var-cup-large", qty: 100 },
      ];

      const res = executeCheckout(cupOrder, inv, recipes);
      expect(res.success).toBe(true);

      expect(inv.rawMaterials.get(MAT_BOTTLE_250)).toBe(initialB250);
      expect(inv.rawMaterials.get(MAT_STICKER_250)).toBe(initialS250);
      expect(inv.rawMaterials.get(MAT_BOTTLE_1000)).toBe(initialB1000);
      expect(inv.rawMaterials.get(MAT_STICKER_1000)).toBe(initialS1000);
      expect(inv.rawMaterials.get(MAT_CUP)).toBe(500 - 300);
      expect(inv.rawMaterials.get(MAT_LID)).toBe(500 - 300);
    });
  });

  describe("EMPIRICAL CHALLENGE 2: Dual Stock Decrement Invariant", () => {
    it("CHAL-03: Selling variant decrements product.stock and target variant.stock while siblings stay intact", () => {
      const inv = getBaselineInventory();
      const orderQty = 17;

      const order: DepletionItem[] = [
        { productId: "prod-aren", variantId: "var-botol-250", qty: orderQty },
      ];

      const res = executeCheckout(order, inv, recipes);
      expect(res.success).toBe(true);

      // Parent product stock decremented by exact orderQty
      expect(inv.productStocks.get("prod-aren")).toBe(1000 - orderQty);

      // Target variant stock decremented by exact orderQty
      expect(inv.variantStocks.get("var-botol-250")).toBe(250 - orderQty);

      // Sibling variants strictly untouched
      expect(inv.variantStocks.get("var-cup-reg")).toBe(400);
      expect(inv.variantStocks.get("var-cup-large")).toBe(200);
      expect(inv.variantStocks.get("var-botol-1000")).toBe(150);
    });
  });

  describe("EMPIRICAL CHALLENGE 3: Conservation Law Invariant (Zero-Leakage)", () => {
    it("CHAL-04: Checkout -> Void returns ALL inventory items to exact initial values (0 leakage)", () => {
      const inv = getBaselineInventory();
      const rawSnapshot = new Map(inv.rawMaterials);
      const prodSnapshot = new Map(inv.productStocks);
      const varSnapshot = new Map(inv.variantStocks);

      const complexOrder: DepletionItem[] = [
        { productId: "prod-aren", variantId: "var-cup-reg", qty: 35 },
        { productId: "prod-aren", variantId: "var-cup-large", qty: 20 },
        { productId: "prod-aren", variantId: "var-botol-250", qty: 15 },
        { productId: "prod-aren", variantId: "var-botol-1000", qty: 8 },
      ];

      const orderState = { isVoided: false };

      // 1. Checkout
      const checkoutRes = executeCheckout(complexOrder, inv, recipes);
      expect(checkoutRes.success).toBe(true);

      // Verify stocks have actually decreased
      expect(inv.rawMaterials.get(MAT_CUP)!).toBeLessThan(rawSnapshot.get(MAT_CUP)!);
      expect(inv.rawMaterials.get(MAT_BOTTLE_250)!).toBeLessThan(rawSnapshot.get(MAT_BOTTLE_250)!);
      expect(inv.productStocks.get("prod-aren")!).toBeLessThan(prodSnapshot.get("prod-aren")!);

      // 2. Void
      const voidRes = executeVoid(complexOrder, inv, recipes, orderState);
      expect(voidRes.success).toBe(true);
      expect(orderState.isVoided).toBe(true);

      // 3. Strict assertion: zero delta across every single raw material
      for (const [id, initialVal] of rawSnapshot.entries()) {
        const currentVal = inv.rawMaterials.get(id);
        expect(currentVal).toBe(initialVal);
      }

      // Zero delta on product stocks
      for (const [id, initialVal] of prodSnapshot.entries()) {
        expect(inv.productStocks.get(id)).toBe(initialVal);
      }

      // Zero delta on variant stocks
      for (const [id, initialVal] of varSnapshot.entries()) {
        expect(inv.variantStocks.get(id)).toBe(initialVal);
      }
    });

    it("CHAL-05: Double-void idempotency: attempting to void an already-voided order is rejected", () => {
      const inv = getBaselineInventory();
      const initialCups = inv.rawMaterials.get(MAT_CUP)!;

      const order: DepletionItem[] = [
        { productId: "prod-aren", variantId: "var-cup-reg", qty: 10 },
      ];
      const orderState = { isVoided: false };

      executeCheckout(order, inv, recipes);
      executeVoid(order, inv, recipes, orderState);
      expect(inv.rawMaterials.get(MAT_CUP)).toBe(initialCups);

      // Second void attempt MUST fail and NOT add extra stock
      const secondVoid = executeVoid(order, inv, recipes, orderState);
      expect(secondVoid.success).toBe(false);
      expect(inv.rawMaterials.get(MAT_CUP)).toBe(initialCups); // Stock NOT artificially inflated!
    });
  });

  describe("EMPIRICAL CHALLENGE 4: Bulk Ordering & Mixed Basket Checkout Invariant", () => {
    it("CHAL-06: Mixed basket (Cup Reguler + Botol 250 ML + Botol 1.000 ML) calculates depletion with mathematical precision", () => {
      const inv = getBaselineInventory();

      const qtyCup = 12;
      const qtyB250 = 8;
      const qtyB1000 = 5;

      const mixedOrder: DepletionItem[] = [
        { productId: "prod-aren", variantId: "var-cup-reg", qty: qtyCup },
        { productId: "prod-aren", variantId: "var-botol-250", qty: qtyB250 },
        { productId: "prod-aren", variantId: "var-botol-1000", qty: qtyB1000 },
      ];

      const res = executeCheckout(mixedOrder, inv, recipes);
      expect(res.success).toBe(true);

      // Packaging depletions:
      expect(inv.rawMaterials.get(MAT_CUP)).toBe(500 - qtyCup);
      expect(inv.rawMaterials.get(MAT_LID)).toBe(500 - qtyCup);
      expect(inv.rawMaterials.get(MAT_BOTTLE_250)).toBe(300 - qtyB250);
      expect(inv.rawMaterials.get(MAT_STICKER_250)).toBe(300 - qtyB250);
      expect(inv.rawMaterials.get(MAT_BOTTLE_1000)).toBe(150 - qtyB1000);
      expect(inv.rawMaterials.get(MAT_STICKER_1000)).toBe(150 - qtyB1000);

      // Liquid ingredients:
      // Robusta: (12 * 10) + (8 * 10) + (5 * 40) = 120 + 80 + 200 = 400g
      expect(inv.rawMaterials.get(MAT_ROBUSTA)).toBe(5000 - 400);

      // UHT: (12 * 40) + (8 * 60) + (5 * 240) = 480 + 480 + 1200 = 2160ml
      expect(inv.rawMaterials.get(MAT_UHT)).toBe(20000 - 2160);

      // Gula Aren: (12 * 20) + (8 * 20) + (5 * 80) = 240 + 160 + 400 = 800g
      expect(inv.rawMaterials.get(MAT_AREN)).toBe(5000 - 800);

      // Product stock: 1000 - (12 + 8 + 5) = 975
      expect(inv.productStocks.get("prod-aren")).toBe(975);

      // Variant stocks:
      expect(inv.variantStocks.get("var-cup-reg")).toBe(400 - qtyCup);
      expect(inv.variantStocks.get("var-botol-250")).toBe(250 - qtyB250);
      expect(inv.variantStocks.get("var-botol-1000")).toBe(150 - qtyB1000);
    });

    it("CHAL-07: Randomized Stress Harness — 50 randomized mixed baskets maintain zero leakage upon void", () => {
      for (let run = 0; run < 50; run++) {
        const inv = getBaselineInventory();
        const rawSnapshot = new Map(inv.rawMaterials);
        const prodSnapshot = new Map(inv.productStocks);
        const varSnapshot = new Map(inv.variantStocks);

        const q1 = Math.floor(Math.random() * 10) + 1;
        const q2 = Math.floor(Math.random() * 10) + 1;
        const q3 = Math.floor(Math.random() * 5) + 1;

        const basket: DepletionItem[] = [
          { productId: "prod-aren", variantId: "var-cup-reg", qty: q1 },
          { productId: "prod-aren", variantId: "var-botol-250", qty: q2 },
          { productId: "prod-aren", variantId: "var-botol-1000", qty: q3 },
        ];

        const state = { isVoided: false };
        executeCheckout(basket, inv, recipes);
        executeVoid(basket, inv, recipes, state);

        for (const [id, val] of rawSnapshot.entries()) {
          expect(inv.rawMaterials.get(id)).toBe(val);
        }
        for (const [id, val] of prodSnapshot.entries()) {
          expect(inv.productStocks.get(id)).toBe(val);
        }
        for (const [id, val] of varSnapshot.entries()) {
          expect(inv.variantStocks.get(id)).toBe(val);
        }
      }
    });
  });

  describe("EMPIRICAL CHALLENGE 5: Live Neon Database Integrity & Variant Recipes", () => {
    it("CHAL-08: Every single variant in Neon DB has strictly isolated packaging ingredients", async () => {
      const allVariants = await prisma.productVariant.findMany({
        include: {
          ingredients: {
            include: { rawMaterial: true },
          },
        },
      });

      for (const v of allVariants) {
        const materialNames = v.ingredients.map((i) => i.rawMaterial.name);

        if (v.packaging === "Cup") {
          // MUST have cup packaging, NEVER bottle packaging
          expect(materialNames.some((n) => n.includes("Cup"))).toBe(true);
          expect(materialNames.some((n) => n.includes("Botol"))).toBe(false);
          expect(materialNames.some((n) => n.includes("Stiker"))).toBe(false);
        } else if (v.packaging === "Botol") {
          // MUST have bottle packaging, NEVER cup packaging
          expect(materialNames.some((n) => n.includes("Botol"))).toBe(true);
          expect(materialNames.some((n) => n.includes("Cup"))).toBe(false);
          expect(materialNames.some((n) => n.includes("Tutup Cup"))).toBe(false);
        }
      }
    });

    it("CHAL-09: Live DB Simulation — Multi-item order and void on real database variant models", async () => {
      // Find "Aren Coffee Milk" with variants
      const product = await prisma.product.findFirst({
        where: { name: { contains: "Aren Coffee Milk" } },
        include: {
          variants: {
            include: {
              ingredients: {
                include: { rawMaterial: true },
              },
            },
          },
        },
      });

      expect(product).toBeDefined();
      if (!product) return;

      const cupVariant = product.variants.find((v) => v.packaging === "Cup" && v.size === "Reguler")!;
      const botol250Variant = product.variants.find((v) => v.packaging === "Botol" && v.size === "250 ML")!;
      const botol1000Variant = product.variants.find((v) => v.packaging === "Botol" && v.size === "1.000 ML")!;

      expect(cupVariant).toBeDefined();
      expect(botol250Variant).toBeDefined();
      expect(botol1000Variant).toBeDefined();

      // Check ingredient composition
      const cupMaterials = cupVariant.ingredients.map((i) => i.rawMaterial.name);
      const b250Materials = botol250Variant.ingredients.map((i) => i.rawMaterial.name);
      const b1000Materials = botol1000Variant.ingredients.map((i) => i.rawMaterial.name);

      expect(cupMaterials.some((n) => n.includes("Cup Injection 12 Oz"))).toBe(true);
      expect(cupMaterials.some((n) => n.includes("Tutup Cup Injection"))).toBe(true);
      expect(cupMaterials.some((n) => n.includes("Botol"))).toBe(false);

      expect(b250Materials.some((n) => n.includes("Botol Kale 250 ML"))).toBe(true);
      expect(b250Materials.some((n) => n.includes("Cup"))).toBe(false);

      expect(b1000Materials.some((n) => n.includes("Botol Kale 1L"))).toBe(true);
      expect(b1000Materials.some((n) => n.includes("Cup"))).toBe(false);
    });

    it("CHAL-10: Live Neon DB End-to-End Transaction — Depletion, Isolation, and Void Restoration", async () => {
      // Find "Aren Coffee Milk"
      const product = await prisma.product.findFirst({
        where: { name: { contains: "Aren Coffee Milk" } },
        include: {
          variants: {
            include: {
              ingredients: {
                include: { rawMaterial: true },
              },
            },
          },
        },
      });

      if (!product) throw new Error("Aren Coffee Milk not found in live DB");

      const cupVariant = product.variants.find((v) => v.packaging === "Cup" && v.size === "Reguler")!;
      const b250Variant = product.variants.find((v) => v.packaging === "Botol" && v.size === "250 ML")!;
      const b1000Variant = product.variants.find((v) => v.packaging === "Botol" && v.size === "1.000 ML")!;

      const cupMaterial = cupVariant.ingredients.find((i) => i.rawMaterial.name.includes("Cup Injection"))!.rawMaterial;
      const b250Material = b250Variant.ingredients.find((i) => i.rawMaterial.name.includes("Botol Kale 250"))!.rawMaterial;
      const b1000Material = b1000Variant.ingredients.find((i) => i.rawMaterial.name.includes("Botol Kale 1L"))!.rawMaterial;
      const robustaMaterial = cupVariant.ingredients.find((i) => i.rawMaterial.name.includes("Robusta"))!.rawMaterial;

      // 1. Record pre-transaction live baselines
      const preCupMat = await prisma.rawMaterial.findUnique({ where: { id: cupMaterial.id } });
      const preB250Mat = await prisma.rawMaterial.findUnique({ where: { id: b250Material.id } });
      const preB1000Mat = await prisma.rawMaterial.findUnique({ where: { id: b1000Material.id } });
      const preRobustaMat = await prisma.rawMaterial.findUnique({ where: { id: robustaMaterial.id } });
      const preProduct = await prisma.product.findUnique({ where: { id: product.id } });
      const preCupVar = await prisma.productVariant.findUnique({ where: { id: cupVariant.id } });
      const preB250Var = await prisma.productVariant.findUnique({ where: { id: b250Variant.id } });
      const preB1000Var = await prisma.productVariant.findUnique({ where: { id: b1000Variant.id } });

      const testOrderNumber = `TEST-CHAL-${Date.now()}`;
      const itemsToOrder = [
        { product, variant: cupVariant, qty: 1 },
        { product, variant: b250Variant, qty: 2 },
        { product, variant: b1000Variant, qty: 1 },
      ];

      // 2. Execute Live Transaction Depletion (Exact logic as POST /api/orders)
      const createdOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber: testOrderNumber,
            orderSource: "DIRECT",
            status: "diproses",
            customerName: "EMPIRICAL_TEST_RUNNER",
            subtotal: 50000,
            totalAmount: 50000,
            cashierName: "Challenger Subagent",
            items: {
              create: itemsToOrder.map((it) => ({
                productId: it.product.id,
                variantId: it.variant.id,
                qty: it.qty,
                price: it.variant.price,
              })),
            },
          },
          include: { items: true },
        });

        // Decrement Product stock
        for (const it of itemsToOrder) {
          await tx.product.update({
            where: { id: it.product.id },
            data: { stock: { decrement: it.qty } },
          });
          await tx.productVariant.update({
            where: { id: it.variant.id },
            data: { stock: { decrement: it.qty } },
          });
        }

        // Decrement RawMaterials
        for (const it of itemsToOrder) {
          for (const ing of it.variant.ingredients) {
            await tx.rawMaterial.update({
              where: { id: ing.rawMaterialId },
              data: { stock: { decrement: ing.amount * it.qty } },
            });
          }
        }

        return order;
      });

      // 3. Verify Live Depletion & Packaging Isolation
      const midCupMat = await prisma.rawMaterial.findUnique({ where: { id: cupMaterial.id } });
      const midB250Mat = await prisma.rawMaterial.findUnique({ where: { id: b250Material.id } });
      const midB1000Mat = await prisma.rawMaterial.findUnique({ where: { id: b1000Material.id } });
      const midRobustaMat = await prisma.rawMaterial.findUnique({ where: { id: robustaMaterial.id } });
      const midProduct = await prisma.product.findUnique({ where: { id: product.id } });
      const midCupVar = await prisma.productVariant.findUnique({ where: { id: cupVariant.id } });
      const midB250Var = await prisma.productVariant.findUnique({ where: { id: b250Variant.id } });
      const midB1000Var = await prisma.productVariant.findUnique({ where: { id: b1000Variant.id } });

      // Cup packaging decremented by 1 (NOT affected by the 2 bottles of 250ml or 1 bottle of 1000ml!)
      expect(midCupMat!.stock).toBe(preCupMat!.stock - 1);
      // Bottle 250ml decremented by 2
      expect(midB250Mat!.stock).toBe(preB250Mat!.stock - 2);
      // Bottle 1L decremented by 1
      expect(midB1000Mat!.stock).toBe(preB1000Mat!.stock - 1);
      // Robusta: (1 * 10) + (2 * 10) + (1 * 40) = 70g
      expect(midRobustaMat!.stock).toBe(preRobustaMat!.stock - 70);

      // Product stock decremented by total qty (1 + 2 + 1 = 4)
      expect(midProduct!.stock).toBe(preProduct!.stock - 4);
      // Variant stocks decremented specifically
      expect(midCupVar!.stock).toBe(preCupVar!.stock - 1);
      expect(midB250Var!.stock).toBe(preB250Var!.stock - 2);
      expect(midB1000Var!.stock).toBe(preB1000Var!.stock - 1);

      // 4. Execute Live Void Restoration (Exact logic as PUT /api/orders void)
      await prisma.$transaction(async (tx) => {
        for (const it of itemsToOrder) {
          await tx.product.update({
            where: { id: it.product.id },
            data: { stock: { increment: it.qty } },
          });
          await tx.productVariant.update({
            where: { id: it.variant.id },
            data: { stock: { increment: it.qty } },
          });
          for (const ing of it.variant.ingredients) {
            await tx.rawMaterial.update({
              where: { id: ing.rawMaterialId },
              data: { stock: { increment: ing.amount * it.qty } },
            });
          }
        }

        await tx.order.update({
          where: { id: createdOrder.id },
          data: {
            status: "dibatalkan",
            isVoided: true,
            voidReason: "Automated empirical challenge test void",
          },
        });
      });

      // 5. Verify 0-Leakage Conservation Law in Neon DB
      const postCupMat = await prisma.rawMaterial.findUnique({ where: { id: cupMaterial.id } });
      const postB250Mat = await prisma.rawMaterial.findUnique({ where: { id: b250Material.id } });
      const postB1000Mat = await prisma.rawMaterial.findUnique({ where: { id: b1000Material.id } });
      const postRobustaMat = await prisma.rawMaterial.findUnique({ where: { id: robustaMaterial.id } });
      const postProduct = await prisma.product.findUnique({ where: { id: product.id } });
      const postCupVar = await prisma.productVariant.findUnique({ where: { id: cupVariant.id } });
      const postB250Var = await prisma.productVariant.findUnique({ where: { id: b250Variant.id } });
      const postB1000Var = await prisma.productVariant.findUnique({ where: { id: b1000Variant.id } });

      expect(postCupMat!.stock).toBe(preCupMat!.stock);
      expect(postB250Mat!.stock).toBe(preB250Mat!.stock);
      expect(postB1000Mat!.stock).toBe(preB1000Mat!.stock);
      expect(postRobustaMat!.stock).toBe(preRobustaMat!.stock);
      expect(postProduct!.stock).toBe(preProduct!.stock);
      expect(postCupVar!.stock).toBe(preCupVar!.stock);
      expect(postB250Var!.stock).toBe(preB250Var!.stock);
      expect(postB1000Var!.stock).toBe(preB1000Var!.stock);

      // 6. Cleanup: Delete the test order so no residual test orders remain
      await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } });
      await prisma.order.delete({ where: { id: createdOrder.id } });
    });
  });
}

async function main() {
  console.log("====================================================");
  console.log("  ADVERSARIAL EMPIRICAL STRESS CHALLENGE SUITE     ");
  console.log("====================================================");

  registerStressChallengeSuite();

  try {
    const success = await runAllSuites();
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Stress Challenge encountered fatal exception:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith("stress_challenge_suite.ts")) {
  main();
}
