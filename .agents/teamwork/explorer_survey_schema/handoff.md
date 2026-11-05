# Handoff Report: Database Schema, Recipe Modeling, and Backup Architecture Survey

**Agent**: `explorer_survey_schema`  
**Working Directory**: `c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\explorer_survey_schema\`  
**Target Milestone**: Milestone 1 (Discovery & Investigation) -> Milestone 2 (Execution Planning)  
**Date**: 2026-11-05T15:29:00Z  

---

## 1. Observation

### 1.1 Database Provider and Connection Setup
- **File**: `prisma/schema.prisma` lines 5–9:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DATABASE_URL_UNPOOLED")
  }
  ```
- **File**: `.env` lines 1–3:
  ```env
  DATABASE_URL="postgresql://neondb_owner:npg_ByJOV82LTpUR@ep-small-violet-azzv129d-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
  DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_ByJOV82LTpUR@ep-small-violet-azzv129d.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
  NEON_BRANCH=production
  ```
- **Local Artifact**: `prisma/dev.db` (151,552 bytes, last modified 2026-09-19) is a legacy SQLite file not referenced in `prisma/schema.prisma` or `.env`.
- **Neon Cloud Infrastructure**:
  - Neon project ID: `shiny-bird-53036663` (Name: "app pos dan inventaris", Region: `aws-ap-southeast-1`).
  - Active branch: `production` (Branch ID: `br-shy-water-az3ya8zp`, default/primary: `true`).
  - Neon MCP integration verified and functional with `ADMIN` permissions (`list_projects`, `list_branches` returned valid JSON payloads).

### 1.2 Database Tables & Existing Record Counts
Direct query execution against Neon PostgreSQL via `@prisma/client` produced:
- `Product`: 7 rows
- `ProductVariant`: 28 rows (4 variants per product)
- `ProductIngredient`: 40 rows
- `RawMaterial`: 26 rows (including both food ingredients and packaging items)
- `Order`: 191 rows
- `OrderItem`: 114 rows
- `Category`: 2 rows (`Coffee` and `Non Coffee`)
- `Public Tables (21)`: `CashRecord`, `Category`, `Customer`, `Employee`, `Event`, `Order`, `OrderItem`, `Payment`, `Product`, `ProductIngredient`, `ProductVariant`, `RabItem`, `RawMaterial`, `RawMaterialLog`, `StockLog`, `StockOpname`, `StoreSetting`, `Supplier`, `SupplierItem`, `SupplierPriceHistory`, `Voucher`.

### 1.3 Current Schema Models for Products, Variants, and Recipes
- **Product** (`prisma/schema.prisma`, lines 37–55):
  ```prisma
  model Product {
    id          String      @id @default(cuid())
    name        String
    categoryId  String
    price       Float
    cost        Float       @default(0)
    stock       Int         @default(0)
    unit        String      @default("pcs")
    imageUrl    String?
    isActive    Boolean     @default(true)
    createdAt   DateTime    @default(now())
    updatedAt   DateTime    @updatedAt

    category    Category            @relation(fields: [categoryId], references: [id], onDelete: Cascade)
    orderItems  OrderItem[]
    stockLogs   StockLog[]
    ingredients ProductIngredient[]
    variants    ProductVariant[]
  }
  ```
- **ProductVariant** (`prisma/schema.prisma`, lines 57–73):
  ```prisma
  model ProductVariant {
    id         String   @id @default(cuid())
    productId  String
    packaging  String   @default("Cup") // "Cup", "Botol"
    size       String   @default("Reguler") // "Reguler", "Large", "250 ML", "1.000 ML"
    price      Float
    cost       Float    @default(0)
    stock      Int      @default(0)
    isActive   Boolean  @default(true)
    createdAt  DateTime @default(now())
    updatedAt  DateTime @updatedAt

    product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
    orderItems OrderItem[]

    @@unique([productId, packaging, size])
  }
  ```
