# Project: Dua Carita Coffee — Strict Per-Variant Recipe & Inventory System

## Architecture
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Database & ORM**: PostgreSQL on Neon (`shiny-bird-53036663`), Prisma ORM
- **Data Flow**:
  1. `ProductVariant` strictly owns `ProductIngredient[]` (no direct link from `Product` to recipe).
  2. `RawMaterial` contains beverage ingredients (milk, espresso, syrups) and physical packaging (cups, lids, bottles, stickers).
  3. Variant HPP is calculated deterministically as $\sum (\text{amount} \times \text{rawMaterial.costPerUnit})$ and synced to `ProductVariant.cost`.
  4. Variant stock readiness (`isAvailableByIngredients`, `maxProducible`, `missingIngredients`) is computed per variant based on ingredient stocks.
  5. POS Orders (`/api/orders`) resolve recipes strictly from `item.variant.ingredients`, depleting specific materials (e.g. 1L bottle + 1L sticker + scaled beverage liquids) and decrementing both product and variant stocks.
  6. Admin / POS UI (`src/app/products/page.tsx`, `PosProductModal.tsx`) provides an interactive per-variant recipe manager and variant readiness indicators.

## Feature Inventory
Every feature from user requirements (R1–R5) mapped to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Database Safety & Backup | Create Neon branch snapshot + full 21-table offline JSON backup before schema changes | M1 | R1 |
| 2 | Variant-Specific Recipe Schema | Update Prisma schema so `ProductIngredient` references `ProductVariant` via `variantId` (strict, no fallback) | M2 | R2 |
| 3 | Recipe Data Migration & Seeding | Migrate existing cup recipes and seed distinct recipes for all 28 variants (Cup Reg, Cup Large, Botol 250ml, Botol 1L) | M2 | R2 |
| 4 | Safe Product Upsert Logic | Replace destructive `productVariant.deleteMany` in `PUT /api/products` with non-destructive upsert to protect variant recipes | M2 | R2 |
| 5 | Accurate HPP Calculation Engine | Compute HPP per variant from ingredients + packaging cost, update `ProductVariant.cost`, support live recalculation | M3 | R3 |
| 6 | Variant Stock Readiness Engine | Compute `isAvailableByIngredients`, `missingIngredients`, `maxProducible` per variant in `GET /api/products` | M3 | R4 |
| 7 | Variant-Aware POS Depletion | In `POST /api/orders`, deplete raw materials strictly from variant recipes and decrement `product.stock` + `variant.stock` | M4 | R4 |
| 8 | Order Void/Delete Stock Restoration | In `PUT /api/orders` (void) and `DELETE /api/orders`, restore variant materials and stock accurately | M4 | R4 |
| 9 | Admin Recipe UI per Variant | Interactive variant tab switcher in `src/app/products/page.tsx` with ingredient management, copy recipe, and HPP sync | M5 | R5 |
| 10 | POS Variant Readiness Indicators | Display real-time availability and max producible badges on variant buttons in `PosProductModal.tsx` and catalog cards | M5 | R5 |
| 11 | Pre-Order Variant Selection | Add variant selection to `src/app/po/page.tsx` so PO items cleanly associate with variant recipes | M5 | R5 |
| 12 | Automated Verification & Testing Suite | Automated test suite (Tiers 1-4 + Tier 5 coverage) verifying 100% test pass, schema integrity, HPP, depletion, and UI build | M6 | Acceptance Criteria |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Safety & Backup | Create Neon point-in-time branch backup and execute 21-table programmatic JSON backup script | none | DONE |
| M2 | Strict Variant Recipe Modeling & Migration | Update `prisma/schema.prisma` (`ProductVariant` 1-N `ProductIngredient`), run `db push`, migrate & seed recipes for all 28 variants, fix `PUT /api/products` upsert | M1 | DONE |
| M3 | Variant HPP & Stock Readiness Engine | Implement per-variant HPP calculation and stock readiness calculations in `src/app/api/products/route.ts` and core utilities | M2 | DONE |
| M4 | POS Variant-Aware Inventory Depletion | Update `src/app/api/orders/route.ts` (checkout, void, delete) to strictly deplete/restore variant ingredients and stocks | M3 | DONE |
| M5 | Full-Stack Recipe Management UI | Update `src/app/products/page.tsx` (variant tabs BOM), `PosProductModal.tsx` (readiness badges), and `src/app/po/page.tsx` | M3, M4 | DONE |
| M6 | Automated E2E Verification & Audit | Execute automated integration tests across all tiers, run `npx tsc --noEmit` and `npm run build`, and complete Forensic Integrity Audit | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts

### ProductVariant ↔ ProductIngredient
- `ProductVariant.id` (`String cuid`) is foreign key `variantId` in `ProductIngredient`.
- Constraint: `@@unique([variantId, rawMaterialId])`.
- Zero reference to `productId` in `ProductIngredient`.

### `GET /api/products` Response Contract
Each variant in `product.variants` includes:
```ts
{
  id: string;
  productId: string;
  packaging: string; // "Cup" | "Botol"
  size: string; // "Reguler" | "Large" | "250 ML" | "1.000 ML"
  price: number;
  cost: number; // Stored HPP
  stock: number;
  isActive: boolean;
  ingredients: {
    id: string;
    variantId: string;
    rawMaterialId: string;
    amount: number;
    rawMaterial: RawMaterial;
  }[];
  calculatedHpp: number; // Dynamically computed from ingredients
  isAvailableByIngredients: boolean;
  missingIngredients: string[];
  maxProducible: number | null;
}
```

### `POST /api/orders` Request & Depletion Contract
- `items`: `Array<{ productId: string; variantId: string; price: number; qty: number }>`
- Backend resolves `variantId` -> `variant.ingredients`.
- Required raw materials = $\sum (\text{ing.amount} \times \text{item.qty})$.
- Stock deductions:
  - `RawMaterial.stock` decremented by required amounts.
  - `Product.stock` decremented by `qty`.
  - `ProductVariant.stock` decremented by `qty`.

## Code Layout
- `prisma/schema.prisma`: Data models (`ProductVariant`, `ProductIngredient`, `RawMaterial`, `Product`)
- `src/app/api/products/route.ts`: Products & Variants CRUD, per-variant HPP & readiness logic
- `src/app/api/orders/route.ts`: Order creation, variant ingredient depletion, order void/delete rollback
- `src/app/api/analytics/route.ts`: Financial analytics using variant costs
- `src/app/products/page.tsx`: Admin product catalog and variant recipe BOM editor
- `src/components/PosProductModal.tsx`: POS cashier variant selector with live readiness indicators
- `src/app/pos/page.tsx`: POS catalog grid and checkout dispatch
- `src/app/po/page.tsx`: Pre-order management with variant support
- `scripts/`: Backup scripts, migration scripts, and automated verification test harnesses
- `backups/`: Database snapshot JSON files
