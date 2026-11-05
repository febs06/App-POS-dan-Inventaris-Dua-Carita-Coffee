# BRIEFING — 2026-11-05T15:51:00Z

## Mission
Milestone 2: Strict Variant Recipe Modeling & Migration.
Migrate `ProductIngredient` from `Product` to `ProductVariant`, seed realistic recipes with beverage ingredients and packaging for all 28 variants (7 products x 4 variants), calculate and update HPP costs, eliminate destructive deleteMany in `PUT /api/products`, and update `GET /api/products`.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\worker_m2_model_migration\
- Original parent: 8f2746ea-eb69-45ac-a514-91165c0b1d02
- Milestone: Milestone 2 (Strict Variant Recipe Modeling & Migration)

## 🔒 Key Constraints
- Exclusively own: `prisma/schema.prisma`, `scripts/migrate_variant_recipes.ts`, `src/app/api/products/route.ts`. Do not modify other files outside ownership.
- Zero data loss or recipe corruption during migration.
- Replace productId with variantId on ProductIngredient with `variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)`.
- Unique constraint `@@unique([variantId, rawMaterialId])`.
- Remove `ingredients` relation from `Product`.
- Update `ProductVariant.cost` to match sum of ingredient costs.
- Safe upsert/diff in `PUT /api/products` (eliminate destructive deleteMany).
- Include `variants: { include: { ingredients: { include: { rawMaterial: true } } } }` in `GET /api/products`.
- TypeScript verification with `npx tsc --noEmit`.
- No hardcoded test results or mock shortcuts.

## Current Parent
- Conversation ID: 8f2746ea-eb69-45ac-a514-91165c0b1d02
- Updated: 2026-11-05T15:50:26Z

## Task Summary
- **What to build**: Migration of schema, recipe migration script, and safe product API route refactor.
- **Success criteria**:
  - `prisma/schema.prisma` updated and pushed via `npx prisma db push` and `npx prisma generate`.
  - All 28 product variants have complete recipes with raw materials & packaging.
  - Variant costs correctly updated based on recipe HPP.
  - `PUT /api/products` preserves existing variant IDs and recipes.
  - `GET /api/products` returns recipes nested under variants.
  - Type safety confirmed for modified files.
- **Interface contracts**: `PROJECT.md`

## Key Decisions Made
- Added `variantId` column and seeded 220 ingredient records across all 28 product variants before applying strict NOT NULL schema constraints, preventing data loss.
- Calculated exact variant HPP based on $\sum (\text{amount} \times \text{costPerUnit})$ for both beverage ingredients and packaging (cup 12 Oz, lid, botol 250 ML, botol 1L, and specific stickers).
- Refactored `PUT /api/products` to match variants by ID or `(packaging, size)` to update properties without deleting variant records or wiping cascade relations.
- Enriched `GET /api/products` with per-variant `calculatedHpp`, `isAvailableByIngredients`, `missingIngredients`, and `maxProducible`.

## Artifact Index
- `handoff.md` — Final handoff report for Milestone 2
- `scripts/migrate_variant_recipes.ts` — Recipe migration & verification script

## Change Tracker
- **Files modified**:
  - `prisma/schema.prisma`: Replaced `productId` on `ProductIngredient` with `variantId`, added `ingredients` relation to `ProductVariant`, removed `ingredients` from `Product`.
  - `src/app/api/products/route.ts`: Removed `ingredients` from `Product` query in `GET`, nested `ingredients` under `variants`, enriched variant availability, replaced destructive `deleteMany` in `PUT` with safe upsert.
  - `scripts/migrate_variant_recipes.ts`: Full recipe migration and verification script for 28 variants.
- **Build status**: Pass for modified files (`src/app/api/products/route.ts` and `scripts/migrate_variant_recipes.ts`)
- **Pending issues**: Upstream files `src/app/api/orders/route.ts` (assigned to Milestone 4) and old seed scripts still reference legacy `productId`/`product.ingredients`.

## Quality Status
- **Build/test result**: Pass (all 28 variants verified with recipes and exact HPP)
- **Lint status**: Clean
- **Tests added/modified**: Integrated verification suite in `scripts/migrate_variant_recipes.ts`
