# Handoff Report: Objective & Adversarial Review of Backend Architecture & Schema (Milestones 1–4)

**Agent**: Reviewer & Critic (`reviewer_1`)  
**Mission**: Objective & Adversarial Review of Backend Architecture & Schema (Milestones 1–4)  
**Date**: 2026-11-05T16:13:00Z  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### Obs 1.1: `prisma/schema.prisma` Strict Variant Relation & Unique Constraint
In `prisma/schema.prisma`:
- Lines 249–260 define `ProductIngredient`:
  ```prisma
  model ProductIngredient {
    id            String      @id @default(cuid())
    variantId     String
    rawMaterialId String
    amount        Float       // Takaran per 1 porsi/produk (misal: 18 untuk gram kopi, 150 untuk ml susu, 1 untuk pcs cup)
    createdAt     DateTime    @default(now())

    variant       ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
    rawMaterial   RawMaterial    @relation(fields: [rawMaterialId], references: [id], onDelete: Cascade)

    @@unique([variantId, rawMaterialId])
  }
  ```
  `ProductIngredient` strictly references `ProductVariant` via `variantId` with `onDelete: Cascade`.
- Lines 37–54 define `Product`:
  `Product` contains relations to `category`, `orderItems`, `stockLogs`, and `variants`. There is **0** recipe or ingredient relation attached to `Product` (no fallback).
- Line 259 explicitly specifies `@@unique([variantId, rawMaterialId])`.

### Obs 1.2: `src/app/api/products/route.ts` Safe Upsert & Enriched Variant Calculations
- **Safe Upsert in `PUT`**:
  - Lines 300–372 implement a non-destructive upsert loop for `variants`.
  - Lines 308–310 locate existing variants by ID or composite key:
    ```ts
    const matched = existing.variants.find(
      (ev) => (v.id && ev.id === v.id) || (ev.packaging === targetPackaging && ev.size === targetSize)
    );
    ```
  - If `matched`, it updates the variant in place via `prisma.productVariant.update`. Existing variant IDs are preserved.
  - Line 327 checks `if (Array.isArray(v.ingredients))`; if ingredients are provided, it deletes and recreates only that variant's ingredients (`where: { variantId: matched.id }`). If `v.ingredients` is omitted, existing ingredients are preserved.
  - Variants omitted from the payload are **never deleted** (no `deleteMany` on variants).
  - Lines 375–397 handle legacy modal submissions by applying ingredients exclusively to the `Cup Reguler` variant without touching other variants.
- **Enriched HPP and Readiness in `GET`**:
  - Lines 49–94 calculate variant HPP and inventory readiness dynamically:
    ```ts
    calculatedHpp += ing.amount * costPerUnit;
    if (!raw || raw.stock < ing.amount) {
      isAvailableByIngredients = false;
      ...
    }
    if (raw && ing.amount > 0) {
      producibleLimits.push(Math.floor(raw.stock / ing.amount));
    }
    ```
  - `calculatedHpp` is rounded to 2 decimal places (`Math.round(calculatedHpp * 100) / 100`).
  - Returns `calculatedHpp`, `isAvailableByIngredients`, `missingIngredients`, and `maxProducible` on each variant.

### Obs 1.3: `src/app/api/orders/route.ts` Strict Variant Depletion, Packaging Isolation, & Void Rollback
- **Depletion in `POST`**:
  - Lines 153–189 fetch products with `variants.ingredients.rawMaterial`.
  - Lines 317–339 accumulate required materials strictly from `item.variant.ingredients`:
    ```ts
    for (const item of validatedItems) {
      if (item.variant && item.variant.ingredients) {
        for (const ing of item.variant.ingredients) {
          const requiredAmount = ing.amount * item.qty;
          ...
    ```
  - Lines 342–359 check raw material availability before checkout.
  - Lines 365–378 perform an in-transaction batch stock availability check to prevent race conditions.
  - Lines 423–440 atomically decrement `product.stock` and `productVariant.stock` by `item.qty`, logging `stockLog` (`reason: "terjual"`).
  - Lines 453–472 atomically decrement `rawMaterial.stock` by `req.totalAmount`, logging `rawMaterialLog` (`type: "pemakaian"`).
- **Packaging Isolation**:
  - Bottle variants only list bottle and sticker raw materials; cup variants only list cup and lid materials. No cross-depletion occurs.
- **Order Void / Delete Restoration**:
  - `PUT /api/orders` (lines 554–652) and `DELETE /api/orders` (lines 714–789) restore `product.stock`, `productVariant.stock`, and `rawMaterial.stock` from `item.variant.ingredients`.
  - Creates correction logs (`stockLog` and `rawMaterialLog` with `type: "koreksi"` / `reason: "koreksi"`).
  - Decrements voucher `usedCount` if applied.

