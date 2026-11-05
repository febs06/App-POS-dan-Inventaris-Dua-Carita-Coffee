## 2026-11-05T15:35:05Z

Read ORIGINAL_REQUEST.md at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\ORIGINAL_REQUEST.md.
Read PROJECT.md at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\PROJECT.md.
Read Schema Survey Handoff at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\explorer_survey_schema\handoff.md.
Read Backend Survey Handoff at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\explorer_survey_backend\handoff.md.
Your working directory is c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\worker_m2_model_migration\.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File write ownership:
You exclusively own:
- `prisma/schema.prisma`
- `scripts/migrate_variant_recipes.ts`
- `src/app/api/products/route.ts`

Mission for Milestone 2 (Strict Variant Recipe Modeling & Migration):
1. Update `prisma/schema.prisma`:
   - Change `ProductIngredient` model:
     - Replace `productId String` with `variantId String`
     - Replace `product Product @relation(...)` with `variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)`
     - Update constraint to `@@unique([variantId, rawMaterialId])`
     - Completely remove `ingredients` relation from `model Product` (no product-level recipe fallback)
   - Add `ingredients ProductIngredient[]` to `model ProductVariant`.
2. Push schema to PostgreSQL database using `npx prisma db push` (and run `npx prisma generate`).
   NOTE: To avoid dropping data or failing constraints, write and execute `scripts/migrate_variant_recipes.ts`:
   - You can migrate existing 40 ingredients into the corresponding `Cup Reguler` variants.
   - For all 7 products and their 4 variants (`Cup Reguler`, `Cup Large`, `Botol 250 ML`, `Botol 1.000 ML`), seed complete, realistic recipes using beverage ingredients and actual packaging items (Cup Injection 12 Oz, Tutup Cup Injection, Botol Kale 250 ML, Botol Kale 1L, Stiker 250 ML, Stiker 1L) using the specs in `scripts/update_hpp_and_packaging.ts`.
   - Calculate each variant's HPP from its ingredients ($\sum \text{amount} \times \text{costPerUnit}$) and update `ProductVariant.cost`.
3. Refactor `src/app/api/products/route.ts`:
   - In `PUT /api/products`: Eliminate destructive `prisma.productVariant.deleteMany({ where: { productId: id } })`. Replace with safe upsert/diff logic by variant ID or (packaging, size) so that updating a product's name, price, or category does NOT delete variants or wipe out their recipes.
   - In `GET /api/products`: Update includes to fetch `variants: { include: { ingredients: { include: { rawMaterial: true } } } }`. Remove `ingredients` from `product` query.
4. Verify:
   - Run `npx tsc --noEmit` and confirm type safety.
   - Verify that all 28 variants in Neon have recipes attached.
   - Verify that editing a product does not delete variant recipes.
5. Write your handoff report to `c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\worker_m2_model_migration\handoff.md` and send a message when done.


## 2026-11-05T15:50:26Z
**Context**: Milestone 2 Progress Status Query
**Content**: `prisma/schema.prisma` has been successfully updated with `variantId` and `ingredients` relation on `ProductVariant`. What is your current progress on running `scripts/migrate_variant_recipes.ts`, refactoring `src/app/api/products/route.ts` (safe upsert), and writing `handoff.md`?
**Action**: Please report status and update `progress.md`.
