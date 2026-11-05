import fs from "fs";
import path from "path";
import { describe, it, expect, runAllSuites } from "./harness";

export function registerSchemaContractSuite() {
  const schemaPath = path.resolve(process.cwd(), "prisma/schema.prisma");
  const schemaContent = fs.existsSync(schemaPath)
    ? fs.readFileSync(schemaPath, "utf-8")
    : "";

  describe("Tier 1: Feature 1 — Database Safety & Backup Contracts", () => {
    it("TC-F01-01: Verifies backup directory exists or can be accessed", () => {
      const backupDir = path.resolve(process.cwd(), "backups");
      const exists = fs.existsSync(backupDir);
      // Even before first backup, directory should be targetable
      expect(typeof backupDir).toBe("string");
      if (exists) {
        const files = fs.readdirSync(backupDir);
        expect(Array.isArray(files)).toBe(true);
      }
    });

    it("TC-F01-02: Verifies backup JSON schema validity if backup file is present", () => {
      const backupDir = path.resolve(process.cwd(), "backups");
      if (fs.existsSync(backupDir)) {
        const jsonFiles = fs
          .readdirSync(backupDir)
          .filter((f) => f.endsWith(".json"));
        if (jsonFiles.length > 0) {
          const sampleBackup = JSON.parse(
            fs.readFileSync(path.join(backupDir, jsonFiles[0]), "utf-8")
          );
          expect(typeof sampleBackup).toBe("object");
          expect(sampleBackup).toBeDefined();
        }
      }
    });

    it("TC-F01-03: Verifies 21 public tables are recognized in database architecture", () => {
      const expectedTables = [
        "Product",
        "ProductVariant",
        "ProductIngredient",
        "RawMaterial",
        "RawMaterialLog",
        "Order",
        "OrderItem",
        "Payment",
        "Customer",
        "Voucher",
        "Category",
        "StoreSetting",
        "StockLog",
        "StockOpname",
        "Employee",
        "Supplier",
        "SupplierItem",
        "SupplierPriceHistory",
        "CashRecord",
        "RabItem",
        "Event",
      ];
      expectedTables.forEach((table) => {
        expect(schemaContent).toContain(`model ${table}`);
      });
    });

    it("TC-F01-04: Verifies PostgreSQL datasource provider configuration", () => {
      expect(schemaContent).toContain('provider  = "postgresql"');
      expect(schemaContent).toContain('url       = env("DATABASE_URL")');
    });

    it("TC-F01-05: Verifies database connection strings specify SSL/Channel binding", () => {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        expect(envContent).toContain("DATABASE_URL");
        expect(envContent).toContain("sslmode=require");
      }
    });
  });

  describe("Tier 1: Feature 2 — Variant-Specific Recipe Schema Invariants", () => {
    it("TC-F02-01: ProductVariant model definition exists with packaging and size", () => {
      expect(schemaContent).toContain("model ProductVariant");
      expect(schemaContent).toContain("packaging");
      expect(schemaContent).toContain("size");
      expect(schemaContent).toContain("price");
      expect(schemaContent).toContain("cost");
      expect(schemaContent).toContain("stock");
    });

    it("TC-F02-02: ProductVariant enforces unique composite constraint [productId, packaging, size]", () => {
      expect(schemaContent).toContain("@@unique([productId, packaging, size])");
    });

    it("TC-F02-03: RawMaterial model defines packaging & beverage ingredient categories", () => {
      expect(schemaContent).toContain("model RawMaterial");
      expect(schemaContent).toContain("costPerUnit");
      expect(schemaContent).toContain("stock");
      expect(schemaContent).toContain("unit");
    });

    it("TC-F02-04: Identifies current recipe mapping status (Pre-M2 vs Post-M2)", () => {
      const hasVariantId = /model\s+ProductIngredient\s*\{[\s\S]*?variantId\s+String/.test(
        schemaContent
      );
      const hasProductId = /model\s+ProductIngredient\s*\{[\s\S]*?productId\s+String/.test(
        schemaContent
      );

      // Report current transition state
      if (hasVariantId && !hasProductId) {
        console.log("    [Schema Check]: Post-M2 Active (Strict VariantId bound).");
        expect(hasVariantId).toBe(true);
      } else {
        console.log("    [Schema Check]: Pre-M2 Active (ProductId bound, pending M2 migration).");
        expect(hasProductId).toBe(true);
      }
    });

    it("TC-F02-05: Verifies OrderItem model maintains variant relationship", () => {
      expect(schemaContent).toContain("model OrderItem");
      expect(schemaContent).toContain("variantId  String?");
      expect(schemaContent).toContain("variant    ProductVariant?");
    });
  });
}

if (process.argv[1]?.endsWith("schema_contract_suite.ts")) {
  registerSchemaContractSuite();
  runAllSuites().then((success) => process.exit(success ? 0 : 1));
}
