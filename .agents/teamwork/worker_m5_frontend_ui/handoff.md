# Milestone 5: Full-Stack Recipe Management UI Handoff Report

## 1. Observation

### 1.1 Context and Prior State
Prior to Milestone 5, the frontend treated recipes as a single flat list attached directly to the `Product` entity (`prodIngredients: []`), ignoring variants (`ProductVariant`). Consequently:
- In `src/app/products/page.tsx`, the recipe editor only modified one set of ingredients per product, and "Terapkan ke Modal/HPP" only updated `prodCost`.
- In `src/components/PosProductModal.tsx`, size buttons did not indicate whether ingredients or physical containers for that size were available in inventory.
- In `src/app/pos/page.tsx`, catalog cards did not indicate partial variant stock readiness.
- In `src/app/po/page.tsx`, the pre-order modal only allowed picking a product with zero variant choice, making it impossible to assign recipes or deplete variant-specific materials for PO transactions.

### 1.2 Implemented Changes & Verbatim Quotes

#### A. `src/app/products/page.tsx`
- **State Redesign**:
  `VariantFormItem` now holds an array of ingredients:
  ```ts
  interface VariantIngredientItem {
    rawMaterialId: string;
    amount: number;
  }

  interface VariantFormItem {
    id?: string;
    packaging: string; // "Cup" | "Botol"
    size: string; // "Reguler", "Large", "250 ML", "1.000 ML"
    price: number;
    cost: number;
    stock: number;
    isActive: boolean;
    ingredients: VariantIngredientItem[];
  }
  ```