### Obs 1.4: Test Suite Execution (`scripts/tests/e2e_variant_recipe_suite.ts`)
Running `npx tsx scripts/tests/e2e_variant_recipe_suite.ts` produced exit code 0:
```
====================================================
   DUA CARITA COFFEE — AUTOMATED TEST RUNNER       
====================================================
● Tier 1: Feature 1 — Database Safety & Backup Contracts (5/5 passed)
● Tier 1: Feature 2 — Variant-Specific Recipe Schema Invariants (5/5 passed)
● Tier 1: Feature 5 — Accurate HPP Calculation Engine (5/5 passed)
● Tier 1: Feature 6 — Variant Stock Readiness Engine (5/5 passed)
● Tier 1: Feature 7 — Variant-Aware POS Inventory Depletion (5/5 passed)
● Tier 1: Feature 8 — Order Void & Stock Restoration Conservation Law (5/5 passed)
● Tier 2: Boundary & Corner Cases (5/5 passed)
● Tier 3: Cross-Feature Combinations (2/2 passed)
● Tier 4: Real-World Production Scenarios (3/3 passed)
● Tier 1: Live Neon PostgreSQL Database Health & Invariants (5/5 passed)
----------------------------------------------------
Test Suites: 10 passed, 10 total
Tests:       45 passed, 45 total
Time:        1.40s
====================================================
```

### Obs 1.5: TypeScript Compilation Failure (`npx tsc --noEmit` & `npm run build`)
Running `npx tsc --noEmit` produced exit code 1 with 22 compilation errors across 5 unmigrated legacy files:
```
prisma/seed-recipes.ts(27,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
prisma/seed-recipes.ts(31,65): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
... [13 more occurrences in prisma/seed-recipes.ts]
scripts/import_to_neon.ts(115,9): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type ...
scripts/seed_bottle_and_caffe_latte.ts(321,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
scripts/seed_bottle_and_caffe_latte.ts(333,11): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type ...
scripts/seed_cup_menu_and_materials.ts(340,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
scripts/seed_cup_menu_and_materials.ts(352,11): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type ...
scripts/update_hpp_and_packaging.ts(464,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
scripts/update_hpp_and_packaging.ts(476,11): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type ...
```
Running `npm run build` also failed at the TypeScript verification step with exit code 1 due to the exact same 22 errors.
*Note: All files in `src/` (`src/app/api/...`, `src/components/...`) passed typechecking with 0 errors.*

---

## 2. Logic Chain

1. **Schema & Architectural Conformance**:
   - `prisma/schema.prisma` conforms exactly to R2: `ProductIngredient` has foreign key `variantId` referring to `ProductVariant` (Cascade), unique constraint `@@unique([variantId, rawMaterialId])`, and `Product` has 0 recipe relations (Obs 1.1).
   - Safe upsert in `src/app/api/products/route.ts` correctly prevents variant deletion and preserves existing recipe mappings (Obs 1.2).
   - POS checkout in `src/app/api/orders/route.ts` derives raw material usage strictly from `item.variant.ingredients` and decrements both variant and product stock within an atomic transaction with concurrency safeguards (Obs 1.3).
   - Void and deletion restoration respects the Law of Conservation (net delta = 0) (Obs 1.3, 1.4).

2. **Integrity & Authenticity Assessment**:
   - Source code was inspected for integrity violations (hardcoded test flags, mock returns, bypassed calculations, self-certifying stubs). No integrity violations were found in the implementation or tests. The 45 automated tests execute genuine assert statements against actual database records and runtime functions (Obs 1.4).

3. **Compilation & Build Blocker**:
   - However, the task requires executing `npx tsc --noEmit` and verifying the build. Because `tsconfig.json` includes `"**/*.ts"`, TypeScript evaluates legacy scripts in `prisma/` and `scripts/`.
   - Five files (`prisma/seed-recipes.ts`, `scripts/import_to_neon.ts`, `scripts/seed_bottle_and_caffe_latte.ts`, `scripts/seed_cup_menu_and_materials.ts`, and `scripts/update_hpp_and_packaging.ts`) still contain references to the retired `productId` property on `ProductIngredient`, causing `npx tsc --noEmit` and `npm run build` to fail with exit code 1 (Obs 1.5).
   - Under standard quality gates, a failed typecheck and failed production build cannot be approved.

---

## 3. Findings & Review Report

### Critical Findings

#### [Critical Finding 1] TypeScript Compilation & Production Build Failure on Legacy Scripts
- **What**: `npx tsc --noEmit` and `npm run build` exit with error code 1 due to 22 TypeScript compiler errors (`TS2353: 'productId' does not exist in type 'ProductIngredient...'`).
- **Where**:
  - `prisma/seed-recipes.ts`: lines 27, 31, 32, 33, 34, 35, 37, 38, 39, 40, 41, 43, 44, 45, 46
  - `scripts/import_to_neon.ts`: line 115
  - `scripts/seed_bottle_and_caffe_latte.ts`: lines 321, 333
  - `scripts/seed_cup_menu_and_materials.ts`: lines 340, 352
  - `scripts/update_hpp_and_packaging.ts`: lines 464, 476
