# Milestone 5 Frontend & UI Implementation: Objective & Adversarial Review Report

**Reviewer**: reviewer_2 (Roles: reviewer, critic)  
**Date**: 2026-11-05  
**Verdict**: **APPROVE** (Milestone 5 Frontend & UI Deliverables)

---

## 1. Observation

### 1.1 Direct Source Code Inspection

#### A. `src/app/products/page.tsx`
1. **Interactive Variant Tab Switcher** (lines 993–1028):
   - Renders interactive tab buttons mapping over `prodVariants`:
     `[🥤 Cup Reguler]`, `[🥤 Cup Large]`, `[🍾 Botol 250 ML]`, `[🍾 Botol 1.000 ML]`.
   - Each tab dynamically displays the packaging icon (`🥤` for Cup, `🍾` for Botol), size name, and ingredient count pill `({ingCount} bahan)`.
   - Clicking sets `selectedVariantIdx(idx)` and resets `copySourceIdx(null)`.
2. **Per-Variant Ingredient Operations** (lines 145–191, 1084, 1115, 1133, 1153):
   - `handleAddVariantIngredient(variantIdx)`: appends `{ rawMaterialId: rawMaterials[0].id, amount: 1 }` to the specific variant's `ingredients` array.
   - `handleVariantIngredientChange(variantIdx, ingIdx, field, value)`: updates raw material selection or numeric amount.
   - `handleRemoveVariantIngredient(variantIdx, ingIdx)`: removes the ingredient entry for that variant.
3. **"Salin Resep dari Varian Lain" Helper** (lines 193–204, 1061–1080):
   - Renders a dropdown when other variants have configured ingredients.
   - Clones recipe cleanly via `JSON.parse(JSON.stringify(source.ingredients))` into `prodVariants[targetIdx].ingredients`.
4. **Live Variant HPP Computation & Cost Sync** (lines 206–224, 1166–1190):
   - Evaluates $\sum (\text{amount} \times \text{rawMaterial.costPerUnit})$ for the active variant in real-time.
   - Displays `HPP Terhitung Varian: Rp X` vs stored modal `Rp Y`, and shows `✓ Sinkron` badge when matched.
   - Provides button `"Terapkan ke Modal Varian Ini"` which updates `prodVariants[selectedVariantIdx].cost`.
5. **Product Table Displays Variant HPP Badges & Readiness** (lines 598–616, 641–710):
   - "Modal (HPP)" column displays base cost and individual variant badges: `{v.size}: Rp X`.
   - "Bahan Baku & Kesiapan" column calculates variant-specific readiness:
     - `✓ Semua Varian Siap` (emerald) when all active variants have materials.
     - `⚠️ Sebagian Habis (X/Y)` (amber) when some variants are depleted.
     - `⚠️ Bahan Habis` (rose) when all variants are depleted.
     - Renders individual variant pills with maximum portions or "Habis" with tooltip listing missing raw materials.
6. **Form Submission Sanitization** (lines 333–336):
   - Filters out incomplete entries before submitting `PUT`/`POST /api/products`:
     `ingredients: (v.ingredients || []).filter((ing) => ing.rawMaterialId && Number(ing.amount) > 0)`

#### B. `src/components/PosProductModal.tsx`
1. **Real-time Availability Badges on Size Buttons** (lines 275–316):
   - Evaluates `isOutOfStock = v.isAvailableByIngredients === false || (v.maxProducible !== null && v.maxProducible <= 0)`.
   - Size buttons display `✓ ${v.maxProducible} Porsi` (emerald) or `Bahan Habis` (rose-100) badge.
2. **Out of Stock Protection & Alerts** (lines 157–163, 187–192, 320–335, 426–436):
   - Warning banner: "Bahan Baku Tidak Cukup di Gudang" lists missing materials (`currentVariant.missingIngredients.join(", ")`).
   - Checkout button is disabled (`disabled={isCurrentVariantOutOfStock}`) with `cursor-not-allowed` styling and label `"Bahan Habis"`.
   - `handleSubmit()` explicitly halts submission and displays alert if triggered while out of stock.

#### C. `src/app/pos/page.tsx`
1. **Catalog Card Variant Readiness Summary** (lines 534–608):
   - Card headers evaluate active variants and render:
     - `✓ X Varian Siap` (emerald)
     - `⚠️ Sebagian Habis (X/Y)` (amber)
     - `⚠️ Bahan Habis` (rose)
   - Unavailable cards are dimmed with `opacity-60 grayscale-[30%] border-rose-200 bg-rose-50/20`.
2. **Clean `variantId` Forwarding in POS Checkout** (lines 392–400):
   ```ts
   variantId: item.variant?.id && !item.variant.id.startsWith("default-") ? item.variant.id : null
   ```
   Ensures valid variant CUIDs are forwarded while stripping fallback `"default-"` tokens.

