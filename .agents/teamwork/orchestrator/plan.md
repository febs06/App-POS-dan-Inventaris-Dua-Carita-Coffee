# Execution Plan — Strict Per-Variant Recipe System

## 1. Survey Phase
- Explorer 1 (Data & Schema): Investigate current Prisma/database schema, migrations, `Product`, `ProductVariant`, `ProductIngredient`, `Ingredient`, unit costs, and existing data relationships.
- Explorer 2 (Backend & POS Engine): Investigate HPP/COGS calculations, transaction processing (`orders`, `sales`, POS cart), inventory depletion logic, stock readiness / portion calculations, and existing APIs.
- Explorer 3 (Frontend & Recipe UI): Investigate Admin/POS UI for recipe management, variant selection, ingredient picker, cost preview, and component architecture.

## 2. Global Architecture Document (PROJECT.md)
- Consolidate explorer findings.
- Define Feature Inventory, Module Boundaries, Interface Contracts, and Milestone Decomposition.

## 3. Milestones (Dual Track Execution)
- **M1: Database Safety & Backup**: Full backup of schema and data prior to modifications.
- **M2: Variant-Specific Recipe Modeling (Strict per Variant)**: Update schema so recipes are bound to `ProductVariant` (not `Product`), migrate existing recipes cleanly without fallback.
- **M3: Accurate HPP & Stock Readiness Calculation Engine**: Compute HPP per variant from ingredients + packaging, calculate portion readiness per variant.
- **M4: Variant-Aware POS Inventory Depletion**: POS transactions deduct raw materials and packaging per variant recipe; validate stock deduction accuracy across multiple variants.
- **M5: Full-Stack Recipe Management UI**: Admin/POS UI to manage ingredients, packaging, and amounts per variant.
- **M6 / Dual Track E2E Verification**: Comprehensive test suite (Tiers 1-4 + Tier 5 coverage) verifying 100% test pass, no regressions, and forensic audit cleanliness.