- **Why**: When `ProductIngredient` was updated in `prisma/schema.prisma` from `productId` to `variantId`, these historical seed/migration scripts were left unmodified. Because `tsconfig.json` specifies `"include": ["**/*.ts"]`, Next.js build and `tsc` fail to compile.
- **Suggestion**:
  - Option A: Exclude obsolete one-off scripts from `tsconfig.json` (e.g. add `"scripts/**"` and `"prisma/seed-recipes.ts"` to `tsconfig.json` `"exclude"`), OR
  - Option B: Refactor `prisma/seed-recipes.ts` and the 4 scripts to map recipes to `ProductVariant` via `variantId` (or delete `prisma/seed-recipes.ts` if superseded by `scripts/migrate_variant_recipes.ts`).

### Minor / Observational Findings

#### [Minor Finding 2] Potential Negative `maxProducible` on Raw Material Stock Deficit
- **What**: In `src/app/api/products/route.ts` line 70, `producibleLimits.push(Math.floor(raw.stock / ing.amount))`. If `raw.stock` is negative (e.g., from an unrecorded manual physical consumption), `Math.floor` produces negative integers.
- **Where**: `src/app/api/products/route.ts:70, 75`
- **Why**: `maxProducible` on the variant could return `-1` or `-2`, which in the POS UI might show negative badge counts.
- **Suggestion**: Guard with `Math.max(0, Math.floor(raw.stock / ing.amount))`.

#### [Observational Finding 3] Void Restoration Evaluates Current Rather Than Historical BOM
- **What**: When voiding an order in `src/app/api/orders/route.ts`, the materials to return are recalculated from `item.variant.ingredients` at the time of voiding.
- **Where**: `src/app/api/orders/route.ts:593–612`
- **Why**: If a recipe was adjusted in the admin panel between order placement and voiding, the restored material quantity will reflect the updated recipe instead of the exact quantity depleted at checkout.
- **Suggestion**: Acceptable for current booth operations; if historical audit compliance is required in the future, snapshot depleted ingredient quantities per `OrderItem`.

---

## 4. Adversarial Challenge Report

| Challenge | Attack Scenario | Actual Behavior | Risk Assessment | Mitigation / Status |
|-----------|-----------------|-----------------|-----------------|----------------------|
| **CH-01: Cup vs Bottle Packaging Leaks** | Order 100 bottles of 250 ML and 50 bottles of 1L. Verify if any cups or lids are deducted. | `TC-B04` verified: Cups and lids remained 100% untouched. Bottles and stickers depleted strictly. | PASS (Low Risk) | Strong packaging isolation achieved via variant-level recipe separation. |
| **CH-02: Simultaneous Checkout Race Condition** | Two cashiers checkout the last remaining item concurrently. | Lines 365–378 re-verify material availability within the transaction (`tx.rawMaterial.findMany`). Second transaction throws 400. | PASS (Low Risk) | In-transaction verification prevents negative raw material overselling. |
| **CH-03: Multi-Line Item Same Variant** | A single order contains 2 separate order items for the same variant (e.g. different notes). | Decrements variant stock by each item qty sequentially; aggregates required materials in `requiredMaterialsMap`. | PASS (Low Risk) | Net deductions and logs are mathematically exact. |
| **CH-04: Non-Destructive Product PUT** | Update product price without passing `variants` array. | Line 300 checks `Array.isArray(variants) && variants.length > 0`. Skipped; existing variants and recipes remain intact. | PASS (Low Risk) | Variant wiping bug successfully eradicated. |
| **CH-05: Build & Type Safety Under CI/CD** | Execute automated production build and type checking (`tsc --noEmit`). | Fails with exit code 1 due to 22 errors in 5 legacy files. | **CRITICAL FAIL** | REQUEST_CHANGES required until compilation passes. |

---

## 5. Caveats
- No frontend visual testing was performed by this backend review agent (UI testing is delegated to the frontend reviewer).
- Live database testing was performed on the connected Neon branch (`shiny-bird-53036663`).

---

## 6. Conclusion

- **Verdict**: **REQUEST_CHANGES**
- **Rationale**:
  The schema architecture, variant recipe modeling, HPP engine, POS depletion transaction, and automated E2E test suite (`scripts/tests/e2e_variant_recipe_suite.ts`) are completely authentic, robust, and functional (10/10 suites, 45/45 tests pass).
  However, `npx tsc --noEmit` and `npm run build` currently fail with exit code 1 due to 22 TypeScript compiler errors in 5 unmigrated legacy script files. Once these 5 files are either updated or excluded from `tsconfig.json`, the backend milestones 1–4 are fully ready for approval.

---

## 7. Verification Method

To independently reproduce and verify this review:
1. Run the master E2E test suite:
   ```powershell
   npx tsx scripts/tests/e2e_variant_recipe_suite.ts
   ```
   *Expected*: 10 suites pass, 45 tests pass (exit code 0).
2. Run TypeScript compilation check:
   ```powershell
   npx tsc --noEmit
   ```
   *Observation*: Fails with 22 errors in `prisma/seed-recipes.ts`, `scripts/import_to_neon.ts`, `scripts/seed_bottle_and_caffe_latte.ts`, `scripts/seed_cup_menu_and_materials.ts`, and `scripts/update_hpp_and_packaging.ts`.
3. Invalidation condition: Updating or excluding those 5 legacy script files such that `npx tsc --noEmit` and `npm run build` both exit with code 0.
