# BRIEFING — 2026-11-05T15:20:00Z

## Mission
Investigate and map all backend services, server actions, route handlers, and API endpoints related to products, recipes, HPP/COGS calculations, POS checkout, inventory depletion, and stock readiness, and pinpoint required changes for strict per-variant recipes.

## 🔒 My Identity
- Archetype: explorer
- Roles: Teamwork explorer
- Working directory: c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\explorer_survey_backend
- Original parent: 8f2746ea-eb69-45ac-a514-91165c0b1d02
- Milestone: M1 Architecture & Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Produce 5-component handoff report at c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\explorer_survey_backend\handoff.md
- Send message to parent 8f2746ea-eb69-45ac-a514-91165c0b1d02 when done

## Current Parent
- Conversation ID: 8f2746ea-eb69-45ac-a514-91165c0b1d02
- Updated: not yet

## Investigation State
- **Explored paths**: `prisma/schema.prisma`, `src/app/api/products/route.ts`, `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/pay/route.ts`, `src/app/api/raw-materials/route.ts`, `src/app/api/raw-materials/mutate/route.ts`, `src/app/api/stock/route.ts`, `src/app/api/analytics/route.ts`, `src/app/products/page.tsx`, `src/app/pos/page.tsx`, `src/components/PosProductModal.tsx`, `scripts/update_hpp_and_packaging.ts`, `prisma/seed-recipes.ts`, Neon PostgreSQL live database schema and tables.
- **Key findings**:
  1. HPP calculation: `ProductVariant.cost` is currently an unvalidated static float populated with heuristic multipliers (`* 1.3`, `* 1.2`, `25000`) or manual input; `ProductIngredient` is strictly bound to `Product` (`productId`), so packaging costs are hardcoded to Cup 12 Oz for all sizes.
  2. Inventory depletion: `POST /api/orders` (lines 264-389) iterates `item.product.ingredients` ignoring `item.variantId`, thus depleting Cup 12 Oz ingredients/packaging even for 250ml/1000ml bottles, and decrements `product.stock` without decrementing `variant.stock`.
  3. Stock readiness: `GET /api/products` (lines 42-74) computes `maxProducible` and `isAvailableByIngredients` strictly per `Product` using `p.ingredients`, completely unaware of variant-specific ingredient/packaging constraints.
  4. Destructive update risk: `PUT /api/products` executes `productVariant.deleteMany({ where: { productId: id } })`, which will cascade-delete all variant recipes and break `OrderItem` FKs unless changed to upsert.
- **Unexplored areas**: None, full survey complete.

## Key Decisions Made
- Focus specifically on backend data flow, functions, calculations, and exact file paths/lines.
- Document exact code changes across `schema.prisma`, `src/app/api/products/route.ts`, `src/app/api/orders/route.ts`, and frontend consumers.

## Artifact Index
- DISPATCH.md — record of incoming dispatch
- BRIEFING.md — situational awareness
- progress.md — liveness heartbeat
- handoff.md — comprehensive 5-component report

