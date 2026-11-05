/**
 * Master E2E Test Suite for Dua Carita Coffee POS & Inventory System
 * Runs all 4 Tiers of verification:
 *   - Tier 1: Feature Coverage (Schema contracts, HPP Engine, Stock Readiness, POS Depletion, Void Restoration)
 *   - Tier 2: Boundary & Corner Cases (Packaging isolation, zero costs, precision, bulk orders)
 *   - Tier 3: Cross-Feature Combinations (Simultaneous mixed checkout, restock flips, price updates)
 *   - Tier 4: Real-World Scenarios (Morning rush, barista morning audit, catering pre-orders, variant swaps)
 *   - Live Neon DB Health & Integration Inspection
 */

import { describe, it, expect, runAllSuites } from "./harness";
import { registerSchemaContractSuite } from "./schema_contract_suite";
import { registerHppReadinessSuite } from "./hpp_readiness_suite";
import { registerPosDepletionSuite } from "./pos_depletion_suite";
import { registerScenariosSuite } from "./scenarios_suite";
import { prisma } from "../../src/lib/prisma";

export function registerLiveDatabaseSuite() {
  describe("Tier 1: Live Neon PostgreSQL Database Health & Invariants", () => {
    it("TC-LIVE-01: Verifies active connection to Neon PostgreSQL", async () => {
      const productCount = await prisma.product.count();
      expect(typeof productCount).toBe("number");
      expect(productCount).toBeGreaterThan(0);
    });

    it("TC-LIVE-02: Verifies all 7 products have 4 variants each (28 variants total)", async () => {
      const variantCount = await prisma.productVariant.count();
      expect(variantCount).toBe(28);
    });

    it("TC-LIVE-03: Verifies distinct packaging classifications in live database", async () => {
      const packagingTypes = await prisma.productVariant.findMany({
        select: { packaging: true },
        distinct: ["packaging"],
      });
      const names = packagingTypes.map((p) => p.packaging);
      expect(names).toContain("Cup");
      expect(names).toContain("Botol");
    });

    it("TC-LIVE-04: Verifies distinct size classifications in live database", async () => {
      const sizes = await prisma.productVariant.findMany({
        select: { size: true },
        distinct: ["size"],
      });
      const sizeNames = sizes.map((s) => s.size);
      expect(sizeNames).toContain("Reguler");
      expect(sizeNames).toContain("Large");
      expect(sizeNames).toContain("250 ML");
      expect(sizeNames).toContain("1.000 ML");
    });

    it("TC-LIVE-05: Verifies RawMaterial catalog contains both food ingredients and packaging", async () => {
      const materials = await prisma.rawMaterial.findMany({
        select: { name: true, category: true, costPerUnit: true },
      });
      const materialNames = materials.map((m) => m.name);

      // Must have beverage ingredients
      expect(materialNames.some((n) => n.includes("Robusta"))).toBe(true);
      expect(materialNames.some((n) => n.includes("UHT"))).toBe(true);

      // Must have physical packaging
      expect(materialNames.some((n) => n.includes("Cup"))).toBe(true);
      expect(materialNames.some((n) => n.includes("Botol"))).toBe(true);
    });
  });
}

async function main() {
  console.log("Initializing Dua Carita Coffee Master E2E Suite...");

  // Register all modular test suites
  registerSchemaContractSuite();
  registerHppReadinessSuite();
  registerPosDepletionSuite();
  registerScenariosSuite();
  registerLiveDatabaseSuite();

  try {
    const success = await runAllSuites();
    await prisma.$disconnect();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error("Master E2E Suite encountered unhandled fatal exception:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
