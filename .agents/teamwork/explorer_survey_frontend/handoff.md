# Frontend Recipe & Variant Architecture Survey Report

## 1. Observation

### 1.1 Overview of Investigated Frontend Files
The following files across the Next.js frontend and connected API endpoints were directly examined:
- `src/app/products/page.tsx` (Menu, Variants & Recipe Admin Management Page)
- `src/components/PosProductModal.tsx` (POS Direct Order Variant Selector Modal)
- `src/app/pos/page.tsx` (POS Cashier Screen & Cart System)
- `src/app/po/page.tsx` (Pre-Order Management Page & Modal)
- `src/app/stock/page.tsx` (Raw Materials, Stock Opname, and Finished Products Stock Page)
- `src/app/bazaar-orders/page.tsx` (Live Kitchen / Barista Order Tracking Screen)
- `src/components/ReceiptModal.tsx` (80mm Thermal Receipt & WhatsApp Invoice Modal)
- `src/app/api/products/route.ts` (Products & Variants CRUD API)
- `src/app/api/orders/route.ts` (Order Creation, Stock Depletion & Void Rollback API)
- `prisma/schema.prisma` (Database Schema Models: `Product`, `ProductVariant`, `ProductIngredient`, `RawMaterial`, `OrderItem`)

### 1.2 Exact Observations & Verbatim Code Quotes

#### A. Where and How Recipes Are Managed Today (`src/app/products/page.tsx`)
- **State declaration** (lines 48–50):
  ```tsx
  // Raw Materials for Recipe
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [prodIngredients, setProdIngredients] = useState<{ rawMaterialId: string; amount: number }[]>([]);
  const [autoCalcCost, setAutoCalcCost] = useState(false);
  ```
  `prodIngredients` is stored as a flat array at the **Product level**, completely unassociated with individual variants.

