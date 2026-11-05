# Forensic Audit Report — Strict Per-Variant Recipe System

**Work Product**: Strict Per-Variant Recipe & Inventory System
**Integrity Mode**: Development
**Profile**: General Project
**Verdict**: **INTEGRITY VIOLATION**

---

### Phase Results Overview

| # | Inspection Phase | Status | Details |
|---|------------------|:------:|---------|
| 1 | **Prisma Schema Architecture** | **PASS** | `ProductIngredient` strictly bound to `ProductVariant` via `variantId`; `Product.ingredients` completely removed; composite unique `[variantId, rawMaterialId]` intact. |
| 2 | **API Business Logic Authenticity** | **PASS** | `GET /api/products` computes dynamic HPP & readiness from raw ingredients; `PUT /api/products` safely upserts variants without destructive cascade deletion. |
| 3 | **POS Depletion & Restoration** | **PASS** | `POST /api/orders` computes required materials strictly from `variant.ingredients`, decrements product, variant, and raw material stocks; `PUT /api/orders` (void) & `DELETE` restore materials accurately. |
| 4 | **Frontend UI Integrity** | **PASS** | Interactive variant BOM editor in `src/app/products/page.tsx`, real-time readiness badges in `PosProductModal.tsx`, full variant association in `pos/page.tsx` & `po/page.tsx`. |
| 5 | **Test Suite Authenticity** | **PASS** | 45 executable test cases across 10 modular suites in `scripts/tests/`; zero dummy mocks, tautologies, or hardcoded pass shortcuts. |
| 6 | **Live Database Invariants** | **PASS** | Live Neon PostgreSQL database verified: exactly 28 variants (7 products × 4 variants), 0 empty recipes, 100% accurate HPP cost sync. |
| 7 | **E2E Test Execution** | **PASS** | `npx tsx scripts/tests/e2e_variant_recipe_suite.ts` passed 45/45 tests (10/10 suites) in 1.10s. |
| 8 | **Static Type Checking** | **FAIL** | `npx tsc --noEmit` exited with code 1: 22 TypeScript compilation errors across 5 legacy scripts referencing obsolete `ProductIngredient.productId`. |
| 9 | **Build Execution** | **FAIL** | `npm run build` exited with code 1: production build blocked during TypeScript validation. |

---

## 1. Observation

### 1.1 Static Analysis of Codebase & Database

1. **Schema Integrity (`prisma/schema.prisma`)**:
   - `Product` (lines 37–54) has zero references to `ProductIngredient`.
   - `ProductVariant` (lines 56–73) defines `ingredients ProductIngredient[]` (line 70).
   - `ProductIngredient` (lines 249–260) defines:
     ```prisma
     model ProductIngredient {
       id            String      @id @default(cuid())
       variantId     String
       rawMaterialId String
       amount        Float
       createdAt     DateTime    @default(now())

       variant       ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
       rawMaterial   RawMaterial    @relation(fields: [rawMaterialId], references: [id], onDelete: Cascade)

       @@unique([variantId, rawMaterialId])
     }
     ```
   - No `productId` exists on `ProductIngredient`.

2. **API Routes Implementation**:
   - `src/app/api/products/route.ts` (lines 49–94): Computes dynamic HPP (`calculatedHpp += ing.amount * costPerUnit`) and availability (`isAvailableByIngredients`, `missingIngredients`, `maxProducible`) per variant directly from `ing.rawMaterial.costPerUnit` and `ing.rawMaterial.stock`.
   - `src/app/api/products/route.ts` (lines 299–372): Performs safe diff/upsert of `variants` by matching `id` or `(packaging, size)` and updating existing records with `prisma.productVariant.update`, preventing accidental deletion of variant recipes.
   - `src/app/api/orders/route.ts` (lines 317–339, 424–460): Computes total material requirements strictly from `item.variant.ingredients`, validates stock availability, decrements `product.stock`, `productVariant.stock`, and `rawMaterial.stock` atomically in `prisma.$transaction`.
   - `src/app/api/orders/route.ts` (lines 561–649, 714–789): Voiding (`PUT`) and permanent deletion (`DELETE`) restore raw materials by incrementing `rawMaterial.stock` based on `item.variant.ingredients` and logging `rawMaterialLog` with type `"koreksi"`.