- **Interactive Variant Tab Switcher**:
  Replaced the single recipe section with a multi-variant BOM manager:
  ```tsx
  {prodVariants.map((v, idx) => {
    const isSelected = selectedVariantIdx === idx;
    const ingCount = (v.ingredients || []).length;
    return (
      <button
        key={idx}
        type="button"
        onClick={() => { setSelectedVariantIdx(idx); setCopySourceIdx(null); }}
        className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border ...`}
      >
        <span>{v.packaging === "Cup" ? "🥤" : "🍾"}</span>
        <span>{v.packaging} {v.size}</span>
        <span className="...">({ingCount} bahan)</span>
      </button>
    );
  })}
  ```
- **Per-Variant Ingredient Operations**:
  - `handleAddVariantIngredient(variantIdx)`: adds `{ rawMaterialId: rawMaterials[0].id, amount: 1 }`.
  - `handleRemoveVariantIngredient(variantIdx, ingIdx)`: removes ingredient.
  - `handleVariantIngredientChange(variantIdx, ingIdx, field, value)`: updates ingredient amount or rawMaterialId.
  - `handleCopyRecipe(targetIdx, sourceIdx)`: copies ingredients from another variant with deep cloning.
- **Live Variant HPP & Apply Cost Button**:
  Calculates $\sum (\text{amount} \times \text{costPerUnit})$ for the selected variant and allows clicking `"Terapkan ke Modal Varian Ini"` to set `prodVariants[selectedVariantIdx].cost`.
- **Form Submission**:
  Sends `variants: prodVariants.map(v => ({ ...v, ingredients: v.ingredients }))` in both `POST` and `PUT /api/products`.
- **Products Table Presentation**:
  - "Modal (HPP)" column displays base cost plus individual variant HPP badges.
  - "Bahan Baku & Kesiapan" column evaluates variants and shows summary badge (`✓ Semua Varian Siap`, `⚠️ Sebagian Habis (X/Y)`, or `⚠️ Bahan Habis`) along with individual variant readiness pills.

#### B. `src/components/PosProductModal.tsx`
- **Readiness Fields**:
  Added `isAvailableByIngredients`, `missingIngredients`, `maxProducible`, and `calculatedHpp` to `ProductVariant`.
- **Real-Time Availability Badges on Variant Tiles**:
  ```tsx
  const isOutOfStock =
    v.isAvailableByIngredients === false ||
    (v.maxProducible !== null && v.maxProducible !== undefined && v.maxProducible <= 0);
  ```
  Renders badge:
  - If `isOutOfStock`: `Bahan Habis` (rose text & background).
  - If available: `✓ ${v.maxProducible} Porsi` (emerald).
- **Out of Stock Alert & Protection**:
  Displays warning box detailing missing ingredients if the selected variant cannot be prepared, and disables the "Tambah Pesanan" button (`cursor-not-allowed`, rose color) to prevent invalid orders.

#### C. `src/app/pos/page.tsx`
- **Catalog Cards Variant Readiness Summary**:
  Evaluates active variants for each product card:
  - If all variants ready: `✓ X Varian Siap` (emerald).
  - If partial ready: `⚠️ Sebagian Habis (X/Y)` (amber).
  - If all out: `⚠️ Bahan Habis` (rose).
- **Clean Variant ID Dispatch**:
  Maps cart items to clean variant IDs in `handleConfirmPayment`:
  ```ts
  variantId: item.variant?.id && !item.variant.id.startsWith("default-") ? item.variant.id : null
  ```

#### D. `src/app/po/page.tsx`
- **PO Items State**:
  Updated to include `variantId`:
  `{ productId: string; variantId: string; qty: number; notes: string; price: number }[]`
- **Variant Dropdown in PO Modal**:
  Renders variant `<select>` displaying packaging, size, price, and readiness (e.g. `(Sisa: 25 porsi)` or `⚠️ [Bahan Habis]`).
- **Validation & Submission**:
  Verifies that selected variants are in stock before submitting PO, and includes `variantId` in `payload.items`.

### 1.3 TypeScript Verification Command & Result
Ran:
```powershell
npx tsc --noEmit
```
Result:
- **0 errors** in `src/app/products/page.tsx`
- **0 errors** in `src/components/PosProductModal.tsx`
- **0 errors** in `src/app/pos/page.tsx`
- **0 errors** in `src/app/po/page.tsx`
- **0 errors across the entire `src/` directory** (`npx tsc --noEmit | Select-String "src/"` returned empty).

---

## 2. Logic Chain

1. **Premise**: User Requirement R5 and Milestone 5 specify a full-stack recipe management UI allowing administrators to view, add, adjust, and delete raw material ingredients per variant, compute live HPP per variant, and surface variant readiness in POS and PO workflows.
2. **From Observation 1.2.A**: In `src/app/products/page.tsx`, by structuring `VariantFormItem.ingredients` as a nested array, adding the Variant Tab Switcher (`[🥤 Cup Reguler] [🥤 Cup Large] [🍾 Botol 250 ML] [🍾 Botol 1.000 ML]`), providing the "Salin Resep dari Varian Lain" helper, and synchronizing `calculatedHpp` to `v.cost`, administrators now possess full granular control over variant recipes.
3. **From Observation 1.2.B**: In `src/components/PosProductModal.tsx`, size buttons dynamically render `✓ X Porsi` or `Bahan Habis`, preventing cashiers from placing orders for beverage variants whose ingredients or containers are depleted.
4. **From Observation 1.2.C**: In `src/app/pos/page.tsx`, catalog cards provide instant visual cues (`⚠️ Sebagian Habis`) so cashiers do not prematurely assume an entire menu is depleted when alternative sizes remain orderable.
5. **From Observation 1.2.D**: In `src/app/po/page.tsx`, users can pick the specific variant for pre-orders, guaranteeing that backend inventory depletion receives exact `variantId`s for PO fulfillment.
6. **From Observation 1.3**: The TypeScript compiler confirms 0 errors in all modified frontend files and all `src/` app files, ensuring high architectural stability.

---

## 3. Caveats

- **Scope Boundary**: Files outside frontend write ownership (e.g. legacy seed scripts in `prisma/seed-recipes.ts` and `scripts/*.ts`) still reference legacy `productId` fields from prior schema versions and will be updated in Milestone 6 / verification scripts.
- **Backend Dependency**: Full runtime persistence depends on the `/api/products` endpoints from Milestone 2 & 3, which are already in place and accept nested variant ingredients.

---

## 4. Conclusion

Milestone 5 is fully accomplished:
- Admin Product Page supports strict per-variant recipe management (BOM) with variant tabs, live HPP calculation, copy recipe helpers, and table readiness indicators.
- POS Modal shows real-time availability badges (`✓ X Porsi` or `Bahan Habis`) and disables checkout for unavailable variants.
- POS Catalog Cards summarize variant readiness (`⚠️ Sebagian Habis`).
- PO Modal supports variant selection dropdowns and forwards `variantId` cleanly to `/api/orders`.
- 0 TypeScript errors across all modified frontend files.

---

## 5. Verification Method

### 5.1 Automated Type Check
Run:
```powershell
npx tsc --noEmit
```
Confirm that no errors originate from:
- `src/app/products/page.tsx`
- `src/components/PosProductModal.tsx`
- `src/app/pos/page.tsx`
- `src/app/po/page.tsx`

Run:
```powershell
npx tsc --noEmit | Select-String "src/"
```
Confirm 0 output lines (0 errors in `src/`).

### 5.2 Manual UI Verification
1. Navigate to `http://localhost:3000/products`:
   - Open modal for any beverage (e.g. "Aren Coffee Milk").
   - Confirm the Variant Tab Switcher displays: `[🥤 Cup Reguler]`, `[🥤 Cup Large]`, `[🍾 Botol 250 ML]`, `[🍾 Botol 1.000 ML]`.
   - Add ingredients to "Cup Reguler" and click "Terapkan ke Modal Varian Ini".
   - Switch to "Cup Large", use "Salin Resep dari Varian Lain" -> select "Cup Reguler", verify all ingredients copy over, and scale up ml/gram.
   - Save the product and observe variant HPP and readiness badges in the table.
2. Navigate to `http://localhost:3000/pos`:
   - Inspect product cards: check for `✓ X Varian Siap` or `⚠️ Sebagian Habis`.
   - Click a card to open `PosProductModal`: observe `✓ X Porsi` on ready size tiles and `Bahan Habis` on depleted tiles.
3. Navigate to `http://localhost:3000/po`:
   - Click "+ Buat PO Baru".
   - In "Daftar Menu Pesanan", select a product and observe the variant selector dropdown displaying packaging, size, price, and remaining portions.
