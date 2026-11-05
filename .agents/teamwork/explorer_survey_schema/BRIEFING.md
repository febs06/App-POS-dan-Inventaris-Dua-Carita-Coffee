# BRIEFING — 2026-11-05T15:28:30Z

## Mission
Survey the database schema, Prisma files, models, seeds, migrations, backup strategies, and recipe associations to prepare the migration path to strict ProductVariant-bound recipes.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, schema surveyor
- Working directory: c:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po\.agents\teamwork\explorer_survey_schema\
- Original parent: 8f2746ea-eb69-45ac-a514-91165c0b1d02
- Milestone: milestone-1-investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Analyze database schema, Prisma schema files, and models
- Check how database backup and restore is or can be handled in this environment
- Identify all migration history and database seed scripts
- Write comprehensive handoff.md and send message back to parent

## Current Parent
- Conversation ID: 8f2746ea-eb69-45ac-a514-91165c0b1d02
- Updated: 2026-11-05T15:27:43Z

## Investigation State
- **Explored paths**:
  - `prisma/schema.prisma`
  - `.env` (Neon PostgreSQL provider on AWS ap-southeast-1, pooler and unpooled connections)
  - Neon MCP integration (`list_projects`, `list_branches` verified, project `shiny-bird-53036663`, branch `production`)
  - `prisma/seed.ts`, `prisma/seed-new.ts`, `prisma/seed-recipes.ts`
  - `scripts/*` (13 scripts: `seed_bottle_and_caffe_latte.ts`, `seed_cup_menu_and_materials.ts`, `update_hpp_and_packaging.ts`, `import_to_neon.ts`, etc.)
  - Database verification scripts (`check_db.ts`, `check_migrations.ts`, `inspect_products.ts`, `inspect_orders.ts`, `inspect_ingredients.ts`)
- **Key findings**:
  1. Live DB is Neon PostgreSQL, not SQLite. `prisma/dev.db` is an obsolete artifact.
  2. No `_prisma_migrations` or `prisma/migrations` folder exists; project relies on `prisma db push`.
  3. `ProductVariant` was added in commit `c39438a` (Nov 4) with 28 variant rows (4 per product: Cup Reguler, Cup Large, Botol 250 ML, Botol 1.000 ML).
  4. Recipes (`ProductIngredient`) currently point ONLY to `productId`, binding all variants to one recipe. Currently 40 ingredient records exist, all configured for 12 Oz Cup.
  5. Packaging is stored in `RawMaterial` (e.g. Cup Injection 12 Oz, Tutup Cup Injection, Botol Kale 250 ML, Botol Kale 1L, Stiker 250 ML, Stiker 1 L).
  6. Past orders (114 order items) have `variantId: null` because they were created before variants existed.
  7. Neon MCP provides instant copy-on-write branching for zero-downtime database backup (`create_branch`), complemented by programmatic JSON snapshotting.
- **Unexplored areas**: None. Schema mapping and migration path fully determined.

## Key Decisions Made
- Confirmed migration path: decouple `ProductIngredient` from `Product` and bind strictly to `ProductVariant` via `variantId String`.
- Backup strategy: 2-layer safety (Neon branch via MCP + local JSON file snapshot of all 21 tables).

## Artifact Index
- DISPATCH.md — Initial and intermediate dispatch instructions
- BRIEFING.md — Working memory
- progress.md — Liveness heartbeat
- check_db.ts — DB table & row count inspector
- check_migrations.ts — Migration history & public tables query
- inspect_products.ts — Detailed product, variant, and ingredient inspector
- inspect_orders.ts — OrderItem variantId inspector
- inspect_ingredients.ts — Detailed ProductIngredient records inspector
- handoff.md — Final 5-component handoff report