3. **Frontend UI Integration**:
   - `src/app/products/page.tsx`: Contains an interactive tab switcher across all 4 variants (`prodVariants.map`), allowing baristas to view, add, modify amounts, delete ingredients, copy recipes between variants, and calculate/apply HPP. Submits complete variant recipes via `POST`/`PUT`.
   - `src/components/PosProductModal.tsx`: Renders real-time availability badges (`"Bahan Habis"` vs `"✓ X Porsi"`) on variant buttons, dynamically disabling out-of-stock variants.
   - `src/app/pos/page.tsx` & `src/app/po/page.tsx`: Transmit both `productId` and `variantId` in order line items.

4. **Live Database Inspection**:
   - Command: `npx tsx -e "import { prisma } from './src/lib/prisma'; prisma.productVariant.findMany({ include: { ingredients: { include: { rawMaterial: true } }, product: true } }).then(vs => { ... })"`
   - Output:
     ```text
     Variants total: 28
     Variants with 0 ingredients: 0
     1. Aren Coffee Milk [Botol 1.000 ML] -> Price: 55000, StoredCost: 25772.32, CalculatedHPP: 25772.32, Ingredients: 8
     2. Aren Coffee Milk [Botol 1.000 ML] -> Price: 55000, StoredCost: 25772.32, CalculatedHPP: 25772.32, Ingredients: 8
     3. Aren Coffee Milk [Botol 250 ML] -> Price: 15000, StoredCost: 7067.42, CalculatedHPP: 7067.42, Ingredients: 8
     4. Aren Coffee Milk [Botol 250 ML] -> Price: 15000, StoredCost: 7067.42, CalculatedHPP: 7067.42, Ingredients: 8
     5. Aren Coffee Milk [Cup Large] -> Price: 16000, StoredCost: 7092.81, CalculatedHPP: 7092.81, Ingredients: 8
     6. Aren Coffee Milk [Cup Large] -> Price: 16000, StoredCost: 7092.81, CalculatedHPP: 7092.81, Ingredients: 8
     7. Aren Coffee Milk [Cup Reguler] -> Price: 13000, StoredCost: 5796.63, CalculatedHPP: 5796.63, Ingredients: 8
     8. Aren Coffee Milk [Cup Reguler] -> Price: 13000, StoredCost: 5796.63, CalculatedHPP: 5796.63, Ingredients: 8
     ...
     28. Matcha Latte [Cup Reguler] -> Price: 16000, StoredCost: 8524.88, CalculatedHPP: 8524.88, Ingredients: 8
     ```
   - 28 variants are present. All 28 have authentic ingredients (7 to 8 ingredients per recipe). All `StoredCost` values strictly equal `CalculatedHPP`.

5. **Automated Test Suite Execution**:
   - Command: `npx tsx scripts/tests/e2e_variant_recipe_suite.ts`
   - Output:
     ```text
     Test Suites: 10 passed, 10 total
     Tests:       45 passed, 45 total
     Time:        1.10s
     ```

### 1.2 Type Check & Build Failures (Integrity Finding)

1. **Static Type Checking Failure**:
   - Command: `npx tsc --noEmit`
   - Exit Code: `1`
   - Verbatim Output:
     ```text
     prisma/seed-recipes.ts(27,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
     prisma/seed-recipes.ts(31,65): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(32,65): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(33,65): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(34,64): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(35,64): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(37,65): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(38,65): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(39,68): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(40,64): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(41,64): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(43,67): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(44,65): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(45,64): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     prisma/seed-recipes.ts(46,64): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     scripts/import_to_neon.ts(115,9): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type '(Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput) | (Without<...> & ProductIngredientCreateInput)'.
     scripts/seed_bottle_and_caffe_latte.ts(321,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
     scripts/seed_bottle_and_caffe_latte.ts(333,11): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     scripts/seed_cup_menu_and_materials.ts(340,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
     scripts/seed_cup_menu_and_materials.ts(352,11): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     scripts/update_hpp_and_packaging.ts(464,16): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'.
     scripts/update_hpp_and_packaging.ts(476,11): error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'Without<ProductIngredientCreateInput, ProductIngredientUncheckedCreateInput> & ProductIngredientUncheckedCreateInput'.
     ```

2. **Next.js Production Build Failure**:
   - Command: `npm run build`
   - Exit Code: `1`
   - Verbatim Output:
     ```text
     Creating an optimized production build ...
     ✓ Compiled successfully in 1166ms
       Running TypeScript ...
     [... same 22 TS2353 errors in prisma/seed-recipes.ts and scripts/ ...]
     Failed to type check.
     ```

