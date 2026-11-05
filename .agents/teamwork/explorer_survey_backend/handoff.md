# Handoff Report: Backend Architecture Survey for Strict Per-Variant Recipe Modeling

**Agent ID**: `explorer_survey_backend`  
**Parent Agent**: `orchestrator` (`8f2746ea-eb69-45ac-a514-91165c0b1d02`)  
**Date**: 2026-11-05T15:26:00Z  
**Type**: Hard Handoff  

---

## 1. Observation

Direct code and database inspections yielded the following concrete observations:

### A. Database Schema & Relations
- **`prisma/schema.prisma` lines 37-55**: `Product` has `ingredients ProductIngredient[]` and `variants ProductVariant[]`.
- **`prisma/schema.prisma` lines 57-73**: `ProductVariant` has:
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
  `ProductVariant` has NO relation to `ProductIngredient` or any recipe entity.
- **`prisma/schema.prisma` lines 249-260**: `ProductIngredient` is strictly tied to `Product` via `productId`:
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
- **Live Database State (Neon DB `shiny-bird-53036663`)**:
  - `Product`: 7 rows
  - `ProductVariant`: 28 rows (4 variants per product: `Cup Reguler`, `Cup Large`, `Botol 250 ML`, `Botol 1.000 ML`)
  - `ProductIngredient`: 40 rows. SQL inspection reveals that all 40 rows are mapped exclusively to `Product.id`. The ingredients listed include `"Cup Injection 12 Oz"` and `"Tutup Cup Injection"` (category `"Kemasan & Packaging"`). There are zero recipe records linked to bottle variants or large cups.
  - `Order`: 191 rows
  - `OrderItem`: 114 rows, all having `variantId = null` because historical orders did not persist variant IDs.

### B. Product Retrieval & Stock Readiness Calculation
- **`src/app/api/products/route.ts` lines 23-39**:
  ```ts
  const products = await prisma.product.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      category: { select: { id: true, name: true } },
      ingredients: { include: { rawMaterial: true } },
      variants: { orderBy: [{ packaging: "asc" }, { size: "asc" }] },
    },
  });
  ```
- **`src/app/api/products/route.ts` lines 42-74**:
  `maxProducible` and `isAvailableByIngredients` are calculated strictly at the `Product` level:
  ```ts
  if (p.ingredients && p.ingredients.length > 0) {
    const producibleLimits: number[] = [];
    p.ingredients.forEach((ing) => {
      const raw = ing.rawMaterial;
      if (!raw || raw.stock < ing.amount) {
        isAvailableByIngredients = false;
        missingIngredients.push(
          `${raw?.name || "Bahan"} (Sisa: ${raw?.stock || 0} ${raw?.unit || ""})`
        );
      }
      if (raw && ing.amount > 0) {
        producibleLimits.push(Math.floor(raw.stock / ing.amount));
      }
    });
    if (producibleLimits.length > 0) {
      maxProducible = Math.min(...producibleLimits);
    }
  }
  ```
  The returned variant objects in `p.variants` do NOT contain their own `isAvailableByIngredients`, `missingIngredients`, or `maxProducible`.

### C. Product Creation & Mutation Endpoints
- **`src/app/api/products/route.ts` lines 118-158 (`POST`)**:
  - Creates default variants with hardcoded fallback multiplier costs if no variants passed:
    - Reguler: `price: parsedPrice, cost: parsedCost`
    - Large: `price: parsedPrice + 3000, cost: Math.round(parsedCost * 1.3)`
    - 250 ML: `price: parsedPrice + 2000, cost: Math.round(parsedCost * 1.2)`
    - 1.000 ML: `price: 55000, cost: 25000`
  - Saves ingredients to `prisma.productIngredient.create({ data: { productId: product.id, ... } })`.
- **`src/app/api/products/route.ts` lines 230-267 (`PUT`)**:
  - Destructive delete: `await prisma.productVariant.deleteMany({ where: { productId: id } })`.
  - Re-creates variants from scratch (which changes their primary keys and would cascade delete any variant-level ingredients).
  - Wipes and replaces product ingredients: `await prisma.productIngredient.deleteMany({ where: { productId: id } })`.