- **Recipe calculation & application** (lines 158–162, 944–949):
  ```tsx
  const calculatedHpp = prodIngredients.reduce((sum, ing) => {
    const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
    if (!raw) return sum;
    return sum + (Number(ing.amount) || 0) * (raw.costPerUnit || 0);
  }, 0);
  ```
  ```tsx
  <button
    type="button"
    onClick={() => setProdCost(Math.round(calculatedHpp * 100) / 100)}
    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
  >
    Terapkan ke Modal/HPP
  </button>
  ```
  Clicking "Terapkan ke Modal/HPP" only updates `prodCost` (the parent product's general cost), without updating any of the variant costs (`v.cost`).

- **Recipe UI Container in Product Modal** (lines 855–952):
  - Label: `"Komposisi / Resep Bahan Baku per 1 {prodUnit}"`
  - Subtitle: `"Jika bahan habis di gudang, produk otomatis dinonaktifkan di kasir POS."`
  - Button `+ Bahan` (`handleAddIngredient`, lines 136–142): Appends `{ rawMaterialId: rawMaterials[0].id, amount: 1 }` to `prodIngredients`.
  - Row items (lines 882–934):
    - Material dropdown `<select>` displaying `${r.name} (Sisa: ${r.stock} ${r.unit})`
    - Amount numeric input `<input type="number" step="any" min="0.01">`
    - Satuan label `${selectedMat?.unit || "unit"}`
    - Delete button `<Trash2>` (`handleRemoveIngredient(idx)`)
  - **Absence of Variant Switching**: The recipe block is positioned below the variant block (lines 769–853) with zero links, tabs, or selectors between them.

#### B. How Variants Are Presented in Admin UI (`src/app/products/page.tsx`)
- **Default Variant Template** (lines 32–37):
  ```tsx
  const DEFAULT_VARIANTS_TEMPLATE: VariantFormItem[] = [
    { packaging: "Cup", size: "Reguler", price: 13000, cost: 6000, stock: 50, isActive: true },
    { packaging: "Cup", size: "Large", price: 16000, cost: 8000, stock: 50, isActive: true },
    { packaging: "Botol", size: "250 ML", price: 15000, cost: 7000, stock: 25, isActive: true },
    { packaging: "Botol", size: "1.000 ML", price: 55000, cost: 25000, stock: 10, isActive: true },
  ];
  ```
- **Variant Form Items** (lines 786–852):
  - Renders cards for each variant with a checkbox for `v.isActive`, packaging badge (`🥤 Cup` or `🍾 Botol`), size badge (`Reguler`, `Large`, `250 ML`, `1.000 ML`), and two inputs:
    - `Harga Jual (Rp)` -> `updateVariant(idx, "price", ...)`
    - `Modal / HPP (Rp)` -> `updateVariant(idx, "cost", ...)` (entered manually, not calculated from recipe)
  - `VariantFormItem` interface (lines 22–30):
    ```tsx
    interface VariantFormItem {
      id?: string;
      packaging: string;
      size: string;
      price: number;
      cost: number;
      stock: number;
      isActive: boolean;
    }
    ```
    There is **no `ingredients` field** in `VariantFormItem`. The user **cannot** view or edit ingredients per variant.

- **Product Table Presentation** (lines 508–587):
  - "Harga Jual" column shows variant pill badges with size and price.
  - "Modal (HPP)" column only shows `{formatRupiah(p.cost)}` (product base cost).
  - "Bahan Baku & Kesiapan" column only evaluates `p.isAvailableByIngredients` and `p.maxProducible` at the product level.

#### C. POS Cashier Screen & Variant Selection (`src/components/PosProductModal.tsx` & `src/app/pos/page.tsx`)
- **POS Grid Product Card** (`src/app/pos/page.tsx`, lines 525–586):
  - If a product has multiple variants (`p.isGrouped`), displays badge `"{p.variantCount} Varian"` and price `"Mulai {formatRupiah(p.minPrice)}"`.
  - Out of stock / Readiness status:
    ```tsx
    const isRawMissing = p.isAvailableByIngredients === false;
    const effectiveStock = p.maxProducible !== undefined && p.maxProducible !== null
      ? Math.min(p.stock, p.maxProducible)
      : p.stock;
    const isOutOfStock = p.stock <= 0 && isRawMissing;
    ```
    This status check is performed exclusively against the `Product` object. If any ingredient in the product's single recipe is missing, the whole product is flagged "Bahan Habis". Conversely, if regular ingredients are present but large packaging or 1L botol packaging is out of stock, the POS card remains marked ready.
- **POS Modal Variant Selection** (`src/components/PosProductModal.tsx`):
  - Step 1 (lines 211–244): Packaging selection tabs (`uniquePackagings`: "Cup", "Botol").
  - Step 2 (lines 247–278): Size selection button tiles (`availableVariantsForPackaging`: "Reguler", "Large", "250 ML", "1.000 ML").
  - **Tile Content** (lines 267–272):
    ```tsx
    <span className={`text-xs font-bold ${isSelected ? "text-[#852d2d]" : "text-slate-800"}`}>
      {v.size}
    </span>
    <span className={`text-[11px] font-mono mt-0.5 ${isSelected ? "text-[#852d2d] font-bold" : "text-slate-500"}`}>
      {formatRupiah(v.price)}
    </span>
    ```
    There is **no readiness indicator, stock count, or ingredient alert per variant tile**.
- **POS Order Submission** (`src/app/pos/page.tsx`, lines 385–407):
  - In `handleConfirmPayment`, cart items are mapped:
    ```tsx
    items: cart.map((item) => ({
      productId: item.product.id,
      variantId: item.variant?.id || null,
      price: item.price || item.product.price,
      qty: item.qty,
      notes: item.sizeLabel
        ? (item.notes ? `${item.sizeLabel} • ${item.notes}` : item.sizeLabel)
        : (item.notes || null),
    }))
    ```

#### D. POS Inventory Depletion Behavior on Sale (`src/app/api/orders/route.ts`)
- **Stock Depletion Loop** (lines 269–284):
  ```tsx
  for (const item of validatedItems) {
    for (const ing of item.product.ingredients) {
      const requiredAmount = ing.amount * item.qty;
      const existing = requiredMaterialsMap.get(ing.rawMaterialId);
      if (existing) {
        existing.totalAmount += requiredAmount;
      } else {
        requiredMaterialsMap.set(ing.rawMaterialId, {
          materialId: ing.rawMaterialId,
          name: ing.rawMaterial?.name || "Bahan",
          unit: ing.rawMaterial?.unit || "",
          totalAmount: requiredAmount,
        });
      }
    }
  }
  ```
  `item.product.ingredients` is consumed for every sale regardless of whether the customer bought "Cup Reguler", "Cup Large", "Botol 250 ML", or "Botol 1.000 ML".
- **Product Stock Decrement** (lines 349–356):
  ```tsx
  for (const item of validatedItems) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.qty },
      },
    });
  }
  ```
  Decrements `tx.product`, but leaves `tx.productVariant.stock` untouched.
- **Rollback on Void & Delete** (lines 490–509, 617–636):
  Rollback iterates `item.product?.ingredients`, restoring product-level ingredients rather than variant-specific ingredients.

#### E. Pre-Order Screen (`src/app/po/page.tsx`)
- Lines 55 & 112: `poItems` state is defined as:
  `{ productId: string; qty: number; notes: string; price: number }[]`
- PO modal does **not** allow selecting variants (`variantId` is completely missing from PO item inputs).

---

## 2. Logic Chain

1. **Premise 1**: The original user request specifies strict variant-specific recipes (`R2`), accurate HPP per variant (`R3`), accurate variant stock readiness and depletion (`R4`), and full-stack management UI (`R5`).
2. **From Observation A & B**: In `src/app/products/page.tsx`, recipes are modeled as a single list `prodIngredients` attached to `Product`. The `prodVariants` state contains no ingredients structure, no variant selector exists in the recipe UI, and clicking "Terapkan ke Modal/HPP" overwrites the base `prodCost` instead of calculating variant HPPs.
3. **From Observation C**: In `src/components/PosProductModal.tsx` and `src/app/pos/page.tsx`, variant buttons only display size and price. They do not display whether ingredients for that specific variant (e.g. Large cup, 1L bottle, or increased milk dosage) are in stock.
4. **From Observation D**: In `src/app/api/orders/route.ts`, checkout depletion exclusively queries `item.product.ingredients`, which means selling a Large cup or 1.000 ML bottle uses the exact same ingredient quantities as a Reguler cup, corrupting raw material stock counts and failing to deduct physical containers.
5. **Inference**: To fulfill `R2` through `R5` on the frontend, the UI architecture must be refactored:
   - In `src/app/products/page.tsx`: Shift recipe state from `prodIngredients: []` to `prodVariants: [{ ...variant, ingredients: [] }]`, introduce an interactive variant switcher (tabs or pill selectors) to view and edit ingredients per variant, compute HPP live per variant, and update variant cost.
   - In `src/components/PosProductModal.tsx`: Render variant stock readiness (max producible portions and out-of-stock badges) directly on variant buttons so cashiers instantly know which sizes can be served.
   - In `src/app/pos/page.tsx`: Ensure catalog badges summarize variant readiness (e.g. "2/4 Varian Siap" or "Sebagian Habis").
   - In `src/app/po/page.tsx`: Add variant selection to the PO item creation modal.

---

## 3. Caveats

1. **Database Schema & Backend Dependency**: Frontend cannot save per-variant ingredients until the database schema has a relation connecting `ProductVariant` to recipes (e.g. `variantId` in `ProductIngredient` or a dedicated `VariantIngredient` table) and `/api/products` accepts and returns nested variant ingredients.
2. **Backward Compatibility & Legacy Data**: Existing products in the database may currently have ingredients linked only to `productId`. The frontend must handle existing products gracefully by offering to copy/migrate legacy product ingredients into each variant upon initial opening.
3. **No Unintended Regressions**: The TypeScript compiler currently runs with zero errors (`npx tsc --noEmit` exited code 0). Any interface modifications to `Product`, `ProductVariant`, or `CartItem` must maintain strict type safety.

---

## 4. Conclusion & Required Frontend Modifications

### 4.1 Component Hierarchy & File Path Mapping

```
Frontend Hierarchy
├── src/app/products/page.tsx (Admin Product & Recipe Management)
│   ├── Products Table (Show HPP range/badges per variant, show readiness per variant)
│   └── Product Modal (isProductModalOpen)
│       ├── Variant List (prodVariants)
│       └── Variant Recipe Manager (NEW: Variant Tab Switcher -> Variant BOM Editor)
│           ├── Active Variant Selector: [🥤 Cup Reguler] [🥤 Cup Large] [🍾 Botol 250 ML] [🍾 Botol 1.000 ML]
│           ├── Recipe Item List for Selected Variant (+ Bahan, Select Raw Material, Amount, Satuan, Delete)
│           └── Variant HPP Summary & "Terapkan ke Modal Varian Ini"
│
├── src/components/PosProductModal.tsx (Cashier Variant Picker)
│   ├── Packaging Selector (Cup vs Botol)
│   └── Size Selector Tiles
│       └── NEW: Variant Readiness Badge per Tile (e.g. "✓ 24 Porsi" or "⚠️ Bahan Habis")
│
├── src/app/pos/page.tsx (Cashier Catalog & Checkout)
│   ├── Product Grid Cards (Readiness summary reflecting variant states)
│   └── Checkout Handler (Passes variantId cleanly to /api/orders)
│
├── src/app/po/page.tsx (Pre-Order Management)
│   └── New PO Modal (Add variantId selector dropdown when adding product items)
│
├── src/app/bazaar-orders/page.tsx (Kitchen Queue)
│   └── Order Items (Display clean variant label: e.g. "Matcha Latte (Cup Large)")
│
└── src/components/ReceiptModal.tsx (Thermal Receipt & WhatsApp Invoice)
    └── Order Items (Format item with variant name in thermal print & WhatsApp payload)
```

### 4.2 Step-by-Step UI Implementation Specification

#### 1. `src/app/products/page.tsx`
- **State Redesign**:
  ```ts
  interface VariantIngredientItem {
    rawMaterialId: string;
    amount: number;
  }

  interface VariantFormItem {
    id?: string;
    packaging: string; // "Cup", "Botol"
    size: string; // "Reguler", "Large", "250 ML", "1.000 ML"
    price: number;
    cost: number;
    stock: number;
    isActive: boolean;
    ingredients: VariantIngredientItem[];
  }
  ```
- **Active Variant Recipe Tab State**:
  ```ts
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  ```
- **Live Variant HPP Calculation**:
  ```ts
  const calculateVariantHpp = (variant: VariantFormItem) => {
    return (variant.ingredients || []).reduce((sum, ing) => {
      const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
      if (!raw) return sum;
      return sum + (Number(ing.amount) || 0) * (raw.costPerUnit || 0);
    }, 0);
  };
  ```
- **UI Component in Modal**:
  - Replace the single global `prodIngredients` section with an interactive multi-variant recipe manager.
  - Tabs showing all active variants with packaging icon, size label, and current calculated HPP.
  - Adding/modifying/removing ingredients modifies `prodVariants[selectedVariantIdx].ingredients`.
  - Provide a convenient "Salin Resep dari Varian Lain" helper button (e.g. copy from Reguler to Large, then adjust ml/gram).
  - Button "Terapkan ke Modal Varian" updates `prodVariants[selectedVariantIdx].cost`.
- **Form Submission**:
  - Send `variants: prodVariants.map(v => ({ ...v, ingredients: v.ingredients }))` in POST / PUT `/api/products`.

#### 2. `src/components/PosProductModal.tsx`
- Update `ProductVariant` interface with readiness fields:
  ```ts
  export interface ProductVariant {
    id: string;
    productId: string;
    packaging: string;
    size: string;
    price: number;
    cost: number;
    stock: number;
    isActive: boolean;
    isAvailable?: boolean;
    missingIngredients?: { name: string; shortage: number; unit: string }[];
    maxProducible?: number | null;
  }
  ```
- In Size Selection Tiles (lines 254–277), display availability and badge:
  - If `v.isAvailable === false` or `(v.maxProducible !== null && v.maxProducible <= 0)`:
    - Display `"Bahan Habis"` badge in rose color.
    - Dim tile or disable selection.
  - If available:
    - Display `"Maks: {v.maxProducible} {product.unit}"` in emerald/slate text.

#### 3. `src/app/pos/page.tsx`
- Enrich catalog cards so cashiers can see variant availability at a glance (e.g. if Large is out of stock but Regular is ready, display `"Sebagian Habis"` or `"2/4 Varian"` instead of disabling the entire card).

#### 4. `src/app/po/page.tsx`
- Update `poItems` to include `variantId`.
- In PO creation form, render a Variant dropdown whenever a product is selected.

---

## 5. Verification Method

### 5.1 Verification Commands
1. **TypeScript Type Verification**:
   ```powershell
   npx tsc --noEmit
   ```
   Must execute cleanly with 0 type errors after interface and component prop updates.

2. **Next.js Production Build Verification**:
   ```powershell
   npm run build
   ```
   Verifies that all pages, static generations, and dynamic routes compile without errors.

### 5.2 Manual UI Verification Steps
1. Navigate to `/products`.
2. Open "Tambah Menu Baru" or edit an existing product (e.g. "Matcha Oat Latte").
3. Verify that under "Komposisi / Resep Bahan Baku", there are selectable tabs for each variant (`Cup Reguler`, `Cup Large`, `Botol 250 ML`, `Botol 1.000 ML`).
4. Set distinct recipes for each variant:
   - `Cup Reguler`: 1 pcs Cup Reguler, 150 ml Susu Oat, 15 g Bubuk Matcha.
   - `Cup Large`: 1 pcs Cup Large, 220 ml Susu Oat, 22 g Bubuk Matcha.
   - `Botol 250 ML`: 1 pcs Botol 250 ML, 200 ml Susu Oat, 20 g Bubuk Matcha.
   - `Botol 1.000 ML`: 1 pcs Botol 1.000 ML, 800 ml Susu Oat, 80 g Bubuk Matcha.
5. Verify that each variant shows its distinct calculated HPP and that clicking "Terapkan ke Modal Varian" updates that variant's cost.
6. Save the product and reload `/products` to verify persistent per-variant recipes.
7. Open `/pos`:
   - Click the product card.
   - Verify that `PosProductModal` displays packaging tabs and size tiles with accurate readiness/max producible portions per variant.
   - When one raw material (e.g. Cup Large) stock is 0, verify that `Cup Large` shows "Bahan Habis" while `Cup Reguler` remains orderable.
   - Add to cart and complete checkout.
   - Verify that only the chosen variant's ingredients and packaging container are deducted from inventory.

### 5.3 Invalidation Conditions
- Any code where `ProductIngredient` remains associated solely with `productId` without a `variantId` linkage.
- Any UI design where the recipe editor only allows editing a single global ingredient list per product.
- Any checkout transaction where selling a Large cup deducts the same ingredients as a Regular cup.
