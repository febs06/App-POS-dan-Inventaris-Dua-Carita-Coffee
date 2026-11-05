## 2026-11-05T15:52:45Z
Read ORIGINAL_REQUEST.md at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\ORIGINAL_REQUEST.md.
Read PROJECT.md at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\PROJECT.md.
Read TEST_INFRA.md at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\TEST_INFRA.md.
Your working directory is c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\worker_m4_pos_orders\.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File write ownership:
You exclusively own:
- `src/app/api/orders/route.ts`

Mission for Milestone 4 (POS Variant-Aware Inventory Depletion):
Update `src/app/api/orders/route.ts` across order creation, order void, and order hard delete:
1. `POST /api/orders`:
   - Note: `product.ingredients` has been removed from `prisma/schema.prisma` in M2. Lookups MUST use `ProductVariant.ingredients`.
   - Query variants with `include: { ingredients: { include: { rawMaterial: true } } }`.
   - If `item.variantId` is missing, find the default active variant for that product (e.g. `packaging: "Cup", size: "Reguler"`) or throw a clear 400 error.
   - Aggregate `requiredMaterialsMap` strictly from `variant.ingredients`.
   - Check raw material availability against required quantities before transaction.
   - In transaction:
     - Decrement `rawMaterial.stock` for each required material and log in `RawMaterialLog` (`type: "pemakaian"`).
     - Decrement `product.stock` by `item.qty`.
     - Decrement `productVariant.stock` by `item.qty`.
     - Save `variantId` in `orderItem.create`.
2. `PUT /api/orders` (void):
   - Include `variant: { include: { ingredients: { include: { rawMaterial: true } } } }` when fetching items of the order being voided.
   - Restore raw materials from `variant.ingredients` with `RawMaterialLog` (`type: "koreksi"`).
   - Increment `product.stock` and `productVariant.stock`.
   - Safely handle legacy orders where `variantId = null` (do not crash).
3. `DELETE /api/orders`:
   - Same restoration logic as void.
4. Verify:
   - Run `npx tsc --noEmit` and confirm 0 errors on `src/app/api/orders/route.ts`.
   - Run `npx tsx scripts/tests/pos_depletion_suite.ts` and confirm passing assertions.
5. Write handoff report to `c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\agents\teamwork\worker_m4_pos_orders\handoff.md` and send message when done.