### D. POS Order Creation & Inventory Depletion
- **`src/app/api/orders/route.ts` lines 264-284 (`POST`)**:
  Aggregates required materials exclusively from `item.product.ingredients`:
  ```ts
  for (const item of validatedItems) {
    for (const ing of item.product.ingredients) {
      const requiredAmount = ing.amount * item.qty;
      const existing = requiredMaterialsMap.get(ing.rawMaterialId);
      if (existing) {
        existing.totalAmount += requiredAmount;
      } else {
        requiredMaterialsMap.set(ing.rawMaterialId, {
          materialId: ing.rawMaterialId,
          name: ing.rawMaterial?.name || "Bahan",
          unit: ing.rawMaterial?.unit || "",
          totalAmount: requiredAmount,
        });
      }
    }
  }
  ```
- **`src/app/api/orders/route.ts` lines 348-356**:
  ```ts
  // 3. Potong stok produk jadi
  for (const item of validatedItems) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.qty },
      },
    });
  }
  ```
  `variant.stock` is NEVER decremented.
- **`src/app/api/orders/route.ts` lines 369-376**:
  Decrements raw materials based on `requiredMaterialsMap`. Since `requiredMaterialsMap` only pulled from `item.product.ingredients`, selling `Botol 1.000 ML` actually deducts 1 `Cup Injection 12 Oz` and 1 `Tutup Cup Injection`, leaving `Botol 1000 ML` and `Stiker 1000 ML` untouched, and deducting only single-cup doses of coffee and milk.
- **`src/app/api/orders/route.ts` lines 489-509 (`PUT` / Void)**:
  Restores raw material stock using `item.product.ingredients` and increments `tx.product.stock`.
- **`src/app/api/orders/route.ts` lines 617-637 (`DELETE` / Hard Delete)**:
  Restores raw material stock using `item.product.ingredients` and increments `tx.product.stock`.

### E. Financial COGS / HPP Analytics
- **`src/app/api/analytics/route.ts` lines 59-67**:
  ```ts
  let totalCost = 0;
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (!item.isVoided) {
        const itemUnitCost = item.variant?.cost ?? item.product?.cost ?? 0;
        totalCost += item.qty * itemUnitCost;
      }
    });
  });
  const grossProfit = totalRevenue - totalCost;
  ```
  Analytics is already structured to prioritize `item.variant?.cost`. However, because `variant.cost` is currently an unverified static field or guessed multiplier, the reported gross profit is inaccurate.

---

## 2. Logic Chain

From the direct observations above:

1. **Premise 1**: `ProductIngredient` has a foreign key to `Product` (`productId`), not `ProductVariant` (`variantId`).
2. **Premise 2**: In `POST /api/orders` (lines 269-284), ingredient deduction uses `item.product.ingredients`.
3. **Inference 1**: Regardless of whether a customer buys a `Cup Reguler`, `Cup Large`, `Botol 250 ML`, or `Botol 1.000 ML`, the exact same ingredients and packaging (specifically `Cup Injection 12 Oz` and `Tutup Cup Injection`) are deducted.
4. **Premise 3**: In `GET /api/products` (lines 42-74), `maxProducible` is computed from `p.ingredients`.
5. **Inference 2**: The POS interface is unable to tell the barista/cashier if a specific size or packaging (e.g. 1.000 ML bottles) is exhausted. If 12 Oz cups are in stock, the entire product is labeled as available for all 4 variants.
6. **Premise 4**: In `PUT /api/products` (lines 230-248), editing any product detail invokes `prisma.productVariant.deleteMany({ where: { productId: id } })`.
7. **Inference 3**: If `ProductIngredient` is moved under `ProductVariant` with `onDelete: Cascade`, running `PUT /api/products` would permanently wipe all variant recipe configurations whenever a product's name, price, or category is updated. Thus, variant management must be refactored to an upsert/reconciliation strategy.
8. **Premise 5**: In `POST /api/orders` (lines 349-356), only `tx.product.update` decrementing `product.stock` is executed.
9. **Inference 4**: `ProductVariant.stock` remains static and desynchronized from sales. Both `product.stock` and `variant.stock` (if variant tracking is enabled) must be updated.

---

## 3. Caveats

