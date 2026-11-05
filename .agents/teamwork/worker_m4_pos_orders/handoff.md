# Handoff Report: Milestone 4 (POS Variant-Aware Inventory Depletion)

## 1. Observation
- `prisma/schema.prisma` lines 56-73 and 249-260 define `ProductVariant` owning `ProductIngredient[]` (`variantId` foreign key with compound unique constraint `@@unique([variantId, rawMaterialId])`), with `Product.ingredients` completely removed in Milestone 2.
- In `src/app/api/orders/route.ts` prior to modification:
  - `POST` attempted `prisma.product.findMany` with `include: { ingredients: { include: { rawMaterial: true } } }` (error TS2353: 'ingredients' does not exist in type 'ProductInclude').
  - Required raw materials were aggregated from `item.product.ingredients` (error TS2339).
  - Only `tx.product.update` was performed; `productVariant.stock` was never decremented.
  - `PUT` (void) line 450 and `DELETE` line 584 included `product: { include: { ingredients: true } }` (error TS2353), causing TS compiler failure and failing to restore raw materials for variant recipes.
- Running `npx tsc --noEmit` before modification produced multiple errors on `src/app/api/orders/route.ts`:
  ```
  src/app/api/orders/route.ts(158,9): error TS2353: Object literal may only specify known properties, and 'ingredients' does not exist in type 'ProductInclude<DefaultArgs>'.
  src/app/api/orders/route.ts(270,38): error TS2339: Property 'ingredients' does not exist on type...
  src/app/api/orders/route.ts(450,26): error TS2353: Object literal may only specify known properties, and 'ingredients' does not exist in type 'ProductInclude<DefaultArgs>'.
  src/app/api/orders/route.ts(584,26): error TS2353: Object literal may only specify known properties, and 'ingredients' does not exist in type 'ProductInclude<DefaultArgs>'.
  ```

## 2. Logic Chain
1. **Schema Adherence & Query Design**:
   - Because `ProductIngredient` is strictly keyed to `variantId`, `POST /api/orders` was updated to query products with `variants: { include: { ingredients: { include: { rawMaterial: true } } } }`.
   - Items with `variantId` are resolved directly to that variant. If `item.variantId` is missing, the system finds the default active variant for the product (prioritizing `packaging: "Cup", size: "Reguler"`, followed by active `Cup`, followed by any active variant). If no active variant is found, it returns HTTP 400.
2. **Deterministic Material Depletion**:
   - `requiredMaterialsMap` is strictly computed from `item.variant.ingredients`.
   - Before opening the database transaction, raw material stock sufficiency is validated, returning a clear HTTP 400 error message if any ingredient is deficient.
   - Inside `prisma.$transaction`:
     - Creates the order with `items: { create: validatedItems.map(item => ({ productId: item.productId, variantId: item.variantId, qty: item.qty, price: item.price, notes: item.notes })) }`.
     - Decrements `product.stock` by `item.qty`.
     - Decrements `productVariant.stock` by `item.qty`.
     - Records `StockLog` for each product.
     - Decrements `rawMaterial.stock` for each material by total aggregated requirement.
     - Records `RawMaterialLog` entries with `type: "pemakaian"`.
3. **Conservation of Inventory on Void & Delete**:
   - `PUT /api/orders` (when `isVoided = true`) and `DELETE /api/orders` (when `restoreStock = true` and `!order.isVoided`) query order items with `variant: { include: { ingredients: { include: { rawMaterial: true } } } }`.
   - Stock increments are applied to both `product.stock` and `productVariant.stock` (with null-check for `item.variantId` and `item.variant` to handle legacy orders safely).
   - Raw material stocks are restored by `ing.amount * item.qty` with `RawMaterialLog` entries recorded with `type: "koreksi"`.
4. **Verification & Regression Testing**:
   - Running `npx tsc --noEmit` confirms 0 TypeScript errors on `src/app/api/orders/route.ts`.
   - Running `npx tsx scripts/tests/pos_depletion_suite.ts` passes all 10 unit tests across Feature 7 and Feature 8 with 0 failures.
   - Running `npx tsx scripts/tests/e2e_variant_recipe_suite.ts` passes all 45 automated tests across all 10 suites.
   - Executing a live integration pipeline against the Neon database verified real checkout depletion, void stock restoration, delete stock restoration, and default variant fallback with 100% stock conservation.

## 3. Caveats
- Legacy historical orders created prior to Milestone 2 with `variantId = null` will have their `product.stock` restored upon void/delete, but cannot restore variant-specific ingredients because no recipe was bound to them at transaction time. This is expected and handled safely without throwing runtime exceptions.
- Other files in the project outside our ownership scope (`prisma/seed-recipes.ts`, `scripts/*.ts`, `src/app/products/page.tsx`) still have pending TypeScript errors that belong to subsequent milestones (e.g., M5 for UI).

## 4. Conclusion
Milestone 4 (POS Variant-Aware Inventory Depletion) is complete. `src/app/api/orders/route.ts` strictly enforces variant recipe lookups, decrements variant stock and raw materials during checkout with `RawMaterialLog` (`type: "pemakaian"`), persists `variantId` in `OrderItem`, and flawlessly restores both product/variant stocks and raw materials upon order void or deletion (`type: "koreksi"`).

## 5. Verification Method
1. Verify TypeScript compilation on `src/app/api/orders/route.ts`:
   ```powershell
   npx tsc --noEmit
   ```
   Assert 0 errors originating from `src/app/api/orders/route.ts`.
2. Run the POS depletion test suite:
   ```powershell
   npx tsx scripts/tests/pos_depletion_suite.ts
   ```
   Assert all 10 tests pass with exit code 0.
3. Run the Master E2E test suite:
   ```powershell
   npx tsx scripts/tests/e2e_variant_recipe_suite.ts
   ```
   Assert all 45 tests pass with exit code 0.
