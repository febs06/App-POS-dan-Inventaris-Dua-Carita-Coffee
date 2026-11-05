# TEST_INFRA.md — Dual-Track E2E Testing Infrastructure

## 1. Executive Summary & Testing Philosophy

This document defines the automated End-to-End (E2E) testing infrastructure for the **Dua Carita Coffee POS & Inventory System** refactor (Strict Per-Variant Recipe Modeling & Inventory System).

### 1.1 Dual-Track Strategy
Under the Dual-Track development pattern:
- **Implementation Track**: Progressively executes M1 (Database Safety & Backup), M2 (Strict Variant Recipe Schema & Migration), M3 (HPP & Readiness Engine), M4 (Variant-Aware POS Depletion), and M5 (Full-Stack Management UI).
- **Testing Track (Infrastructure)**: Concurrently establishes authoritative specification contracts, test runners, boundary assertions, and E2E verification suites in `scripts/tests/`. The test track guarantees that all 12 inventoried features meet strict acceptance criteria without cheating, facade tests, or tautological assertions.

### 1.2 Opaque-Box, Requirement-Driven Principles
1. **Opaque-Box Testing**: Tests interact with system boundaries (Prisma data layer, REST API endpoints `/api/products` and `/api/orders`, and core calculation engines). Tests assert against observable business behaviors, HTTP responses, and database state invariants rather than implementation internals.
2. **Authoritative Expected Output Derivation**:
   - **Variant Recipe Isolation**: Every packaging/size variant must strictly own its distinct recipe (`ProductIngredient` bound to `ProductVariant`). A Cup variant must include cup packaging (`Cup Injection 12 Oz` + `Tutup Cup Injection`); a Bottle variant must include bottle packaging (`Botol 250 ML` / `Botol 1000 ML`) and specific labels (`Stiker 250 ML` / `Stiker 1000 ML`). Under no circumstances may a bottle order deplete cup stocks.
   - **Deterministic HPP Calculation**:
     $$\text{HPP}_{\text{variant}} = \sum_{i=1}^{n} \left( \text{amount}_i \times \text{rawMaterial}_i.\text{costPerUnit} \right)$$
     Derivations are cross-checked against official Dua Carita Coffee formulations in `scripts/update_hpp_and_packaging.ts`.
   - **Variant-Aware Inventory Depletion**:
     $$\Delta \text{RawMaterial}_{\text{stock}} = - \sum_{\text{item}} \left( \text{item.qty} \times \text{variantIngredient.amount} \right)$$
     $$\Delta \text{Product}_{\text{stock}} = - \text{item.qty}, \quad \Delta \text{ProductVariant}_{\text{stock}} = - \text{item.qty}$$
   - **Void / Delete Conservation Law**:
     $$\Delta \text{Stock}_{\text{checkout}} + \Delta \text{Stock}_{\text{void}} = 0$$
     Voiding or deleting an order must restore exact material quantities and product/variant stocks with zero leakage.
3. **Progressive Testability & Zero-Cheat Guarantee**:
   - All tests use genuine, un-mocked data schemas and verifiable logic.
   - Tests dynamically introspect schema capabilities to allow execution across milestone phases while strictly asserting completion criteria for the target state.

---

## 2. Comprehensive 4-Tier Test Architecture

Derived from the 12-feature inventory in `PROJECT.md`:

```
+-----------------------------------------------------------------------------------------+
|                                4-TIER TEST ARCHITECTURE                                  |
+-----------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage (60 Test Cases across 12 Inventoried Features)                |
|    - F01: Safety & Backup            - F07: Variant-Aware POS Depletion                 |
|    - F02: Variant Recipe Schema      - F08: Order Void / Delete Restoration              |
|    - F03: Recipe Migration & Seeding - F09: Admin Recipe UI per Variant                 |
|    - F04: Safe Product Upsert Logic  - F10: POS Variant Readiness Badges                |
|    - F05: Accurate HPP Engine        - F11: Pre-Order Variant Selection                 |
|    - F06: Stock Readiness Engine     - F12: Automated Verification Suite                |
+-----------------------------------------------------------------------------------------+
|  Tier 2: Boundary & Corner Cases (10 Test Cases)                                        |
|    - Zero/empty recipes, 0-cost materials, fractional units, negative stock prevention, |
|      extreme quantities (500+ items), bottle vs cup isolation invariants.              |
+-----------------------------------------------------------------------------------------+
|  Tier 3: Cross-Feature Combinations (8 Test Cases)                                      |
|    - Mixed-variant orders (Cup + Bottle), partial item voids, rapid sequential orders,  |
|      shared-ingredient depletion (milk across coffee & matcha), cost update cascade.    |
+-----------------------------------------------------------------------------------------+
|  Tier 4: Real-World Production Scenarios (4 End-to-End Scenarios)                       |
|    - Scenario 1: Peak Morning Rush (10 concurrent variant orders)                       |
|    - Scenario 2: Barista Morning Inventory Audit & Bottleneck Inspection                |
|    - Scenario 3: Large Catering / Event Pre-Order Allocation                            |
|    - Scenario 4: Customer Order Cancellation & Packaging Variant Swap                   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Tier 1: Feature Coverage Specifications (>=5 Test Cases per Feature)

### Feature 1: Database Safety & Backup (M1)
- **TC-F01-01 (Neon Point-in-Time Branch Existence)**: Assert that a dedicated backup branch (e.g. `backup-pre-variant-recipe-20261105`) exists in Neon project `shiny-bird-53036663` branched from parent `production`.
- **TC-F01-02 (21-Table Programmatic Backup)**: Verify `scripts/backup_database.ts` exports all 21 public tables into JSON format under `backups/`.
- **TC-F01-03 (Backup Non-Empty Row Counts)**: Assert primary tables (`Product`, `ProductVariant`, `ProductIngredient`, `RawMaterial`, `Order`, `OrderItem`) have non-zero row counts in the generated backup file.
- **TC-F01-04 (JSON Integrity & Parseability)**: Read and parse the backup JSON file, verifying syntax validity, correct schema versioning metadata, and non-corrupted timestamp fields.
- **TC-F01-05 (Air-Gapped Backup Restoration Safety)**: Assert that backup JSON contains sufficient relational primary and foreign keys to reconstruct state offline if cloud connectivity fails.

### Feature 2: Variant-Specific Recipe Schema (M2)
- **TC-F02-01 (VariantId Foreign Key Binding)**: Assert `ProductIngredient` model in `prisma/schema.prisma` contains `variantId String` referencing `ProductVariant(id)` with `onDelete: Cascade`.
- **TC-F02-02 (Zero ProductId Leakage)**: Assert `ProductIngredient` model contains NO `productId` column or relation, eliminating any fallback to product level.
- **TC-F02-03 (Unique Compound Constraint)**: Assert `ProductIngredient` contains `@@unique([variantId, rawMaterialId])`, preventing duplicate ingredients in the same variant recipe.
- **TC-F02-04 (ProductVariant Recipe Relation)**: Assert `ProductVariant` model defines `ingredients ProductIngredient[]` navigation property.
- **TC-F02-05 (Prisma Client Generation)**: Assert `npx prisma generate` succeeds and generates TypeScript types exposing `ProductVariant.ingredients`.

### Feature 3: Recipe Data Migration & Seeding (M2)
- **TC-F03-01 (Complete Variant Coverage)**: Assert all 28 product variants in the database (4 variants for each of the 7 products) have at least 1 `ProductIngredient` row assigned.
- **TC-F03-02 (Cup Reguler Packaging Specification)**: Assert every `Cup Reguler` variant includes `Cup Injection 12 Oz` (amount = 1) and `Tutup Cup Injection` (amount = 1).
- **TC-F03-03 (Cup Large Recipe Scaling)**: Assert every `Cup Large` variant includes cup packaging and scaled beverage ingredients (~1.3x liquid volume of Reguler).
- **TC-F03-04 (Botol 250 ML Recipe Specification)**: Assert every `Botol 250 ML` variant includes `Botol 250 ML` (amount = 1) and `Stiker 250 ML` (amount = 1) and excludes cup packaging.
- **TC-F03-05 (Botol 1.000 ML Recipe Specification)**: Assert every `Botol 1.000 ML` variant includes `Botol 1000 ML` (amount = 1), `Stiker 1000 ML` (amount = 1), and 4x scaled coffee/milk ingredients (e.g. 40g Robusta, 240ml UHT).

### Feature 4: Safe Product Upsert Logic (M2)
- **TC-F04-01 (Variant ID Preservation on Product Update)**: Execute `PUT /api/products` updating product name or category; assert existing `ProductVariant.id` values are preserved (no destructive `deleteMany`).
- **TC-F04-02 (Recipe Survival on Price Update)**: Update variant prices via `PUT /api/products`; assert all `ProductIngredient` rows tied to that variant remain intact.
- **TC-F04-03 (Additive Variant Addition)**: Add a 5th variant to a product; assert existing 4 variants and their recipes remain unmodified.
- **TC-F04-04 (Soft Deactivation Safety)**: Update variant `isActive = false`; assert recipes are not deleted from the database.
- **TC-F04-05 (Transactional Atomicity)**: Send an invalid variant payload (e.g. negative price); assert the transaction aborts and leaves existing variants and recipes unchanged.

### Feature 5: Accurate HPP Calculation Engine (M3)
- **TC-F05-01 (Mathematical Recipe Summation)**: For any variant, calculate $\sum (\text{ing.amount} \times \text{rawMaterial.costPerUnit})$ and assert it matches `calculatedHpp` with tolerance $< 0.01$.
- **TC-F05-02 (Aren Coffee Milk Benchmark Validation)**:
  - Cup Reguler (12 Oz): expected HPP $\approx 5,832.18 \pm 1.00$.
  - Botol 250 ML: expected HPP $\approx 7,185.82 \pm 1.00$.
  - Botol 1.000 ML: expected HPP $\approx 26,092.48 \pm 1.00$.
- **TC-F05-03 (Raw Material Cost Propagation)**: Update a raw material `costPerUnit` (e.g. Robusta beans from 159 to 200); assert that `calculatedHpp` for all variants containing that material immediately increases by $\Delta \text{cost} \times \text{amount}$.
- **TC-F05-04 (Packaging Cost Fluctuation)**: Update `Botol 1000 ML` cost from 2,800 to 3,000; assert only 1.000 ML bottle variants change in HPP (+200), while Cup and 250 ML variants remain completely unchanged.
- **TC-F05-05 (Persisted Variant Cost Synchronization)**: When variant recipe or material costs are saved, assert `ProductVariant.cost` is updated in the database to match `calculatedHpp`.

### Feature 6: Variant Stock Readiness Engine (M3)
- **TC-F06-01 (Bottleneck Producible Computation)**: Given ingredient stock vector $[S_1, S_2, \dots]$ and recipe amounts $[A_1, A_2, \dots]$, assert `maxProducible` equals $\min(\lfloor S_i / A_i \rfloor)$.
- **TC-F06-02 (Independent Bottle Depletion Availability)**: When `Botol 1000 ML` stock is set to 0 while all other materials have stock $> 1000$, assert:
  - `Botol 1.000 ML.isAvailableByIngredients = false` and `missingIngredients` includes "Botol 1000 ML".
  - `Cup Reguler.isAvailableByIngredients = true`.
  - `Botol 250 ML.isAvailableByIngredients = true`.
- **TC-F06-03 (Beverage Core Material Depletion)**: When `Kopi Robusta` stock is set to 5g (less than the 10g required for a cup):
  - All coffee variants (`Cup Reguler`, `Cup Large`, `Botol 250 ML`, `Botol 1.000 ML`) report `isAvailableByIngredients = false`.
  - Non-coffee variants (`Matcha Latte`) report `isAvailableByIngredients = true`.
- **TC-F06-04 (Missing Ingredients Descriptive Strings)**: Assert `missingIngredients` array returns human-readable entries containing the raw material name, current stock, and required amount.
- **TC-F06-05 (Product-Level Variant Aggregation)**: In `GET /api/products`, assert each variant in `product.variants` includes `calculatedHpp`, `isAvailableByIngredients`, `missingIngredients`, and `maxProducible`.

### Feature 7: Variant-Aware POS Depletion (M4)
- **TC-F07-01 (Cup Reguler Checkout Isolation)**: Place order for 2 pcs `Aren Coffee Milk (Cup Reguler)`. Assert:
  - `Cup Injection 12 Oz` stock decrements by exactly 2.
  - `Tutup Cup Injection` stock decrements by exactly 2.
  - `Botol 250 ML` and `Botol 1000 ML` stocks decrement by exactly 0.
- **TC-F07-02 (Botol 1.000 ML Checkout Isolation)**: Place order for 1 pc `Aren Coffee Milk (Botol 1.000 ML)`. Assert:
  - `Botol 1000 ML` stock decrements by 1.
  - `Stiker 1000 ML` stock decrements by 1.
  - `Cup Injection 12 Oz` stock decrements by 0.
  - `Kopi Robusta` stock decrements by 40g (not the 10g single-cup amount).
- **TC-F07-03 (Dual Product & Variant Stock Decrement)**: During checkout, assert both `Product.stock` and `ProductVariant.stock` decrement by the ordered quantity.
- **TC-F07-04 (OrderItem Variant Foreign Key Persistence)**: Inspect created `OrderItem` records; assert `variantId` is NOT null and equals the purchased `ProductVariant.id`.
- **TC-F07-05 (Transaction Ledger / RawMaterialLog)**: Assert each depleted ingredient produces an associated `RawMaterialLog` entry with `type = "pemakaian"` and negative `changeQty`.

### Feature 8: Order Void/Delete Stock Restoration (M4)
- **TC-F08-01 (Order Void Material Restoration)**: Void an existing variant order via `PUT /api/orders` with `isVoided = true`. Assert all raw material stocks increment by exactly the amounts depleted during checkout.
- **TC-F08-02 (Order Void Product & Variant Stock Restoration)**: Assert `Product.stock` and `ProductVariant.stock` increment by the voided quantity.
- **TC-F08-03 (Hard Delete Restoration)**: Delete an order via `DELETE /api/orders`; assert exact recipe amounts and product/variant stocks are restored.
- **TC-F08-04 (Multi-Item Void Non-Interference)**: Void an order containing 1 Cup and 1 Bottle; assert the cup materials restore to cup inventory and bottle materials restore to bottle inventory without cross-misallocation.
- **TC-F08-05 (Historical Order Void Safety)**: Void a pre-migration order where `variantId = null`; assert the operation completes safely without server error and without corrupting raw material stocks.

### Feature 9: Admin Recipe UI per Variant (M5)
- **TC-F09-01 (Packaging & Size Tab Navigation)**: Assert Admin product editor renders interactive tabs for Cup Reguler, Cup Large, Botol 250 ML, and Botol 1.000 ML.
- **TC-F09-02 (Independent Variant Ingredient CRUD)**: Add a raw material to `Cup Large` tab; assert the material is added only to that variant's Bill of Materials (BOM).
- **TC-F09-03 (Recipe Cloning / Copy Functionality)**: Execute "Copy Recipe" from Cup Reguler to Cup Large with 1.3x multiplier; assert all ingredient amounts scale correctly.
- **TC-F09-04 (Ingredient Removal Isolation)**: Delete an ingredient from Botol 250 ML; assert the ingredient is removed only from Botol 250 ML.
- **TC-F09-05 (Real-Time UI HPP Recalculation)**: Change ingredient amount in UI; assert displayed variant HPP updates immediately in the modal summary.

### Feature 10: POS Variant Readiness Indicators (M5)
- **TC-F10-01 (Variant Modal Max Producible Badge)**: Open POS product modal; assert each variant button displays a badge showing its specific `maxProducible` count.
- **TC-F10-02 (Out of Stock Disabling)**: When a variant's limiting ingredient reaches 0, assert the variant selection button in POS is disabled with an "Out of Stock" indicator.
- **TC-F10-03 (Dynamic Badge Decrement on Cart Addition)**: Add an item to cart; assert POS modal dynamically reflects decremented availability.
- **TC-F10-04 (Catalog Card Overall Readiness)**: Assert product card in catalog grid displays unavailable only if ALL active variants are out of stock.
- **TC-F10-05 (Missing Ingredients Alert)**: Assert clicking or hovering on an unavailable variant displays the specific missing materials.

### Feature 11: Pre-Order Variant Selection (M5)
- **TC-F11-01 (PO Form Variant Dropdown)**: In `src/app/po/page.tsx`, assert item addition supports selecting packaging and size.
- **TC-F11-02 (PO Item Variant Persistence)**: Create a Pre-Order with 10x Botol 1.000 ML; assert `OrderItem.variantId` points to the 1.000 ML variant.
- **TC-F11-03 (PO Material Forecasting)**: Assert PO summary calculates total raw materials required (e.g. 10 bottles = 400g Robusta, 2.4L UHT, 10 bottles, 10 stickers).
- **TC-F11-04 (PO to Direct POS Fulfillment)**: Fulfill a PO; assert raw material stocks deplete according to the selected variant recipes.
- **TC-F11-05 (PO Item Quantity Modification)**: Edit PO quantity from 10 to 15; assert forecasted materials scale to 15x.

### Feature 12: Automated Verification & Testing Suite (M6)
- **TC-F12-01 (100% Test Suite Execution)**: Run `npx tsx scripts/tests/e2e_variant_recipe_suite.ts`; assert exit code 0 and 0 failing tests.
- **TC-F12-02 (Schema Zero Fallback Proof)**: Assert automated schema validator finds 0 references to `Product.ingredients` and 100% variant binding.
- **TC-F12-03 (Benchmark Margin Assertion)**: Assert for all variants, `variant.price > variant.calculatedHpp` (positive gross profit margin).
- **TC-F12-04 (Conservation of Stock Invariance)**: Automated test executes create order $\rightarrow$ void order, asserting net delta for all raw materials equals 0.
- **TC-F12-05 (TypeScript Compilation & Build Health)**: Run `npx tsc --noEmit`; assert 0 TypeScript compilation errors across the entire codebase.

---

## 4. Tier 2: Boundary & Corner Cases

- **TC-B01 (Zero-Ingredient Recipe)**: A newly created variant with 0 ingredients must report `calculatedHpp = 0`, `isAvailableByIngredients = true`, and `maxProducible = null` without division-by-zero crashes.
- **TC-B02 (Zero-Cost Raw Material)**: A raw material with `costPerUnit = 0` (e.g. tap water or promotional packaging) must compute without `NaN` or runtime errors.
- **TC-B03 (Floating-Point Precision Tolerance)**: Recipe amounts with high decimal precision (e.g. `Air Demineral` at 0.3125 / unit, `Matcha` at 4g) must not suffer from floating-point accumulation errors when multiplied by 100 units.
- **TC-B04 (Negative Stock Prevention)**: If `RawMaterial.stock` is insufficient and strict inventory enforcement is active, order creation must reject with status 400 and prevent stock from becoming negative.
- **TC-B05 (Bulk Order Quantities)**: An order with `qty = 500` must scale ingredient depletion correctly without integer overflow or timeout.
- **TC-B06 (Zero / Negative Order Quantity Validation)**: Request with `qty <= 0` in `/api/orders` must be rejected with HTTP 400.
- **TC-B07 (Bottle vs Cup Packaging Isolation Invariant)**: In any test sequence involving bottle checkouts, assert that `Cup Injection 12 Oz` and `Tutup Cup Injection` stocks change by exactly 0.
- **TC-B08 (Unicode / Special Characters in Order Notes)**: Items with custom notes containing emojis or symbols (`"extra gula aren 🌿 (bawa sedotan)"`) must persist and void without SQL or encoding errors.
- **TC-B09 (Duplicate Ingredient Prevention)**: Attempting to insert two rows with the same `(variantId, rawMaterialId)` must throw a unique constraint violation error.
- **TC-B10 (Deactivated Variant Ordering Block)**: Attempting to purchase a variant with `isActive = false` must fail with HTTP 400.

---

## 5. Tier 3: Cross-Feature Combinations

- **TC-C01 (Simultaneous Cup & Bottle Basket)**: Checkout a cart containing:
  - 2x Aren Coffee Milk (Cup Reguler)
  - 1x Aren Coffee Milk (Cup Large)
  - 3x Aren Coffee Milk (Botol 250 ML)
  - 1x Aren Coffee Milk (Botol 1.000 ML)
  Assert the exact cumulative consumption:
  - Cups: $2 + 1 = 3$ pcs
  - Botol 250 ML: $3$ pcs
  - Botol 1000 ML: $1$ pc
  - Coffee beans: $(2 \times 10) + (1 \times 13) + (3 \times 10) + (1 \times 40) = 103\text{g}$.
- **TC-C02 (Partial Void Invariant)**: Given an order with multiple items, void only one `OrderItem`; assert only that item's variant ingredients are restored, while the remaining items remain depleted.
- **TC-C03 (Restock $\rightarrow$ Live Readiness Re-computation)**: When a bottleneck raw material (e.g. `Botol 250 ML`) is restocked from 0 to 50 via `RawMaterialLog`, assert `/api/products` immediately shifts `isAvailableByIngredients` from `false` to `true` and updates `maxProducible` to 50.
- **TC-C04 (Supplier Cost Update $\rightarrow$ Variant HPP Recalculation)**: When supplier price changes update `RawMaterial.costPerUnit`, verify that `/api/products` calculates new variant HPP and `/api/analytics` reflects updated COGS margins.
- **TC-C05 (Cross-Product Shared Ingredient Depletion)**: Both `Aren Coffee Milk` and `Caffe Latte` use `Susu UHT`. Checkout 5 of each; assert `Susu UHT` stock depletes by $(5 \times 40) + (5 \times 40) = 400\text{ml}$.
- **TC-C06 (Exact Zero Boundary Availability Transition)**: Deplete a material until `stock == requiredAmount`; assert available. Deplete by 1 more unit (`stock < requiredAmount`); assert unavailable.
- **TC-C07 (Safe Product Upsert under Concurrent Recipe View)**: While product recipe is being edited, perform a product metadata update; verify variant recipes are preserved without race condition deletion.
- **TC-C08 (PO Fulfillment to POS Direct Conversion)**: Create a pre-order with variant specifications, fulfill it into an active event sale, and verify ingredient depletion matches variant recipe.

---

## 6. Tier 4: Real-World Production Scenarios

### Scenario 1: Peak Morning Rush (High-Volume POS Influx)
- **Description**: Simulates the opening rush at Dua Carita Coffee with 10 consecutive orders of mixed cup and bottle drinks processed within seconds.
- **Verification**:
  - All 10 orders complete successfully with unique order numbers.
  - Cumulative stock depletion across all 26 raw materials matches the exact sum of all 10 variant recipes.
  - Final product and variant stock counters match initial stock minus ordered quantities.

### Scenario 2: Barista Morning Inventory Audit
- **Description**: Barista logs in at opening, inspects POS variant modal, and checks readiness badges across all 28 menu variants.
- **Verification**:
  - Low stock warning triggered for items where limiting ingredient stock $< \text{minStock}$.
  - System identifies exact bottleneck ingredient (e.g. "Sisa Botol 250 ML: 5 pcs").
  - Barista can safely identify which variants can be sold before starting prep.

### Scenario 3: Large Event / Catering Pre-Order
- **Description**: Corporate catering order for 50 bottles of 1.000 ML Aren Coffee Milk and 50 cups of Caffe Latte.
- **Verification**:
  - System computes required inventory: 50 bottles (1L), 50 stickers (1L), 50 cups, 50 lids, $2,000\text{g} + 500\text{g} = 2.5\text{kg}$ coffee beans, $12\text{L} + 2\text{L} = 14\text{L}$ Susu UHT.
  - Verifies whether current inventory can fulfill the order or flags shortage amounts.

### Scenario 4: Customer Order Cancellation & Variant Swap
- **Description**: Customer orders 2 Large Cups of Aren Latte, pays, but immediately requests to change to 2 Bottles of 250 ML.
- **Verification**:
  - Cashier voids original order: 2 Large cups and lids restored, scaled coffee and milk restored.
  - Cashier rings up 2 Bottles 250 ML: 2 bottles and stickers deducted, bottle milk and coffee deducted.
  - Net audit confirms cup stock is unchanged from initial; bottle stock is decremented by 2.

---

## 7. Test Harness & Automation Architecture (`scripts/tests/`)

### 7.1 Directory Layout
```
scripts/tests/
├── harness.ts                     # Core test framework: runner, assertions, color reporting, stats
├── e2e_variant_recipe_suite.ts    # Master E2E runner executing all Tiers 1-4
├── schema_contract_suite.ts       # Tier 1 (F01-F04) Schema & database contract tests
├── hpp_readiness_suite.ts         # Tier 1 (F05-F06) HPP & stock readiness tests
├── pos_depletion_suite.ts         # Tier 1 (F07-F08) Checkout & void depletion tests
└── scenarios_suite.ts             # Tiers 2, 3, 4 Boundary, combination & scenario tests
```

### 7.2 Custom Test Harness (`harness.ts`)
A dedicated, lightweight TypeScript test runner designed for Next.js 15 / Prisma environments without external test dependencies:
- **Assertion Library**: Fluent `expect(actual).toBe(expected)`, `.toEqual()`, `.toBeCloseTo()`, `.toBeGreaterThan()`, `.toThrow()`.
- **Suite Structuring**: `describe(title, fn)` and `it(title, fn)` / `test(title, fn)`.
- **Async Execution**: Full `async/await` support with per-test timing and timeout protection.
- **Clean ANSI Terminal Output**: Structured green passes (`✓`), red failures (`✗`), and summary statistics.
- **Exit Code Propagation**: Automatically exits with `process.exit(1)` on any test failure, enabling CI/CD integration.

### 7.3 How to Run the Tests

```bash
# Run the complete Master E2E Suite
npx tsx scripts/tests/e2e_variant_recipe_suite.ts

# Run individual test suites
npx tsx scripts/tests/schema_contract_suite.ts
npx tsx scripts/tests/hpp_readiness_suite.ts
npx tsx scripts/tests/pos_depletion_suite.ts
npx tsx scripts/tests/scenarios_suite.ts
```

---

## 8. Quality Assurance & Forensic Integrity Guarantees

1. **No Mocking of Core Calculations**: Mathematical HPP calculations evaluate against real raw material prices and recipe amounts.
2. **Zero Facade Testing**: Every test asserts concrete values ($5832.18$ HPP, 0 stock leakage, exact foreign keys). No tests return `true` unconditionally.
3. **Progressive Phase Detection**: The test suite gracefully verifies schema readiness, detecting whether the database is pre-migration or post-migration, providing clear diagnostic guidance without crashing.
4. **Clean State Restoration**: Any transactional tests that insert test orders or update stock levels clean up after themselves, leaving the production database in its original state.