- **ProductIngredient** (`prisma/schema.prisma`, lines 249–260):
  ```prisma
  model ProductIngredient {
    id            String      @id @default(cuid())
    productId     String
    rawMaterialId String
    amount        Float       // Takaran per 1 porsi/produk
    createdAt     DateTime    @default(now())

    product       Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
    rawMaterial   RawMaterial @relation(fields: [rawMaterialId], references: [id], onDelete: Cascade)

    @@unique([productId, rawMaterialId])
  }
  ```
- **RawMaterial** (`prisma/schema.prisma`, lines 183–202):
  Contains both beverage ingredients and packaging containers/accessories. For example:
  - Food ingredients: `Javanica Eclipse (Robusta)` (costPerUnit: 159), `Diamond UHT` (costPerUnit: 19.5), `Diamond Rich Milk` (costPerUnit: 22.5), `Creamer` (costPerUnit: 46), `Gula Aren` (costPerUnit: 22), `Denali Cokelat` (costPerUnit: 128), `Trieste Hazelnut` (costPerUnit: 107.69), `Air Demineral` (costPerUnit: 0.3125).
  - Physical packaging: `Cup Injection 12 Oz` (costPerUnit: 1036), `Tutup Cup Injection` (costPerUnit: 440), `Botol Kale 250 ML` (costPerUnit: 1075), `Botol Kale 1L` (costPerUnit: 2800), plus 12 variant-specific stickers (`Stiker Aren Latte - 250 ML`, `Stiker Aren Latte - 1 L`, `Stiker Caffe Latte - 250 ML`, etc.).

### 1.4 How Recipes Are Currently Associated
- Recipes are bound strictly to `Product` via `ProductIngredient.productId`.
- In the database, all 40 `ProductIngredient` records reference `productId` and reflect exclusively the 12 Oz regular cup formulation (e.g. 10g Robusta, 40ml UHT, 25ml Rich Milk, 20g Creamer, 1 Cup Injection 12 Oz, 1 Tutup Cup Injection).
- There is **no foreign key, relation, or table** linking `ProductVariant` to `ProductIngredient` or any recipe table.
- In `src/app/api/orders/route.ts` lines 269–284:
  ```ts
  for (const item of validatedItems) {
    for (const ing of item.product.ingredients) {
      const requiredAmount = ing.amount * item.qty;
      ...
    }
  }
  ```
  Every sold item drains stock using `item.product.ingredients`. If a customer orders a "Botol 1.000 ML", the system deducts 1 Cup Injection, 1 Tutup Cup, and 10g coffee instead of 1 Botol 1L, 1 Stiker 1L, 40g coffee, and 240ml UHT.

### 1.5 How Variant Sizes and Packaging Are Stored
- Stored as rows in `ProductVariant` with attributes:
  - `packaging`: `"Cup"` or `"Botol"`
  - `size`: `"Reguler"`, `"Large"`, `"250 ML"`, or `"1.000 ML"`
  - `price`: variant selling price (Float)
  - `cost`: variant static cost (Float, default 0)
  - `stock`: variant stock (Int, default 0)
  - `isActive`: Boolean
  - Unique index: `@@unique([productId, packaging, size])`
- All 7 products in the database currently have exactly 4 variants (28 variants total).
- Past orders (`OrderItem`): 114 rows have `variantId: null` because they were created prior to the variant feature commit `c39438a`.

### 1.6 Migration History and Seed Scripts
- **Prisma Migrations**:
  - `_prisma_migrations` table does **NOT** exist in PostgreSQL (`relation "_prisma_migrations" does not exist`).
  - There is no `prisma/migrations` folder.
  - The project relies on `prisma db push` (`npm run db:push`).