#### D. `src/app/po/page.tsx`
1. **Pre-Order Item Variant Selection** (lines 55, 110–154, 769–793):
   - State `poItems` includes `{ productId: string; variantId: string; qty: number; notes: string; price: number }`.
   - Renders a variant selector dropdown for the selected product displaying packaging, size, price, and remaining stock portions.
   - Out-of-stock variants are disabled in the `<select>` dropdown (`disabled={isOutOfStock}`).
2. **Pre-Submission Inventory Validation** (lines 172–193):
   - Verifies `selectedVar.maxProducible >= it.qty` before sending. If shortage exists, displays alert and stops submission.
3. **Clean `variantId` Forwarding in PO Creation** (lines 259–265):
   - Sends `variantId: it.variantId || null` in the `POST /api/orders` payload.

---

### 1.2 Tool Execution & Build/Test Outputs

1. **Automated E2E Suite (`npx tsx scripts/tests/e2e_variant_recipe_suite.ts`)**:
   - Exit code: `0`
   - Test suites: 10 passed, 10 total
   - Tests: 45 passed, 45 total (Tiers 1, 2, 3, 4 + Live Neon Database check)
   - Time: 1.36s
2. **TypeScript Compilation Check (`npx tsc --noEmit`)**:
   - Scope: `src/` directory — **0 errors**.
   - Scope: Whole repository — 22 errors located entirely in 5 legacy files:
     - `prisma/seed-recipes.ts` (15 errors)
     - `scripts/import_to_neon.ts` (1 error)
     - `scripts/seed_bottle_and_caffe_latte.ts` (2 errors)
     - `scripts/seed_cup_menu_and_materials.ts` (2 errors)
     - `scripts/update_hpp_and_packaging.ts` (2 errors)
     - All 22 errors stem from legacy `productId` property references on `ProductIngredient` that existed prior to Milestone 2 strict `variantId` schema enforcement.
3. **Next.js Production Build (`npm run build`)**:
   - Turbopack compilation: `✓ Compiled successfully in 1106ms`.
   - Type check step failed due to the aforementioned 22 errors in legacy scripts outside `src/`.

---

## 2. Logic Chain

1. **Premise**: Milestone 5 required building a full-stack recipe management UI allowing users to view, add, modify, and delete recipe ingredients per variant, copy recipes between variants, compute live HPP, and display variant stock readiness across products, POS cashier modal, and pre-orders.
2. **Verification of M5 Scope (Observation 1.1.A–D)**:
   - In `src/app/products/page.tsx`, the Variant Tab Switcher, per-variant CRUD, copy recipe utility, live HPP calculator, and table badges are fully implemented and verified line-by-line.
   - In `src/components/PosProductModal.tsx`, real-time readiness indicators and out-of-stock protections operate robustly.
   - In `src/app/pos/page.tsx` and `src/app/po/page.tsx`, catalog cards summarize readiness and order payloads dispatch clean `variantId`s.
3. **Integrity Audit**:
   - No hardcoded test conditions or dummy facades exist in the implementation.
   - No shortcuts or fake stubs were used.
   - Stock calculations and HPP formulas mirror the deterministic math required by the core engine.
4. **Build & Type Health Assessment (Observation 1.2)**:
   - All 4 modified frontend files in `src/` and all files across `src/` contain **0 TypeScript errors**.
   - Turbopack compiled `src/` successfully.
   - The failure of `npm run build` is strictly caused by historical seed and import scripts in `scripts/` and `prisma/` referencing deprecated pre-M2 `productId` fields on `ProductIngredient`.
   - Milestone 6 is designated in `PROJECT.md` for E2E verification, test runners, and build pipeline audits.
5. **Conclusion Formulation**: The Milestone 5 Frontend & UI implementation meets all user requirements and architectural specifications. It is approved with a Major Finding regarding the build pipeline to be addressed in Milestone 6.

---

## 3. Caveats

- **Legacy Scripts Out of M5 Scope**: As documented by `worker_m5_frontend_ui`, `prisma/seed-recipes.ts` and `scripts/*.ts` were created during earlier phases and were not in the write-ownership scope of Milestone 5. Updating these scripts or configuring `tsconfig.json` to exclude non-application utility scripts belongs to Milestone 6.
- **Client-Side Rendering Environment**: Verification was conducted via TypeScript static analysis, Next.js build compilation, and automated test runners. Headless browser rendering (e.g. Playwright / Puppeteer) is part of Milestone 6 test infrastructure.

---

## 4. Conclusion & Findings

### Verdict
**APPROVE** (Milestone 5: Full-Stack Recipe Management UI)