1. **Historical Orders (`variantId = null`)**: 114 existing `OrderItem` records have `variantId = null`. When enforcing strict variant recipes for new transactions, legacy orders must remain readable by `analytics/route.ts` and `reports/page.tsx` via fallback `item.variant?.cost ?? item.product?.cost ?? 0`.
2. **Direct Product Purchase in Pre-Order (`src/app/po/page.tsx`)**: The current PO creation modal allows selecting a product without selecting a variant. If variant recipes are strict per variant, PO item selection must also mandate selecting a variant so that the backend can resolve the recipe.
3. **Raw Material Cost Fluctuations**: When `rawMaterial.costPerUnit` changes (via `POST /api/raw-materials/mutate` Weighted Moving Average), variant `cost` fields in `ProductVariant` are not automatically recomputed on-the-fly unless an explicit calculation utility is invoked.

---

## 4. Conclusion

To fulfill the requirements (R1–R5), the backend architecture must implement the following changes:

### 1. Database Schema Update (`prisma/schema.prisma`)
- Add `ingredients ProductIngredient[]` to `model ProductVariant`.
- In `model ProductIngredient`:
  - Change `productId String` to `variantId String`.
  - Replace `product Product @relation(...)` with `variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)`.
  - Update constraint to `@@unique([variantId, rawMaterialId])`.
  - (Optional for smooth migration): Keep `productId String?` as nullable during transition or migrate data completely.

### 2. Product API Handler (`src/app/api/products/route.ts`)
- **`GET`**: Include `variants: { include: { ingredients: { include: { rawMaterial: true } } } }`.
  - Calculate `isAvailableByIngredients`, `missingIngredients`, `maxProducible`, and `calculatedHpp` **per variant**.
  - Return enriched variants so the POS and Admin UI know exact readiness per variant.
- **`POST` & `PUT`**: Accept `variants` where each variant carries its own array of `ingredients: [{ rawMaterialId, amount }]`.
  - Automatically calculate each variant's HPP: $\text{cost} = \sum (\text{amount} \times \text{rawMaterial.costPerUnit})$.
  - Replace `productVariant.deleteMany` in `PUT` with upsert/diff logic to prevent wiping variant IDs and cascading recipe deletions.

### 3. Orders API Handler (`src/app/api/orders/route.ts`)
- **`POST`**:
  - In `validatedItems`, ensure `variantId` is present.
  - Query `variantMap` with `include: { ingredients: { include: { rawMaterial: true } } }`.
  - Build `requiredMaterialsMap` strictly using `variant.ingredients`. Throw a descriptive 400 error if a variant has no recipe defined ("strict per variant tanpa fallback").
  - Deduct both `product.stock` and `variant.stock`.
  - Deduct `rawMaterial.stock` according to variant ingredients and packaging.
- **`PUT` (void) & `DELETE`**:
  - Load `variant.ingredients` to correctly restore raw materials and packaging.
  - Restore both `product.stock` and `variant.stock`.

---

## 5. Verification Method

To independently verify these backend requirements and findings:

1. **Verify Schema & Types**:
   Run `npx prisma validate` and `npx prisma generate` after modifying `prisma/schema.prisma`.
2. **Verify Database Query Execution**:
   Use Neon MCP `run_sql` on project `shiny-bird-53036663`:
   ```sql
   SELECT pv.id, pv.packaging, pv.size, pv.price, pv.cost, count(pi.id) as recipe_item_count
   FROM "ProductVariant" pv
   LEFT JOIN "ProductIngredient" pi ON pi."variantId" = pv.id
   GROUP BY pv.id, pv.packaging, pv.size, pv.price, pv.cost;
   ```
3. **Verify API Endpoints**:
   - `GET /api/products`: Confirm response JSON contains variants, each with `ingredients`, `isAvailableByIngredients`, `maxProducible`, and `calculatedHpp`.
   - `POST /api/orders`: Submit a test order with `Botol 250 ML`. Verify in `RawMaterialLog` that `Botol 250 ML` and `Stiker 250 ML` are deducted with 60ml milk and 10g coffee, and that `Cup Injection 12 Oz` is NOT deducted.
   - `PUT /api/orders`: Void the test order. Verify in `RawMaterialLog` that the exact bottle materials were rolled back with `type: "koreksi"`.
4. **Automated Verification Script**:
   Create a dedicated integration test script (e.g. `scripts/verify_variant_recipes.ts`) executed via `npx tsx scripts/verify_variant_recipes.ts` checking:
   - Integrity of variant-level recipe foreign keys.
   - Accuracy of variant HPP calculations vs. manual summation of raw materials + packaging.
   - Depletion of raw materials upon simulated order creation.
