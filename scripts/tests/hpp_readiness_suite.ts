import { describe, it, expect, runAllSuites } from "./harness";

// Core calculation helpers representing the authoritative specification in PROJECT.md
export interface RawMaterialItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  costPerUnit: number;
}

export interface VariantIngredientItem {
  rawMaterialId: string;
  amount: number;
}

export interface VariantItem {
  id: string;
  productId: string;
  packaging: string;
  size: string;
  price: number;
  cost: number;
  stock: number;
  ingredients: VariantIngredientItem[];
}

/**
 * Authoritative HPP calculation: sum of (amount * costPerUnit)
 */
export function calculateVariantHpp(
  ingredients: VariantIngredientItem[],
  materialMap: Map<string, RawMaterialItem>
): number {
  if (!ingredients || ingredients.length === 0) return 0;
  let total = 0;
  for (const ing of ingredients) {
    const raw = materialMap.get(ing.rawMaterialId);
    if (raw && raw.costPerUnit > 0) {
      total += ing.amount * raw.costPerUnit;
    }
  }
  return Number(total.toFixed(2));
}

/**
 * Authoritative Variant Stock Readiness Calculation
 */
export function calculateVariantReadiness(
  ingredients: VariantIngredientItem[],
  materialMap: Map<string, RawMaterialItem>
): {
  isAvailableByIngredients: boolean;
  missingIngredients: string[];
  maxProducible: number | null;
} {
  if (!ingredients || ingredients.length === 0) {
    return {
      isAvailableByIngredients: true,
      missingIngredients: [],
      maxProducible: null,
    };
  }

  let isAvailable = true;
  const missing: string[] = [];
  const limits: number[] = [];

  for (const ing of ingredients) {
    const raw = materialMap.get(ing.rawMaterialId);
    const stock = raw?.stock ?? 0;
    const required = ing.amount;

    if (stock < required) {
      isAvailable = false;
      missing.push(
        `${raw?.name || "Bahan"} (Sisa: ${stock} ${raw?.unit || ""}, Butuh: ${required} ${raw?.unit || ""})`
      );
    }

    if (required > 0) {
      limits.push(Math.floor(stock / required));
    }
  }

  return {
    isAvailableByIngredients: isAvailable,
    missingIngredients: missing,
    maxProducible: limits.length > 0 ? Math.min(...limits) : null,
  };
}

