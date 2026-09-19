import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const suppliersData = [
  {
    code: "SPL-001",
    name: "Lets Brew",
    pic: "-",
    phone: "0812-1488-889",
    city: "Bandung",
    type: "Bahan Baku",
    mapsUrl: "https://maps.google.com/?q=Lets+Brew+Bandung",
    status: "Aktif",
    notes: "Supplier utama biji kopi, sirup, dan bubuk matcha",
  },
  {
    code: "SPL-002",
    name: "Utara Jaya",
    pic: "-",
    phone: "0812-2200-1826",
    city: "Bandung",
    type: "Packaging",
    mapsUrl: "https://maps.google.com/?q=Utara+Jaya+Bandung",
    status: "Aktif",
    notes: "Supplier botol kale 250ml & 1L",
  },
  {
    code: "SPL-003",
    name: "Nyablonkeun.id",
    pic: "-",
    phone: "0858-6480-8823",
    city: "Bandung",
    type: "Packaging",
    mapsUrl: "https://maps.google.com/?q=Nyablonkeun.id+Bandung",
    status: "Aktif",
    notes: "Supplier cup injection & tutup cup sablon",
  },
  {
    code: "SPL-004",
    name: "Aj Supplier & Tbk Cipadung",
    pic: "-",
    phone: "0811-2244-942",
    city: "Bandung",
    type: "Bahan Baku",
    mapsUrl: "https://maps.google.com/?q=Aj+Supplier+Tbk+Cipadung+Bandung",
    status: "Aktif",
    notes: "Supplier susu UHT kartonan harga grosir",
  },
  {
    code: "SPL-005",
    name: "Camille Printshop",
    pic: "-",
    phone: "0822-6286-5123",
    city: "Bandung",
    type: "Packaging",
    mapsUrl: "https://maps.google.com/?q=Camille+Printshop+Bandung",
    status: "Aktif",
    notes: "Percetakan stiker vinyl kiss cut Rp 13.000 / lembar",
  },
  {
    code: "SPL-006",
    name: "Golden Sata Digital Printing",
    pic: "-",
    phone: "0811-2489-191",
    city: "Bandung",
    type: "Packaging",
    mapsUrl: "https://maps.google.com/?q=Golden+Sata+Digital+Printing+Bandung",
    status: "Aktif",
    notes: "Percetakan stiker vinyl kiss cut Rp 14.500 / lembar",
  },
  {
    code: "SPL-007",
    name: "Cicalengka Printing",
    pic: "-",
    phone: "0895-3815-53838",
    city: "Bandung",
    type: "Packaging",
    mapsUrl: "https://maps.google.com/?q=Cicalengka+Printing+Bandung",
    status: "Aktif",
    notes: "Percetakan stiker vinyl kiss cut Rp 15.000 / lembar",
  },
];

