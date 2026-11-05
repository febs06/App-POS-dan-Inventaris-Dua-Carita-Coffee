## 2026-11-05T15:52:55Z
Read ORIGINAL_REQUEST.md at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\ORIGINAL_REQUEST.md.
Read PROJECT.md at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\PROJECT.md.
Read Frontend Survey Handoff at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\explorer_survey_frontend\handoff.md.
Your working directory is c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\worker_m5_frontend_ui\.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File write ownership:
You exclusively own:
- `src/app/products/page.tsx`
- `src/components/PosProductModal.tsx`
- `src/app/pos/page.tsx`
- `src/app/po/page.tsx`

Mission for Milestone 5 (Full-Stack Recipe Management UI):
1. `src/app/products/page.tsx`:
   - Redesign state: `VariantFormItem` should store `ingredients: { rawMaterialId: string; amount: number }[]`.
   - In Product Modal (`isProductModalOpen`), replace the single product-level recipe editor with an interactive Variant Tab Switcher:
     `[🥤 Cup Reguler] [🥤 Cup Large] [🍾 Botol 250 ML] [🍾 Botol 1.000 ML]`.
   - For the currently selected variant tab, display its ingredient list, allow adding new ingredients (`+ Bahan`), modifying amounts, and deleting ingredients.
   - Provide a "Salin Resep dari Varian Lain" helper button (e.g. easily copy from Reguler to Large or Bottle).
   - Display live calculated HPP for each variant: $\sum (\text{amount} \times \text{rawMaterial.costPerUnit})$.
   - Add button "Terapkan ke Modal Varian Ini" which updates that variant's `cost`.
   - When submitting form (create or update product), send `variants` array with nested `ingredients` array so `POST` and `PUT /api/products` save variant recipes.
   - In the Products Table, display variant HPP badges and variant readiness.
2. `src/components/PosProductModal.tsx`:
   - Display real-time availability badges on each variant size tile:
     - If variant `isAvailableByIngredients === false` or `maxProducible <= 0`: display badge `Bahan Habis` (rose color) and disable or alert on selection.
     - If available: display badge `✓ {v.maxProducible} Porsi` (emerald color).
3. `src/app/pos/page.tsx`:
   - Display variant readiness summaries on product catalog cards (e.g. "Sebagian Habis" if some variants are ready and some not).
   - Ensure cart items pass `variantId` cleanly to `POST /api/orders`.
4. `src/app/po/page.tsx`:
   - Add variant selection dropdown when adding items in the Pre-Order modal so each PO item has a valid `variantId`.
5. Verify:
   - Run `npx tsc --noEmit` and confirm 0 TypeScript errors across the modified frontend files.
   - Run `npm run build` and confirm successful build.
6. Write handoff report to `c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\worker_m5_frontend_ui\handoff.md` and send message when done.