- **Seed Scripts**:
  - `prisma/seed.ts`: Seeds core entities (Events, Categories, Products, Customers, Vouchers, Orders, StockLogs).
  - `prisma/seed-new.ts`: Seeds StoreSetting, Employees, RawMaterials.
  - `prisma/seed-recipes.ts`: Seeds product-level recipes.
  - `scripts/seed_cup_menu_and_materials.ts`: Seeds cup menu items and raw materials.
  - `scripts/seed_bottle_and_caffe_latte.ts`: Pre-variant script that seeded bottles as standalone products with individual recipes.
  - `scripts/update_hpp_and_packaging.ts`: Master recipe and packaging script defining official HPP breakdown for Cup 12 Oz, Botol 250 ML, and Botol 1000 ML (including exact ml, gram, bottle, cup, and sticker specs).
  - `scripts/import_to_neon.ts`: Prior synchronization script importing local JSON data to Neon.
  - `scripts/import_sales_history.ts`: Historical transaction importer (April–May 2026).
  - `scripts/sync_sales_to_orders.ts`: Syncs September–October sales.
  - `scripts/update_prabaswara_breakdown.ts`: Fixes PRABASWARA event items.

---

## 2. Logic Chain

1. **Premise**: User requirement R1 demands a complete database backup before any schema changes or migrations are applied.
   - *Observation*: Neon PostgreSQL is the live production database (`shiny-bird-53036663`, branch `production`). Neon MCP tools are available and operational with `ADMIN` privileges.
   - *Deduction*: We can create an instant point-in-time copy-on-write branch in Neon via Neon MCP (`create_branch`, e.g. `backup-pre-variant-recipe-20261105`) with 0 downtime. To guarantee air-gapped recovery if remote credentials fail, we should pair this with an offline JSON snapshot script (`scripts/backup_database.ts`) that dumps all 21 tables into a timestamped file.

2. **Premise**: User requirement R2 demands strict variant-level recipes (`ProductVariant -> recipe`) without fallback to `Product`.
   - *Observation*: `ProductIngredient` currently has `productId String` and `@@unique([productId, rawMaterialId])`. `ProductVariant` has no relationship to ingredients. All 40 existing `ProductIngredient` rows are tied to `productId` and reflect only 12 Oz cup formulations.
   - *Deduction*: `ProductIngredient` must be altered to point to `variantId String` with `variant ProductVariant @relation(...)` and `@@unique([variantId, rawMaterialId])`. The `productId` relation must be removed from `ProductIngredient` to guarantee there is zero fallback to the product level.

3. **Premise**: Data migration must preserve existing recipe data while populating all 4 variants per product.
   - *Observation*: Each product currently has 4 variants: Cup Reguler, Cup Large, Botol 250 ML, Botol 1.000 ML. The existing 40 `ProductIngredient` records represent Cup Reguler. The formulas for Botol 250 ML and Botol 1.000 ML are fully documented in `scripts/update_hpp_and_packaging.ts`. Cup Large can be scaled from Cup Reguler (1.3x) or set per specification.
   - *Deduction*: Migration can be executed safely in 3 deterministic steps:
     1. Add nullable `variantId String?` to `ProductIngredient`.
     2. Run a migration script that associates existing `ProductIngredient` rows to each product's `Cup Reguler` variant, and inserts corresponding variant recipes for `Cup Large`, `Botol 250 ML`, and `Botol 1.000 ML` (including specific bottles, stickers, cups, lids, and scaled ingredients).
     3. Make `variantId` non-nullable (`variantId String`), remove `productId`, and apply `@@unique([variantId, rawMaterialId])`.

4. **Premise**: User requirement R3 demands accurate HPP (COGS) calculation per variant based on active ingredients and packaging.
   - *Observation*: `ProductVariant.cost` is currently a static number. In `src/app/api/analytics/route.ts:63`, total cost uses `item.variant?.cost ?? item.product?.cost ?? 0`.
   - *Deduction*: With `ProductIngredient` tied to `ProductVariant`, variant HPP can be computed dynamically as `sum(ingredient.amount * rawMaterial.costPerUnit)` and synced to `ProductVariant.cost`. This ensures analytics and order margins reflect real packaging and ingredient costs.

5. **Premise**: User requirement R4 demands variant-aware stock deduction and readiness.
   - *Observation*: Currently, `src/app/api/orders/route.ts` loops over `item.product.ingredients`. `src/app/api/products/route.ts` computes `maxProducible` on the product level.
   - *Deduction*: Updating order creation to deduct materials based on `item.variant.ingredients` will correctly consume bottles/stickers for bottles and cups/lids for cups. Updating `/api/products` to calculate `maxProducible` per variant enables the POS to show accurate availability badges for each packaging size independently.

