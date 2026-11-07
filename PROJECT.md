# Project: Booth POS — Cashier Navigation, Bazaar Orders, Audit Reports, and Products & Categories Improvements

## Architecture
- **Framework**: Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript
- **Database & ORM**: PostgreSQL on Neon, Prisma ORM
- **Module Boundaries & Data Flow**:
  1. **Authentication & RBAC Navigation**:
     - `Employee.role`: `"OWNER"`, `"MANAGER"`, `"KASIR"`, `"BARISTA"`.
     - Client stores active cashier in `sessionStorage` and `localStorage` under key `"active_cashier"`.
     - `Sidebar.tsx`: Renders navigation items, filtering out privileged back-office routes (`/finance`) for non-owner cashiers.
     - `AppLayout.tsx` & `src/app/finance/page.tsx`: Defense-in-depth route guard ensuring cashiers accessing `/finance` are immediately redirected to `/pos` without flashing back-office data or executing back-office API queries (`/api/cashflow`, `/api/rab`).
  2. **Bazaar Operations (`/bazaar-orders`)**:
     - Fetches orders from `/api/orders?sort=desc`.
     - Order payments contain payment method (`CASH`, `QRIS`, `TRANSFER`) and amount.
     - Computes real-time cashier operational metrics: cup sold today, omset today, CASH nominal & count, QRIS nominal & count, and count of orders currently being prepared ("diproses" = "Sedang Diracik").
  3. **Owner Audit Reports (`/reports`)**:
     - `GET /api/orders` enriched to include `items.variant.ingredients.rawMaterial`.
     - Computes Total Omzet, Total HPP (based on raw materials/recipes with fallback to variant/product cost), and Total Laba Kotor (Total Omzet - Total HPP).
     - Preserves existing audit report visual layout, card design, and print stylesheet.
  4. **Product Catalog & Variant Management (`/products`)**:
     - Edit Product Modal: Removes redundant top-level standalone fields ("Harga Jual", "Modal / HPP", "Estimasi Keuntungan Standar") when editing an existing menu item, keeping the variant and packaging section completely intact and functional.
     - Products Table: "Margin Laba" column upgraded to display per-variant breakdown (e.g. 1.000 ML, 250 ML, Large, Reguler) with profit margin in Rp and %, matching the layout of the "Modal (HPP)" column.

## Feature Inventory
Every feature from the user request and survey mapped to an assigned milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Cashier Sidebar Navigation Filter | Hide "Kas Booth & Shift" (/finance) for cashier role in sidebar | M1 | R1 |
| 2 | /finance Direct Route Protection | Redirect cashier accessing `/finance` directly to `/pos`, prevent rendering back-office finance data and stop API fetching | M1 | R1 |
| 3 | Bazaar Orders CASH Payment Metric Card | Display Total Masuk via CASH (nominal Rp and transaction count) in `/bazaar-orders` | M2 | R1 |
| 4 | Bazaar Orders QRIS Payment Metric Card | Display Total Masuk via QRIS (nominal Rp and transaction count) in `/bazaar-orders` | M2 | R1 |
| 5 | Bazaar Orders Cashier Consolidated Summary | Provide summary: cup hari ini terjual, omset hari ini, pembayaran cash, pembayaran qris, pesanan sedang diracik | M2 | R1 |
| 6 | Orders API Recipe Ingredients Inclusion | Include `variant: { include: { ingredients: { include: { rawMaterial: true } } } }` in `GET /api/orders` | M3 | R1 |
| 7 | Owner Audit Reports Total HPP Metric | Compute Total HPP from recipe raw materials for filtered active orders and display in `/reports` preserving visual style | M3 | R1 |
| 8 | Owner Audit Reports Total Laba Kotor Metric | Compute Total Laba Kotor (Total Omzet - Total HPP) with gross margin % in `/reports` preserving visual style | M3 | R1 |
| 9 | Product Edit Modal Top Fields Cleanup | In Edit Product Modal, remove standalone "Harga Jual (Rp)", "Modal / HPP (Rp)", and "Estimasi Keuntungan Standar" bar; preserve variant section | M4 | R2 |
| 10 | Products Table Margin Laba Breakdown | Format "Margin Laba" column to list each active variant/size with projected profit in Rp and % matching "Modal (HPP)" column | M4 | R3 |
| 11 | Comprehensive Verification & Forensic Integrity Audit | Validate complete build, test suites, non-regression, and forensic integrity audit | M5 | Acceptance Criteria |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Cashier Navigation & /finance Route Protection | `src/components/Sidebar.tsx`, `src/components/AppLayout.tsx`, `src/app/finance/page.tsx` | none | DONE |
| M2 | Bazaar Orders Payment & Operational Metrics | `src/app/bazaar-orders/page.tsx` | none | DONE |
| M3 | Owner Audit Reports HPP & Gross Profit Metrics | `src/app/api/orders/route.ts`, `src/app/reports/page.tsx` | none | DONE |
| M4 | Product Edit Modal Cleanup & Table Margin Laba Breakdown | `src/app/products/page.tsx` | none | DONE |
| M5 | Dual Track Verification & Forensic Integrity Audit | E2E test verification, `npm run build`, forensic integrity audit | M1, M2, M3, M4 | DONE |