export function registerHppReadinessSuite() {
  // Authoritative Dua Carita Materials Catalog
  const sampleMaterials = new Map<string, RawMaterialItem>([
    ["raw-robusta", { id: "raw-robusta", name: "Kopi Robusta", category: "Bahan Minuman", unit: "gram", stock: 1000, costPerUnit: 159.0 }],
    ["raw-uht", { id: "raw-uht", name: "Susu UHT", category: "Bahan Minuman", unit: "ml", stock: 5000, costPerUnit: 19.5 }],
    ["raw-rich", { id: "raw-rich", name: "Rich Milk", category: "Bahan Minuman", unit: "ml", stock: 3000, costPerUnit: 22.5 }],
    ["raw-creamer", { id: "raw-creamer", name: "Creamer", category: "Bahan Minuman", unit: "gram", stock: 2000, costPerUnit: 46.0 }],
    ["raw-air", { id: "raw-air", name: "Air", category: "Bahan Minuman", unit: "ml", stock: 20000, costPerUnit: 0.3125 }],
    ["raw-aren", { id: "raw-aren", name: "Gula Aren", category: "Bahan Minuman", unit: "gram", stock: 1500, costPerUnit: 22.0 }],
    ["raw-cup-12", { id: "raw-cup-12", name: "Cup Injection 12 Oz", category: "Kemasan & Packaging", unit: "pcs", stock: 500, costPerUnit: 1036.0 }],
    ["raw-tutup-cup", { id: "raw-tutup-cup", name: "Tutup Cup Injection", category: "Kemasan & Packaging", unit: "pcs", stock: 500, costPerUnit: 440.0 }],
    ["raw-botol-250", { id: "raw-botol-250", name: "Botol 250 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 200, costPerUnit: 1075.0 }],
    ["raw-stiker-250", { id: "raw-stiker-250", name: "Stiker 250 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 200, costPerUnit: 555.56 }],
    ["raw-botol-1000", { id: "raw-botol-1000", name: "Botol 1000 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 100, costPerUnit: 2800.0 }],
    ["raw-stiker-1000", { id: "raw-stiker-1000", name: "Stiker 1000 ML", category: "Kemasan & Packaging", unit: "pcs", stock: 100, costPerUnit: 1071.43 }],
  ]);

  // Recipes per Variant
  const cupRegulerIngredients: VariantIngredientItem[] = [
    { rawMaterialId: "raw-robusta", amount: 10 },
    { rawMaterialId: "raw-uht", amount: 40 },
    { rawMaterialId: "raw-rich", amount: 25 },
    { rawMaterialId: "raw-creamer", amount: 20 },
    { rawMaterialId: "raw-air", amount: 90 },
    { rawMaterialId: "raw-aren", amount: 20 },
    { rawMaterialId: "raw-cup-12", amount: 1 },
    { rawMaterialId: "raw-tutup-cup", amount: 1 },
  ];

  const botol250Ingredients: VariantIngredientItem[] = [
    { rawMaterialId: "raw-robusta", amount: 10 },
    { rawMaterialId: "raw-uht", amount: 60 },
    { rawMaterialId: "raw-rich", amount: 50 },
    { rawMaterialId: "raw-creamer", amount: 25 },
    { rawMaterialId: "raw-air", amount: 115 },
    { rawMaterialId: "raw-aren", amount: 20 },
    { rawMaterialId: "raw-botol-250", amount: 1 },
    { rawMaterialId: "raw-stiker-250", amount: 1 },
  ];

  const botol1000Ingredients: VariantIngredientItem[] = [
    { rawMaterialId: "raw-robusta", amount: 40 },
    { rawMaterialId: "raw-uht", amount: 240 },
    { rawMaterialId: "raw-rich", amount: 200 },
    { rawMaterialId: "raw-creamer", amount: 100 },
    { rawMaterialId: "raw-air", amount: 460 },
    { rawMaterialId: "raw-aren", amount: 80 },
    { rawMaterialId: "raw-botol-1000", amount: 1 },
    { rawMaterialId: "raw-stiker-1000", amount: 1 },
  ];

  describe("Tier 1: Feature 5 — Accurate HPP Calculation Engine", () => {
    it("TC-F05-01: Correctly calculates Cup Reguler HPP including cup + lid packaging", () => {
      const hpp = calculateVariantHpp(cupRegulerIngredients, sampleMaterials);
      // Beverage: 1590 + 780 + 562.5 + 920 + 28.125 + 440 = 4320.625
      // Packaging: 1036 + 440 = 1476.00
      // Total expected = 5796.63
      expect(hpp).toBeGreaterThan(5700);
      expect(hpp).toBeLessThan(5900);
      expect(hpp).toBeCloseTo(5796.63, 1.0);
    });

    it("TC-F05-02: Correctly calculates Botol 250 ML HPP including bottle + sticker", () => {
      const hpp = calculateVariantHpp(botol250Ingredients, sampleMaterials);
      // Beverage: (10*159) + (60*19.5) + (50*22.5) + (25*46) + (115*0.3125) + (20*22) = 5510.94
      // Packaging: 1075 + 555.56 = 1630.56
      // Total expected = 7141.50
      expect(hpp).toBeGreaterThan(7000);
      expect(hpp).toBeLessThan(7300);
      expect(hpp).toBeCloseTo(7141.50, 2.0);
    });

    it("TC-F05-03: Correctly calculates Botol 1.000 ML HPP with scaled 4x beverage + 1L packaging", () => {
      const hpp = calculateVariantHpp(botol1000Ingredients, sampleMaterials);
      // Beverage: (40*159) + (240*19.5) + (200*22.5) + (100*46) + (460*0.3125) + (80*22) = 22043.75
      // Packaging: 2800 + 1071.43 = 3871.43
      // Total expected = 25915.18
      expect(hpp).toBeGreaterThan(25000);
      expect(hpp).toBeLessThan(27000);
      expect(hpp).toBeCloseTo(25915.18, 5.0);
    });

    it("TC-F05-04: Packaging price increase reflects only in the affected packaging variant", () => {
      const modifiedMaterials = new Map(sampleMaterials);
      // Simulate Botol 1000 ML packaging supplier price increase (+500 IDR)
      modifiedMaterials.set("raw-botol-1000", {
        ...sampleMaterials.get("raw-botol-1000")!,
        costPerUnit: 3300.0,
      });

      const cupHpp = calculateVariantHpp(cupRegulerIngredients, modifiedMaterials);
      const bottle250Hpp = calculateVariantHpp(botol250Ingredients, modifiedMaterials);
      const bottle1000Hpp = calculateVariantHpp(botol1000Ingredients, modifiedMaterials);

      // Cup and 250 ML should be 100% unchanged
      expect(cupHpp).toBe(calculateVariantHpp(cupRegulerIngredients, sampleMaterials));
      expect(bottle250Hpp).toBe(calculateVariantHpp(botol250Ingredients, sampleMaterials));

      // Botol 1000 ML should increase by exactly 500 IDR
      const originalBottle1000 = calculateVariantHpp(botol1000Ingredients, sampleMaterials);
      expect(bottle1000Hpp).toBeCloseTo(originalBottle1000 + 500, 0.01);
    });

    it("TC-F05-05: Beverage raw material cost increase propagates to all variants proportionally", () => {
      const modifiedMaterials = new Map(sampleMaterials);
      // Increase coffee beans cost by +10 IDR per gram (from 159 to 169)
      modifiedMaterials.set("raw-robusta", {
        ...sampleMaterials.get("raw-robusta")!,
        costPerUnit: 169.0,
      });

      const cupHpp = calculateVariantHpp(cupRegulerIngredients, modifiedMaterials);
      const botol1000Hpp = calculateVariantHpp(botol1000Ingredients, modifiedMaterials);

      // Cup has 10g coffee -> +100 IDR
      const origCup = calculateVariantHpp(cupRegulerIngredients, sampleMaterials);
      expect(cupHpp).toBeCloseTo(origCup + 100, 0.01);

      // 1000ml bottle has 40g coffee -> +400 IDR
      const orig1000 = calculateVariantHpp(botol1000Ingredients, sampleMaterials);
      expect(botol1000Hpp).toBeCloseTo(orig1000 + 400, 0.01);
    });
  });

  describe("Tier 1: Feature 6 — Variant Stock Readiness Engine", () => {
    it("TC-F06-01: Accurately identifies maxProducible based on the limiting bottleneck ingredient", () => {
      const constrainedMaterials = new Map(sampleMaterials);
      // Only 50 pcs of Cup Injection 12 Oz available
      constrainedMaterials.set("raw-cup-12", {
        ...sampleMaterials.get("raw-cup-12")!,
        stock: 50,
      });

      const readiness = calculateVariantReadiness(cupRegulerIngredients, constrainedMaterials);
      expect(readiness.isAvailableByIngredients).toBe(true);
      expect(readiness.maxProducible).toBe(50);
      expect(readiness.missingIngredients.length).toBe(0);
    });

    it("TC-F06-02: Zero bottle stock makes bottle unavailable while cup remains fully available", () => {
      const constrainedMaterials = new Map(sampleMaterials);
      // Botol 1000 ML out of stock (0 pcs)
      constrainedMaterials.set("raw-botol-1000", {
        ...sampleMaterials.get("raw-botol-1000")!,
        stock: 0,
      });

      const bottleReadiness = calculateVariantReadiness(botol1000Ingredients, constrainedMaterials);
      const cupReadiness = calculateVariantReadiness(cupRegulerIngredients, constrainedMaterials);

      // Bottle variant is UNAVAILABLE
      expect(bottleReadiness.isAvailableByIngredients).toBe(false);
      expect(bottleReadiness.maxProducible).toBe(0);
      expect(bottleReadiness.missingIngredients.length).toBe(1);
      expect(bottleReadiness.missingIngredients[0]).toContain("Botol 1000 ML");

      // Cup variant remains 100% AVAILABLE
      expect(cupReadiness.isAvailableByIngredients).toBe(true);
      expect(cupReadiness.maxProducible).toBeGreaterThan(0);
    });

    it("TC-F06-03: Shared beverage ingredient deficit affects all dependent variants", () => {
      const constrainedMaterials = new Map(sampleMaterials);
      // Coffee Robusta stock = 5g (Cup needs 10g, Bottle needs 40g)
      constrainedMaterials.set("raw-robusta", {
        ...sampleMaterials.get("raw-robusta")!,
        stock: 5,
      });

      const cupReadiness = calculateVariantReadiness(cupRegulerIngredients, constrainedMaterials);
      const bottleReadiness = calculateVariantReadiness(botol1000Ingredients, constrainedMaterials);

      expect(cupReadiness.isAvailableByIngredients).toBe(false);
      expect(bottleReadiness.isAvailableByIngredients).toBe(false);
      expect(cupReadiness.missingIngredients[0]).toContain("Kopi Robusta");
      expect(bottleReadiness.missingIngredients[0]).toContain("Kopi Robusta");
    });

    it("TC-F06-04: Returns missingIngredients with precise deficit descriptions", () => {
      const constrainedMaterials = new Map(sampleMaterials);
      constrainedMaterials.set("raw-rich", {
        ...sampleMaterials.get("raw-rich")!,
        stock: 10, // needs 25ml for cup
      });

      const readiness = calculateVariantReadiness(cupRegulerIngredients, constrainedMaterials);
      expect(readiness.isAvailableByIngredients).toBe(false);
      expect(readiness.missingIngredients.length).toBe(1);
      expect(readiness.missingIngredients[0]).toContain("Rich Milk");
      expect(readiness.missingIngredients[0]).toContain("Sisa: 10 ml");
      expect(readiness.missingIngredients[0]).toContain("Butuh: 25 ml");
    });

    it("TC-F06-05: Handles empty recipes gracefully with maxProducible = null", () => {
      const readiness = calculateVariantReadiness([], sampleMaterials);
      expect(readiness.isAvailableByIngredients).toBe(true);
      expect(readiness.missingIngredients.length).toBe(0);
      expect(readiness.maxProducible).toBeNull();
    });
  });
}

if (process.argv[1]?.endsWith("hpp_readiness_suite.ts")) {
  registerHppReadinessSuite();
  runAllSuites().then((success) => process.exit(success ? 0 : 1));
}