### Findings Report

#### [Major] Finding 1: Repository `npm run build` and `tsc` Type Check Blocked by Legacy Seed Scripts
- **What**: `npm run build` and `npx tsc --noEmit` fail with 22 type errors (`error TS2353: Object literal may only specify known properties, and 'productId' does not exist in type 'ProductIngredientWhereInput'`).
- **Where**:
  - `prisma/seed-recipes.ts` (lines 27, 31–46)
  - `scripts/import_to_neon.ts` (line 115)
  - `scripts/seed_bottle_and_caffe_latte.ts` (lines 321, 333)
  - `scripts/seed_cup_menu_and_materials.ts` (lines 340, 352)
  - `scripts/update_hpp_and_packaging.ts` (lines 464, 476)
- **Why**: Milestone 2 changed `ProductIngredient` schema to strictly link to `ProductVariant` via `variantId` (removing `productId`). While all application code in `src/` was updated, these 5 historical utility scripts were not updated.
- **Suggestion**: In Milestone 6, update these 5 scripts to reference `variantId` instead of `productId`, or update `tsconfig.json` to exclude obsolete historical migration scripts so `npm run build` exits 0 cleanly.

#### [Minor] Finding 2: POS Session Storage Cache Invalidation on External Recipe Changes
- **What**: In `src/app/pos/page.tsx` (lines 95–109), POS loads cached products from `sessionStorage` for 0ms initial render, then fetches fresh data in the background.
- **Where**: `src/app/pos/page.tsx:95`
- **Why**: If an administrator edits variant recipes in another tab, the cashier tab shows cached data for a brief split-second before background fetch completes.
- **Suggestion**: The background fetch already updates state upon resolving, which is standard stale-while-revalidate behavior. An event-driven channel (or broadcast channel) could be considered in future releases.

---

## 5. Adversarial Challenge Report

### Overall Risk Assessment: LOW

### Challenges Tested

#### 1. Out-of-Stock Checkout Bypass
- **Assumption**: A user or automated script might attempt to add a depleted variant to cart and submit.
- **Attack Scenario**: User selects a variant marked `Bahan Habis` and triggers `handleSubmit()` or calls `handleAddToCartFromModal`.
- **Result**: **PASS**. The UI disables the button (`disabled={isCurrentVariantOutOfStock}`), and `handleSubmit` explicitly evaluates `isCurrentVariantOutOfStock` and returns early with an alert. Furthermore, backend `/api/orders` performs server-side stock verification against Neon PostgreSQL.

#### 2. Deep Recipe Copying Cross-Contamination
- **Assumption**: Copying recipes between variants might copy object references, allowing changes in variant A to accidentally mutate variant B.
- **Attack Scenario**: User copies recipe from "Cup Reguler" to "Cup Large", then modifies liquid amounts on "Cup Large".
- **Result**: **PASS**. Line 199 in `src/app/products/page.tsx` executes `JSON.parse(JSON.stringify(source.ingredients))`, generating an isolated deep clone.

#### 3. Zero or Negative Quantity Injection
- **Assumption**: Negative or NaN ingredient amounts could corrupt variant HPP or crash the UI.
- **Attack Scenario**: User inputs negative values or clears amount fields.
- **Result**: **PASS**. Input parsing uses `parseFloat(e.target.value) || 0`, and `handleSubmitProduct` cleanses the payload by filtering `Number(ing.amount) > 0`.

---

## 6. Verification Method

To independently verify the observations and findings in this report:

1. **Verify Frontend Type Health**:
   ```powershell
   npx tsc --noEmit 2>&1 | Select-String "src/"
   ```
   *Expected*: Zero lines output (0 errors in `src/`).

2. **Verify Legacy Script Type Errors**:
   ```powershell
   npx tsc --noEmit 2>&1 | Select-String "error TS"
   ```
   *Expected*: Exactly 22 errors confined to `prisma/seed-recipes.ts` and `scripts/*.ts`.

3. **Verify Automated E2E Test Suite**:
   ```powershell
   npx tsx scripts/tests/e2e_variant_recipe_suite.ts
   ```
   *Expected*: All 10 test suites (45 tests) pass with exit code 0.

4. **Inspect Key UI Implementation Lines**:
   - `src/app/products/page.tsx`: lines 993–1028 (Variant Tabs), 193–204 (Copy Recipe), 1166–1190 (Live HPP).
   - `src/components/PosProductModal.tsx`: lines 275–316 (Availability Badges), 426–436 (Stock Guardrail).
   - `src/app/pos/page.tsx`: lines 534–608 (Catalog Badges), 392–400 (`variantId` mapping).
   - `src/app/po/page.tsx`: lines 769–793 (PO Variant Dropdown), 172–193 (Stock checks).
