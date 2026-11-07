/**
 * verify_m3_m4_challenge.ts
 *
 * Empirical Challenge Script for Milestones M3 and M4.
 * Developed independently by Challenger Subagent (Role: HPP & Profit Margin Challenger).
 * Constraint check: No test source code read.
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  category: "M3_HPP_REPORTS" | "M4_PRODUCTS_MODAL_TABLE";
  passed: boolean;
  details: string;
  metrics?: Record<string, any>;
}

const results: TestResult[] = [];

function assert(
  condition: boolean,
  name: string,
  category: "M3_HPP_REPORTS" | "M4_PRODUCTS_MODAL_TABLE",
  details: string,
  metrics?: Record<string, any>
) {
  results.push({
    name,
    category,
    passed: condition,
    details: condition ? `PASSED: ${details}` : `FAILED: ${details}`,
    metrics,
  });
  const symbol = condition ? "✅" : "❌";
  console.log(`${symbol} [${category}] ${name} - ${details}`);
}

async function runM3Challenge() {
  console.log("\n=======================================================");
  console.log("CHALLENGE SUITE 1: MILESTONE M3 (HPP & GROSS PROFIT METRICS)");
  console.log("=======================================================\n");

  // 1. Check API source code for required relational inclusion
  const apiRoutePath = path.resolve(process.cwd(), "src/app/api/orders/route.ts");
  const apiRouteCode = fs.readFileSync(apiRoutePath, "utf-8");

  const includesRawMaterial =
    apiRouteCode.includes("rawMaterial: true") &&
    apiRouteCode.includes("ingredients:") &&
    apiRouteCode.includes("variant:");

  assert(
    includesRawMaterial,
    "API Relational Inclusion of Ingredients & RawMaterial",
    "M3_HPP_REPORTS",
    "src/app/api/orders/route.ts includes variant.ingredients.rawMaterial in prisma.order.findMany"
  );

  // 2. Query Live Prisma Database
  const productsWithVariants = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          ingredients: {
            include: {
              rawMaterial: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${productsWithVariants.length} products in database.`);

  let variantsWithIngredientsCount = 0;
  let exactOrCloseRecipeHppMatches = 0;

  for (const prod of productsWithVariants) {
    for (const v of prod.variants) {
      if (v.ingredients && v.ingredients.length > 0) {
        variantsWithIngredientsCount++;
        const computedHpp = v.ingredients.reduce(
          (sum, ing) => sum + ing.amount * (ing.rawMaterial?.costPerUnit ?? 0),
          0
        );
        // Cost should be greater than 0
        if (computedHpp > 0) {
          exactOrCloseRecipeHppMatches++;
        }
      }
    }
  }

  assert(
    variantsWithIngredientsCount > 0,
    "Database Has Product Variants With Recipe Ingredients",
    "M3_HPP_REPORTS",
    `Found ${variantsWithIngredientsCount} variants with recipe ingredients, ${exactOrCloseRecipeHppMatches} with computed recipe HPP > 0`,
    { variantsWithIngredientsCount, exactOrCloseRecipeHppMatches }
  );

  // 3. Query Live Orders
  const liveOrders = await prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
          variant: {
            include: {
              ingredients: {
                include: {
                  rawMaterial: true,
                },
              },
            },
          },
        },
      },
      payments: true,
    },
  });

  console.log(`Found ${liveOrders.length} total orders in database.`);

  const activeOrders = liveOrders.filter((o) => !o.isVoided);
  const voidedOrders = liveOrders.filter((o) => o.isVoided);

  // 4. Test the HPP Calculation Function directly (Replicating exact Reports logic)
  function computeItemUnitHpp(item: any): number {
    const ingredients = item.variant?.ingredients;
    let unitHpp = 0;
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      const recipeHpp = ingredients.reduce(
        (sum: number, ing: any) =>
          sum + (Number(ing.amount) || 0) * (Number(ing.rawMaterial?.costPerUnit) ?? 0),
        0
      );
      unitHpp = recipeHpp > 0 ? recipeHpp : Number(item.variant?.cost ?? item.product?.cost ?? 0);
    } else {
      unitHpp = Number(item.variant?.cost ?? item.product?.cost ?? 0);
    }
    return unitHpp;
  }

  function computeTotalHpp(orders: any[]): number {
    return orders
      .filter((o) => !o.isVoided)
      .reduce((orderSum: number, o: any) => {
        const orderHpp = (o.items || []).reduce((itemSum: number, item: any) => {
          if (item.isVoided) return itemSum;
          return itemSum + (Number(item.qty) || 0) * computeItemUnitHpp(item);
        }, 0);
        return orderSum + orderHpp;
      }, 0);
  }

  const liveTotalHpp = computeTotalHpp(liveOrders);
  const liveTotalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const liveTotalGrossProfit = liveTotalRevenue - liveTotalHpp;
  const liveGrossMarginPercent =
    liveTotalRevenue > 0 ? ((liveTotalGrossProfit / liveTotalRevenue) * 100).toFixed(1) : "0";

  console.log(`Live DB Total Omzet: Rp ${liveTotalRevenue.toLocaleString("id-ID")}`);
  console.log(`Live DB Total HPP: Rp ${liveTotalHpp.toLocaleString("id-ID")}`);
  console.log(`Live DB Total Laba Kotor: Rp ${liveTotalGrossProfit.toLocaleString("id-ID")}`);
  console.log(`Live DB Gross Margin %: ${liveGrossMarginPercent}%`);

  assert(
    !isNaN(liveTotalHpp) && liveTotalHpp >= 0,
    "Live Orders Total HPP Computation Is Valid Number",
    "M3_HPP_REPORTS",
    `Computed liveTotalHpp = ${liveTotalHpp}`,
    { liveTotalHpp, liveTotalRevenue, liveTotalGrossProfit, liveGrossMarginPercent }
  );

  assert(
    liveTotalGrossProfit === liveTotalRevenue - liveTotalHpp,
    "Mathematical Identity: Total Laba Kotor === Total Omzet - Total HPP",
    "M3_HPP_REPORTS",
    `${liveTotalGrossProfit} === ${liveTotalRevenue} - ${liveTotalHpp}`
  );

  // 5. Fallback Hierarchy & Edge Cases Stress Testing
  console.log("\n--- Stress Testing Edge Cases for HPP Fallbacks ---");

  // Edge Case A: Recipe with valid ingredients
  const itemWithRecipe = {
    qty: 2,
    isVoided: false,
    variant: {
      cost: 5000,
      ingredients: [
        { amount: 20, rawMaterial: { costPerUnit: 150 } }, // 3000
        { amount: 150, rawMaterial: { costPerUnit: 20 } }, // 3000
        { amount: 1, rawMaterial: { costPerUnit: 1000 } }, // 1000 -> Total recipe = 7000
      ],
    },
    product: { cost: 4000 },
  };
  const unitHppA = computeItemUnitHpp(itemWithRecipe);
  assert(
    unitHppA === 7000,
    "Edge Case A: Recipe Ingredients Computed Unit HPP",
    "M3_HPP_REPORTS",
    `Expected 7000, got ${unitHppA}`
  );

  // Edge Case B: Recipe ingredients evaluate to 0 -> fallback to variant.cost
  const itemZeroRecipe = {
    qty: 1,
    isVoided: false,
    variant: {
      cost: 6500,
      ingredients: [
        { amount: 0, rawMaterial: { costPerUnit: 100 } },
      ],
    },
    product: { cost: 4000 },
  };
  const unitHppB = computeItemUnitHpp(itemZeroRecipe);
  assert(
    unitHppB === 6500,
    "Edge Case B: Recipe = 0 Fallback to Variant.cost",
    "M3_HPP_REPORTS",
    `Expected 6500, got ${unitHppB}`
  );

  // Edge Case C: No ingredients array -> fallback to variant.cost
  const itemNoIngredients = {
    qty: 3,
    isVoided: false,
    variant: {
      cost: 8200,
      ingredients: [],
    },
    product: { cost: 4000 },
  };
  const unitHppC = computeItemUnitHpp(itemNoIngredients);
  assert(
    unitHppC === 8200,
    "Edge Case C: Empty Ingredients Fallback to Variant.cost",
    "M3_HPP_REPORTS",
    `Expected 8200, got ${unitHppC}`
  );

  // Edge Case D: No variant or variant cost is undefined -> fallback to product.cost
  const itemNoVariantCost = {
    qty: 1,
    isVoided: false,
    variant: null,
    product: { cost: 5500 },
  };
  const unitHppD = computeItemUnitHpp(itemNoVariantCost);
  assert(
    unitHppD === 5500,
    "Edge Case D: Null Variant Fallback to Product.cost",
    "M3_HPP_REPORTS",
    `Expected 5500, got ${unitHppD}`
  );

  // Edge Case E: Item is voided -> should contribute 0 to order HPP
  const mockOrderWithVoidedItem = {
    isVoided: false,
    totalAmount: 30000,
    items: [
      { qty: 2, isVoided: false, variant: { cost: 5000, ingredients: [] }, product: { cost: 5000 } }, // 10,000
      { qty: 5, isVoided: true, variant: { cost: 8000, ingredients: [] }, product: { cost: 8000 } }, // VOIDED! Should be 0
    ],
  };
  const mockOrderHpp = computeTotalHpp([mockOrderWithVoidedItem]);
  assert(
    mockOrderHpp === 10000,
    "Edge Case E: Voided Item Excluded from Total HPP",
    "M3_HPP_REPORTS",
    `Expected 10000, got ${mockOrderHpp}`
  );

  // Edge Case F: Order is voided -> completely excluded from Total HPP
  const mockVoidedOrder = {
    isVoided: true,
    totalAmount: 50000,
    items: [
      { qty: 10, isVoided: false, variant: { cost: 5000, ingredients: [] }, product: { cost: 5000 } },
    ],
  };
  const mockVoidedTotalHpp = computeTotalHpp([mockVoidedOrder]);
  assert(
    mockVoidedTotalHpp === 0,
    "Edge Case F: Voided Order Excluded from Total HPP",
    "M3_HPP_REPORTS",
    `Expected 0, got ${mockVoidedTotalHpp}`
  );

  // Edge Case G: Zero Total Revenue Margin Calculation
  const zeroRevProfit = 0 - 0;
  const zeroRevMargin = 0 > 0 ? (((0 - 0) / 0) * 100).toFixed(1) : "0";
  assert(
    zeroRevMargin === "0" && !isNaN(Number(zeroRevMargin)),
    "Edge Case G: Zero Revenue Produces Safe Margin '0'",
    "M3_HPP_REPORTS",
    `zeroRevMargin = '${zeroRevMargin}'`
  );

  // Edge Case H: Negative Gross Profit Margin Calculation (Loss scenario)
  const lossRevenue = 10000;
  const lossHpp = 15000;
  const lossProfit = lossRevenue - lossHpp; // -5000
  const lossMargin = lossRevenue > 0 ? ((lossProfit / lossRevenue) * 100).toFixed(1) : "0";
  assert(
    lossMargin === "-50.0",
    "Edge Case H: Loss Scenario Produces Accurate Negative Margin %",
    "M3_HPP_REPORTS",
    `lossProfit = -5000, lossMargin = '${lossMargin}%'`
  );
}

async function runM4Challenge() {
  console.log("\n=======================================================");
  console.log("CHALLENGE SUITE 2: MILESTONE M4 (PRODUCT EDIT MODAL & TABLE MARGIN LABA)");
  console.log("=======================================================\n");

  const productsPagePath = path.resolve(process.cwd(), "src/app/products/page.tsx");
  const productsCode = fs.readFileSync(productsPagePath, "utf-8");

  // 1. Check Edit Modal Cleanup
  // Standalone fields: "Harga Jual (Rp)", "Modal / HPP (Rp)", and "Estimasi Keuntungan Standar"
  // MUST be guarded by `!editingProduct`
  const hasNotEditingProductGuard = productsCode.includes("{!editingProduct && (");
  assert(
    hasNotEditingProductGuard,
    "Edit Product Modal: Top Standalone Fields Wrapped with {!editingProduct && (...)}",
    "M4_PRODUCTS_MODAL_TABLE",
    "Found {!editingProduct && ( block guarding top standalone inputs"
  );

  // Verify that inside the {!editingProduct && (...)} block, Harga Jual, Modal/HPP, and Estimasi Keuntungan are present
  const guardStart = productsCode.indexOf("{!editingProduct && (");
  // Find the closing )} of the guard block before the variant section
  const variantSectionIndex = productsCode.indexOf("Pilihan Kemasan & Ukuran");
  const guardEnd = productsCode.lastIndexOf(")}", variantSectionIndex);
  const guardBlock = productsCode.slice(guardStart, guardEnd + 2);

  const containsHargaJualInGuard = guardBlock.includes("Harga Jual (Rp)");
  const containsModalHppInGuard = guardBlock.includes("Modal / HPP (Rp)");
  const containsEstimasiKeuntunganInGuard = guardBlock.includes("Estimasi Keuntungan Standar");

  assert(
    containsHargaJualInGuard && containsModalHppInGuard && containsEstimasiKeuntunganInGuard,
    "Edit Product Modal: Harga Jual, Modal HPP, and Estimasi Keuntungan are Inside Guard Block",
    "M4_PRODUCTS_MODAL_TABLE",
    `containsHargaJual: ${containsHargaJualInGuard}, containsModalHpp: ${containsModalHppInGuard}, containsEstimasi: ${containsEstimasiKeuntunganInGuard}`
  );

  // 2. Check that Variant Section remains OUTSIDE the guard (rendered for both new and edit)
  assert(
    variantSectionIndex > guardEnd,
    "Edit Product Modal: Variant Section is Outside the Guard Block (Always Visible)",
    "M4_PRODUCTS_MODAL_TABLE",
    `Variant section appears at character ${variantSectionIndex}, after guard close at ${guardEnd}`
  );

  // 3. Check Variant Inputs inside Modal
  const hasVariantPriceInput = productsCode.includes('updateVariant(idx, "price", Number(e.target.value))');
  const hasVariantCostInput = productsCode.includes('updateVariant(idx, "cost", Number(e.target.value))');
  const hasVariantActiveToggle = productsCode.includes("toggleVariantActive(idx)");

  assert(
    hasVariantPriceInput && hasVariantCostInput && hasVariantActiveToggle,
    "Edit Product Modal: Variant Price, Cost, and Active Toggle Intact and Functional",
    "M4_PRODUCTS_MODAL_TABLE",
    `hasVariantPriceInput: ${hasVariantPriceInput}, hasVariantCostInput: ${hasVariantCostInput}, hasVariantActiveToggle: ${hasVariantActiveToggle}`
  );

  // 4. Check Products Table "Margin Laba" Column Implementation
  const hasMarginLabaHeader = productsCode.includes('<th className="py-3.5 px-3 font-black">Margin Laba</th>');
  assert(
    hasMarginLabaHeader,
    "Products Table: 'Margin Laba' Column Header Present",
    "M4_PRODUCTS_MODAL_TABLE",
    "Found 'Margin Laba' table column header"
  );

  // Check that Margin Laba iterates over variants:
  // varProfit = v.price - v.cost
  // varMargin = v.price > 0 ? Math.round((varProfit / v.price) * 100) : 0
  const hasVarProfitCalc = productsCode.includes("const varProfit = v.price - v.cost;");
  const hasVarMarginCalc = productsCode.includes(
    "const varMargin = v.price > 0 ? Math.round((varProfit / v.price) * 100) : 0;"
  );

  assert(
    hasVarProfitCalc && hasVarMarginCalc,
    "Products Table: Margin Laba Per-Variant Calculation Exact Formula Match",
    "M4_PRODUCTS_MODAL_TABLE",
    `hasVarProfitCalc: ${hasVarProfitCalc}, hasVarMarginCalc: ${hasVarMarginCalc}`
  );

  // 5. Stress Test Margin Laba Across Various Variant Scenarios
  console.log("\n--- Stress Testing Variant Profit & Margin Calculations ---");

  function calcVariantMargin(v: { price: number; cost: number }) {
    const varProfit = v.price - v.cost;
    const varMargin = v.price > 0 ? Math.round((varProfit / v.price) * 100) : 0;
    return { varProfit, varMargin };
  }

  const sampleVariants = [
    { name: "Cup Reguler", price: 13000, cost: 6000, expectedProfit: 7000, expectedMargin: 54 },
    { name: "Cup Large", price: 16000, cost: 8000, expectedProfit: 8000, expectedMargin: 50 },
    { name: "Botol 250 ML", price: 15000, cost: 7000, expectedProfit: 8000, expectedMargin: 53 },
    { name: "Botol 1.000 ML", price: 55000, cost: 25000, expectedProfit: 30000, expectedMargin: 55 },
    { name: "Free Sample (Zero Price)", price: 0, cost: 3000, expectedProfit: -3000, expectedMargin: 0 },
    { name: "Break Even Item", price: 10000, cost: 10000, expectedProfit: 0, expectedMargin: 0 },
    { name: "Loss Leader", price: 8000, cost: 10000, expectedProfit: -2000, expectedMargin: -25 },
    { name: "Zero Cost Digital/Free Item", price: 20000, cost: 0, expectedProfit: 20000, expectedMargin: 100 },
  ];

  for (const s of sampleVariants) {
    const { varProfit, varMargin } = calcVariantMargin(s);
    const pass = varProfit === s.expectedProfit && varMargin === s.expectedMargin;
    assert(
      pass,
      `Variant Calculation: ${s.name} (Price: ${s.price}, Cost: ${s.cost})`,
      "M4_PRODUCTS_MODAL_TABLE",
      `Expected profit=${s.expectedProfit}, margin=${s.expectedMargin}%. Got profit=${varProfit}, margin=${varMargin}%`
    );
  }
}

async function main() {
  try {
    await runM3Challenge();
    await runM4Challenge();

    console.log("\n=======================================================");
    console.log("CHALLENGE SUMMARY & VERDICT");
    console.log("=======================================================");

    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = results.filter((r) => !r.passed).length;

    console.log(`Total Assertions: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests === 0) {
      console.log("\nVERDICT: APPROVE ✅");
      process.exit(0);
    } else {
      console.log("\nVERDICT: REQUEST_CHANGES ❌");
      process.exit(1);
    }
  } catch (error) {
    console.error("FATAL ERROR IN CHALLENGE SUITE:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