---

## 2. Logic Chain

1. **Step 1 — Verification of Substantive Deliverables**:
   Direct inspection confirms that the core engineering work requested in `ORIGINAL_REQUEST.md` (R1–R5) was genuinely performed:
   - Database model migrated to `ProductVariant 1-N ProductIngredient`.
   - Dynamic HPP and stock readiness engines implemented without hardcoding or facades.
   - POS checkout and void logic strictly deplete and restore raw materials based on variant recipes.
   - Management UI and POS modals are fully interactive and connected to live APIs.
   - Live Neon database holds 28 variants with authentic recipe rows.
   - Dedicated E2E test suite executes and passes 100% (45/45 tests).

2. **Step 2 — Behavioral Verification Standard**:
   According to the Integrity Forensics standard:
   > "Build and run: Build the project from source and run its test suite. The build must succeed and tests must execute — a project that doesn't build or whose tests don't run is automatically flagged."
   > "Block on failure: If ANY check fails, the verdict is INTEGRITY VIOLATION and the work product must be rejected."

3. **Step 3 — Cause of Failure**:
   The project fails `npx tsc --noEmit` and `npm run build` because 5 historical utility scripts were left unmigrated:
   - `prisma/seed-recipes.ts` (15 errors)
   - `scripts/import_to_neon.ts` (1 error)
   - `scripts/seed_bottle_and_caffe_latte.ts` (2 errors)
   - `scripts/seed_cup_menu_and_materials.ts` (2 errors)
   - `scripts/update_hpp_and_packaging.ts` (2 errors)
   Because `tsconfig.json` includes `**/*.ts`, these obsolete files break project-wide compilation. Consequently, standard production deployments (`next build`) are broken.

4. **Step 4 — Conclusion Inevitability**:
   An auditor is strictly prohibited from altering implementation code (`"Audit-only — do NOT modify implementation code"`). Because the build fails and `npx tsc --noEmit` fails, the auditor must strictly reject the work product under the prompt's integrity rules until the development team remedies the compilation errors.

---

## 3. Caveats

1. The core production application logic under `src/` is completely free of type errors and correctly implements the variant recipe domain.
2. The failing scripts are legacy offline seeds and migration tools; they are not invoked in runtime request handling, yet they prevent `npm run build` from succeeding due to TypeScript's global project scan.
3. No security backdoors, hardcoded mocks, or facade patterns were found in the implementation. The violation is solely a build/typecheck breakage resulting from unmigrated legacy utility code.

---

## 4. Conclusion

**Verdict: INTEGRITY VIOLATION (REJECTED)**

The work product implements authentic business logic for the Strict Per-Variant Recipe System, but **fails mandatory verification criteria**:
1. `npx tsc --noEmit` failed with 22 compilation errors.
2. `npm run build` failed to compile.

### Actionable Remediation Required:
The development team must resolve the 22 compilation errors in the 5 legacy files by either:
1. Updating them to reference `variantId` instead of `productId`, OR
2. Excluding them from `tsconfig.json` (or archiving/deleting them if they are obsolete historical artifacts),
so that `npx tsc --noEmit` and `npm run build` pass with exit code 0.

---

## 5. Verification Method

To independently reproduce the findings, execute the following commands in the workspace root:

1. **Verify Test Suite**:
   ```powershell
   npx tsx scripts/tests/e2e_variant_recipe_suite.ts
   # Expected: 45 passed, 45 total (Exit code 0)
   ```

2. **Verify Type Check Failure**:
   ```powershell
   npx tsc --noEmit
   # Expected: Fails with 22 TS2353 errors in prisma/seed-recipes.ts and scripts/ (Exit code 1)
   ```

3. **Verify Build Failure**:
   ```powershell
   npm run build
   # Expected: Fails at "Running TypeScript ... Failed to type check" (Exit code 1)
   ```

4. **Verify Live Database Variants**:
   ```powershell
   npx tsx -e "import { prisma } from './src/lib/prisma'; prisma.productVariant.findMany({ include: { ingredients: true } }).then(vs => console.log('Variants:', vs.length, 'Empty:', vs.filter(v => v.ingredients.length === 0).length));"
   # Expected: Variants: 28 Empty: 0
   ```
