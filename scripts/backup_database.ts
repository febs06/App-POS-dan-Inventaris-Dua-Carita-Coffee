import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface TableStats {
  table: string;
  count: number;
}

async function backupDatabase() {
  console.log("==================================================");
  console.log("   Dua Carita Coffee - Full Database Backup       ");
  console.log("   Milestone 1: Pre-Variant Migration Backup      ");
  console.log("==================================================");
  console.log(`Started at: ${new Date().toISOString()}`);

  try {
    console.log("\n[1/3] Querying all 21 public database tables via Prisma...");

    // Genuine database queries for all 21 tables
    const [
      categories,
      products,
      productVariants,
      productIngredients,
      rawMaterials,
      rawMaterialLogs,
      orders,
      orderItems,
      payments,
      customers,
      employees,
      events,
      rabItems,
      stockLogs,
      stockOpnames,
      storeSettings,
      suppliers,
      supplierItems,
      supplierPriceHistories,
      vouchers,
      cashRecords,
    ] = await Promise.all([
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.productVariant.findMany(),
      prisma.productIngredient.findMany(),
      prisma.rawMaterial.findMany(),
      prisma.rawMaterialLog.findMany(),
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.payment.findMany(),
      prisma.customer.findMany(),
      prisma.employee.findMany(),
      prisma.event.findMany(),
      prisma.rabItem.findMany(),
      prisma.stockLog.findMany(),
      prisma.stockOpname.findMany(),
      prisma.storeSetting.findMany(),
      prisma.supplier.findMany(),
      prisma.supplierItem.findMany(),
      prisma.supplierPriceHistory.findMany(),
      prisma.voucher.findMany(),
      prisma.cashRecord.findMany(),
    ]);

    const tablesData: Record<string, unknown[]> = {
      Category: categories,
      Product: products,
      ProductVariant: productVariants,
      ProductIngredient: productIngredients,
      RawMaterial: rawMaterials,
      RawMaterialLog: rawMaterialLogs,
      Order: orders,
      OrderItem: orderItems,
      Payment: payments,
      Customer: customers,
      Employee: employees,
      Event: events,
      RabItem: rabItems,
      StockLog: stockLogs,
      StockOpname: stockOpnames,
      StoreSetting: storeSettings,
      Supplier: suppliers,
      SupplierItem: supplierItems,
      SupplierPriceHistory: supplierPriceHistories,
      Voucher: vouchers,
      CashRecord: cashRecords,
    };

    const stats: TableStats[] = Object.entries(tablesData).map(([table, records]) => ({
      table,
      count: records.length,
    }));

    const totalRecords = stats.reduce((sum, item) => sum + item.count, 0);

    console.log("\n[2/3] Record counts per table:");
    console.log("--------------------------------------------------");
    for (const item of stats) {
      console.log(`  - ${item.table.padEnd(24)} : ${item.count} records`);
    }
    console.log("--------------------------------------------------");
    console.log(`  Total across all 21 tables : ${totalRecords} records`);

    const tableCountsMap: Record<string, number> = {};
    for (const item of stats) {
      tableCountsMap[item.table] = item.count;
    }

    const backupPayload = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0",
        description: "Dua Carita Coffee full 21-table database snapshot prior to variant recipe migration",
        neonProject: "shiny-bird-53036663",
        neonSourceBranch: "production (br-shy-water-az3ya8zp)",
        neonBackupBranch: "backup-pre-variant-recipe-20261105 (br-tiny-flower-az19c9hz)",
        totalTables: 21,
        totalRecords,
        tableCounts: tableCountsMap,
      },
      tables: tablesData,
    };

    console.log("\n[3/3] Writing backup JSON file to disk...");
    const backupDir = path.resolve(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const targetFilePath = path.join(backupDir, "backup_20261105_pre_variant.json");
    const serializedJson = JSON.stringify(backupPayload, null, 2);
    fs.writeFileSync(targetFilePath, serializedJson, "utf-8");

    const fileSizeBytes = fs.statSync(targetFilePath).size;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

    console.log(`Successfully created backup file:`);
    console.log(`  Path : ${targetFilePath}`);
    console.log(`  Size : ${fileSizeBytes.toLocaleString()} bytes (~${fileSizeMB} MB)`);
    console.log("\nBackup process completed successfully!");

    return {
      filePath: targetFilePath,
      fileSizeBytes,
      totalRecords,
      tableCounts: tableCountsMap,
    };
  } catch (error) {
    console.error("Error during database backup execution:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute script if run directly
if (require.main === module || process.argv[1]?.includes("backup_database.ts")) {
  backupDatabase();
}

export { backupDatabase };