---

## 3. Caveats

1. **Historical Orders (`OrderItem`)**:
   All 114 existing `OrderItem` records have `variantId: null`. Changing `ProductIngredient` to require `variantId` does not break historical orders because `OrderItem.variantId` remains optional (`ProductVariant?`). However, voiding or deleting a historical order created before this migration would not have a variant recipe to roll back unless handled gracefully (e.g. skip ingredient rollback if `variantId` is null for pre-migration orders).
2. **Prisma Push vs Migrate**:
   The repository does not use Prisma Migrate workflows (`_prisma_migrations` does not exist). Using `npx prisma db push` will execute schema updates directly. Before altering non-nullable constraints or column names, data backfill must be executed so `prisma db push` does not drop unmapped rows.
3. **Product Name Redundancy**:
   There are currently two products named "Aren Coffee Milk" in the database: ID `cmu78u62x0007wr4cdy40mujv` (active, 4 variants) and ID `cmw2n1exd0001jy0897xz7513` (legacy bottle duplicate, 4 variants). The migration script should ensure recipes are assigned to the primary active product variants.

---

## 4. Conclusion

The database schema and live Neon environment are completely mapped and primed for the variant-specific recipe refactor:

1. **Live Environment**: Neon PostgreSQL (`ep-small-violet-azzv129d`), project `shiny-bird-53036663`, branch `production`. Neon MCP is authenticated and ready to take instant branch backups.
2. **Current Defect**: `ProductIngredient` is bound to `Product.id`. All variants of a product drain the same cup ingredients and ignore bottle packaging, liquid volume scaling, and individual HPP.
3. **Target Schema**:
   - `ProductVariant` owns `ingredients ProductIngredient[]`.
   - `ProductIngredient` has `variantId String`, `rawMaterialId String`, `amount Float`, with `@@unique([variantId, rawMaterialId])`.
   - `Product` has no direct recipe relations.
4. **Backup & Safety**:
   - Primary: Neon branch `backup-pre-variant-recipe-20261105` created via Neon MCP `create_branch`.
   - Secondary: JSON dump of all 21 tables via `scripts/backup_database.ts`.
5. **Data Population**: Complete recipe definitions for Cup Reguler, Cup Large, Botol 250 ML, and Botol 1000 ML exist in `scripts/update_hpp_and_packaging.ts` and can be seeded across all 28 product variants during migration.

---

## 5. Verification Method

### 5.1 Independent Verification Commands
To independently verify the observations and schema state reported here:

1. **Verify Neon MCP Connection & Branch**:
   ```bash
   # Run via Neon MCP or inspect active database
   # Project: shiny-bird-53036663, default branch: production
   ```
2. **Verify Database Counts and Table Structure**:
   ```powershell
   npx tsx .agents/teamwork/explorer_survey_schema/check_db.ts
   npx tsx .agents/teamwork/explorer_survey_schema/check_migrations.ts
   ```
3. **Inspect Existing Products and Ingredients**:
   ```powershell
   npx tsx .agents/teamwork/explorer_survey_schema/inspect_products.ts
   npx tsx .agents/teamwork/explorer_survey_schema/inspect_ingredients.ts
   ```
4. **Inspect OrderItem Variant Nullability**:
   ```powershell
   npx tsx .agents/teamwork/explorer_survey_schema/inspect_orders.ts
   ```

### 5.2 Post-Migration Verification Conditions
The future implementation will be verified against these conditions:
1. `prisma.productVariant.findFirst({ include: { ingredients: true } })` returns specific ingredients for every variant.
2. In Neon, `SELECT COUNT(*) FROM "ProductIngredient"` increases from 40 to ~112 (28 variants × 4-7 ingredients each).
3. `SELECT DISTINCT "variantId" FROM "ProductIngredient"` contains all active variant IDs.
4. An automated test purchasing a 250 ML bottle decreases `Botol Kale 250 ML` and 250 ML beverage ingredients by 1 unit, with 0 deduction from `Cup Injection 12 Oz`.