const supplierItemsData = [
  // SPL-001 Lets Brew
  {
    supplierCode: "SPL-001",
    category: "Kopi",
    name: "Javanica Coffee Eclipse Full Robusta Temanggung",
    qty: 1,
    unit: "Kg",
    price: 159000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Syrup/Flavor",
    name: "Trieste Hazelnut",
    qty: 1,
    unit: "Pcs",
    price: 80000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Syrup/Flavor",
    name: "Denali Syrup Chocolate",
    qty: 1,
    unit: "Pcs",
    price: 96000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Creamer",
    name: "Santos Creamer Premium SCP 33M 1KG",
    qty: 1,
    unit: "Kg",
    price: 48000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Dairy/Susu",
    name: "UHT Diamond Plain",
    qty: 1,
    unit: "L",
    price: 19500,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Dairy/Susu",
    name: "UHT Rich Milk 1 L",
    qty: 1,
    unit: "L",
    price: 22500,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Dairy/Susu",
    name: "UHT Diamond Plain",
    qty: 1,
    unit: "Karton",
    price: 228000,
    priceDate: new Date("2026-09-17"),
    notes: "Per 12 Pcs",
  },
  {
    supplierCode: "SPL-001",
    category: "Dairy/Susu",
    name: "UHT Rich Milk 1 L",
    qty: 1,
    unit: "Karton",
    price: 264000,
    priceDate: new Date("2026-09-17"),
    notes: "Per 12 Pcs",
  },
  {
    supplierCode: "SPL-001",
    category: "Powder",
    name: "Matcha Pure Hotta 100 G Repack",
    qty: 1,
    unit: "Pack",
    price: 85000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Operasional",
    name: "Paper Filter Mokapot 78 MM 100s 12 Cup",
    qty: 1,
    unit: "Pack",
    price: 12000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Operasional",
    name: "Paper Filter Mokapot 42 MM 100s 1-2 Cup",
    qty: 1,
    unit: "Pack",
    price: 12000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-001",
    category: "Operasional",
    name: "Pump Botol Syrup Kecil",
    qty: 1,
    unit: "Pcs",
    price: 17000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },

  // SPL-002 Utara Jaya
  {
    supplierCode: "SPL-002",
    category: "Packaging",
    name: "Botol Kale 250 ML Tipis",
    qty: 1,
    unit: "Bal",
    price: 107500,
    priceDate: new Date("2026-09-17"),
    notes: "Per 100 Pcs",
  },
  {
    supplierCode: "SPL-002",
    category: "Packaging",
    name: "Botol Kale 1 L",
    qty: 1,
    unit: "Bal",
    price: 140000,
    priceDate: new Date("2026-09-17"),
    notes: "Per 50 Pcs",
  },

  // SPL-003 Nyablonkeun.id
  {
    supplierCode: "SPL-003",
    category: "Packaging",
    name: "Cup Injection 12 Oz",
    qty: 1,
    unit: "Pack",
    price: 207200,
    priceDate: new Date("2026-09-17"),
    notes: "Per 200 Pcs",
  },
  {
    supplierCode: "SPL-003",
    category: "Packaging",
    name: "Tutup Cup Injection",
    qty: 1,
    unit: "Pack",
    price: 11000,
    priceDate: new Date("2026-09-17"),
    notes: "Per 25 Pcs",
  },

  // SPL-004 Aj Supplier & Tbk Cipadung
  {
    supplierCode: "SPL-004",
    category: "Dairy/Susu",
    name: "UHT Diamond Plain",
    qty: 1,
    unit: "Karton",
    price: 221000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
  {
    supplierCode: "SPL-004",
    category: "Dairy/Susu",
    name: "UHT Rich Milk 1 L",
    qty: 1,
    unit: "Karton",
    price: 258000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },

  // SPL-005 Camille Printshop
  {
    supplierCode: "SPL-005",
    category: "Packaging",
    name: "Stiker Vinyl Kiss Cut",
    qty: 1,
    unit: "Lembar",
    price: 13000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },

  // SPL-006 Golden Sata Digital Printing
  {
    supplierCode: "SPL-006",
    category: "Packaging",
    name: "Stiker Vinyl Kiss Cut",
    qty: 1,
    unit: "Lembar",
    price: 14500,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },

  // SPL-007 Cicalengka Printing
  {
    supplierCode: "SPL-007",
    category: "Packaging",
    name: "Stiker Vinyl Kiss Cut",
    qty: 1,
    unit: "Lembar",
    price: 15000,
    priceDate: new Date("2026-09-17"),
    notes: "",
  },
];

async function main() {
  console.log("=== 1. UPSERT MASTER SUPPLIER ===");
  const supplierIdMap = new Map<string, string>(); // code -> id

  for (const s of suppliersData) {
    const existing = await prisma.supplier.findUnique({
      where: { code: s.code },
    });

    let supId = "";
    if (existing) {
      console.log(`Updating supplier: ${s.name} (${s.code})`);
      const updated = await prisma.supplier.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          phone: s.phone,
          city: s.city,
          type: s.type,
          mapsUrl: s.mapsUrl,
          status: s.status,
          notes: s.notes,
        },
      });
      supId = updated.id;
    } else {
      console.log(`Creating supplier: ${s.name} (${s.code})`);
      const created = await prisma.supplier.create({
        data: {
          code: s.code,
          name: s.name,
          phone: s.phone,
          city: s.city,
          type: s.type,
          mapsUrl: s.mapsUrl,
          status: s.status,
          notes: s.notes,
        },
      });
      supId = created.id;
    }
    supplierIdMap.set(s.code, supId);
  }

  console.log("=== 2. UPSERT SUPPLIER ITEMS & HISTORY HARGA ===");
  for (const item of supplierItemsData) {
    const supplierId = supplierIdMap.get(item.supplierCode);
    if (!supplierId) {
      console.warn(`Supplier ${item.supplierCode} not found!`);
      continue;
    }

    // Check if supplier item exists
    let supItem = await prisma.supplierItem.findFirst({
      where: {
        supplierId,
        name: item.name,
        unit: item.unit,
      },
    });

    if (supItem) {
      console.log(`Updating supplier item: ${item.name} (${item.unit})`);
      supItem = await prisma.supplierItem.update({
        where: { id: supItem.id },
        data: {
          category: item.category,
          qty: item.qty,
          price: item.price,
          priceDate: item.priceDate,
          notes: item.notes || null,
        },
      });
    } else {
      console.log(`Creating supplier item: ${item.name} (${item.unit})`);
      supItem = await prisma.supplierItem.create({
        data: {
          supplierId,
          category: item.category,
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          price: item.price,
          priceDate: item.priceDate,
          notes: item.notes || null,
        },
      });
    }

    // Check if history already exists
    const existingHist = await prisma.supplierPriceHistory.findFirst({
      where: {
        supplierId,
        itemName: item.name,
        unit: item.unit,
        price: item.price,
      },
    });

    if (!existingHist) {
      console.log(`Creating price history for: ${item.name}`);
      await prisma.supplierPriceHistory.create({
        data: {
          supplierId,
          supplierItemId: supItem.id,
          itemName: item.name,
          qty: item.qty,
          unit: item.unit,
          price: item.price,
          priceDiff: 0,
          date: item.priceDate,
          notes: "Harga Awal",
        },
      });
    }
  }

  console.log("=== SEED SUPPLIERS & ITEMS BERHASIL! ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