## Interface Contracts

### 1. Cashier Role & Route Guard Contract
- Privileged Roles: `userRole === "OWNER" || userRole === "MANAGER"` (case-insensitive, trimmed).
- Restricted Cashier Role: Any non-privileged role (default `"KASIR"`).
- Restricted Routes for Cashier: `/finance`, `/settings`, `/reports`, `/analytics`, `/customers`, `/suppliers`, `/events`.
- Cashier Allowed Routes: `/pos`, `/bazaar-orders`, `/po`.
- Direct Access to `/finance`:
  - `AppLayout.tsx`: Halts rendering `{children}` and invokes `router.replace("/pos")`.
  - `src/app/finance/page.tsx`: In-page role check prevents data fetching (`/api/cashflow`, `/api/rab`) and renders `null` / access denied card during redirection.

### 2. Bazaar Orders Summary Contract
- Payment Calculation:
  - `cashTotal`: $\sum \text{payments with method CASH / Tunai}$
  - `cashTxCount`: count of distinct orders with CASH payment
  - `qrisTotal`: $\sum \text{payments with method QRIS}$
  - `qrisTxCount`: count of distinct orders with QRIS payment
- Operational Metrics:
  - Cup terjual: $\sum \text{item.qty}$ across filtered orders
  - Omset: $\sum \text{order.totalAmount}$ across filtered orders
  - Sedang diracik: count of orders with `status === "diproses"`

### 3. Orders HPP & Gross Profit Calculation Contract
- Order Item Unit HPP:
  $$\text{unitHpp} = \sum (\text{ingredient.amount} \times \text{ingredient.rawMaterial.costPerUnit}) \quad \text{fallback to } \text{variant.cost} \quad \text{fallback to } \text{product.cost}$$
- Total HPP = $\sum_{\text{active non-void orders}} \sum_{\text{items}} (\text{item.qty} \times \text{unitHpp})$
- Total Laba Kotor = $\text{Total Omzet} - \text{Total HPP}$
- Gross Margin % = $(\text{Total Laba Kotor} / \text{Total Omzet}) \times 100$

### 4. Product Modal & Margin Table Contract
- Edit Product Modal:
  - When `editingProduct !== null`, standalone fields at top are not rendered.
  - Per-variant inputs inside `prodVariants` manage price and cost.
  - Form submission saves variant prices and costs, updating product price/cost fallback from the first active variant.
- Products Table "Margin Laba" Column:
  - Per-variant badges matching "Modal (HPP)" structure:
    `varProfit = v.price - v.cost`
    `varMargin = v.price > 0 ? Math.round((varProfit / v.price) * 100) : 0`
    Display: `{v.size}: {formatRupiah(varProfit)} ({varMargin}%)`

## Code Layout
- `src/components/Sidebar.tsx`: Cashier sidebar navigation & `/finance` filtering
- `src/components/AppLayout.tsx`: Global route guard and access restriction
- `src/app/finance/page.tsx`: Finance back-office page with defense-in-depth role guard
- `src/app/bazaar-orders/page.tsx`: Bazaar orders view with CASH/QRIS & operational metrics
- `src/app/api/orders/route.ts`: Orders API including variant recipe ingredients
- `src/app/reports/page.tsx`: Owner audit report with Total HPP & Total Laba Kotor
- `src/app/products/page.tsx`: Product edit modal cleanup and table margin laba breakdown
- `scripts/verify_m1_m2_challenge.ts`: Empirical challenge test suite for M1 and M2 (97 assertions)
- `scripts/verify_m3_m4_challenge.ts`: Empirical challenge test suite for M3 and M4 (26 assertions)
