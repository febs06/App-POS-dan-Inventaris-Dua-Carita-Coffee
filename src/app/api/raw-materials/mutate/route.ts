import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawMaterialId = searchParams.get("rawMaterialId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (rawMaterialId && rawMaterialId !== "all") {
      where.rawMaterialId = rawMaterialId;
    }
    if (type && type !== "all") {
      where.type = type;
    }

    const logs = await prisma.rawMaterialLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true,
            costPerUnit: true,
            lastPurchasePrice: true,
            supplier: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET /api/raw-materials/mutate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      rawMaterialId,
      changeQty,
      type,
      notes,
      date,
      purchasePrice,
      supplierName,
      costMethod = "average", // "average" (Weighted Moving Average) or "latest" (Harga Terakhir)
      recordCashExpense = false,
    } = body;

    if (!rawMaterialId || changeQty === undefined || !type) {
      return NextResponse.json(
        { error: "Bahan baku, jumlah mutasi, dan jenis mutasi wajib diisi" },
        { status: 400 }
      );
    }

    const qty = parseFloat(changeQty);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Jumlah mutasi harus berupa angka positif lebih dari 0" },
        { status: 400 }
      );
    }

    const material = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Bahan baku tidak ditemukan" },
        { status: 404 }
      );
    }

    // Determine sign: restock is positive, pemakaian / rusak is negative, koreksi depends
    let signedQty = qty;
    if (type === "pemakaian" || type === "rusak") {
      signedQty = -Math.abs(qty);
    } else if (type === "restock") {
      signedQty = Math.abs(qty);
    } else if (type === "koreksi") {
      signedQty = qty;
    }

    const newStock = Math.max(0, material.stock + signedQty);
    const logDate = date ? new Date(date) : new Date();

    // Parse purchase price & calculate price fluctuation and new HPP (Cost Per Unit)
    let parsedPurchasePrice: number | null = null;
    let totalCost: number | null = null;
    let prevCost: number | null = material.lastPurchasePrice || (material.costPerUnit > 0 ? material.costPerUnit : null);
    let priceDiff: number | null = null;
    let priceDiffPercent: number | null = null;
    let newCostPerUnit = material.costPerUnit;

    if (type === "restock" && purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== "") {
      const priceVal = parseFloat(purchasePrice);
      if (!isNaN(priceVal) && priceVal >= 0) {
        parsedPurchasePrice = priceVal;
        totalCost = Math.round(signedQty * priceVal);

        // Calculate price fluctuation vs previous price
        if (prevCost && prevCost > 0) {
          priceDiff = Math.round((priceVal - prevCost) * 100) / 100;
          priceDiffPercent = Math.round(((priceVal - prevCost) / prevCost) * 1000) / 10;
        }

        // Calculate updated HPP based on selected method
        if (costMethod === "latest") {
          newCostPerUnit = priceVal;
        } else {
          // Weighted Moving Average Cost:
          // New HPP = ((Current Stock * Current HPP) + (Restock Qty * New Price)) / Total Stock
          const currentStockVal = Math.max(0, material.stock) * (material.costPerUnit || priceVal);
          const additionVal = signedQty * priceVal;
          const totalStock = Math.max(0, material.stock) + signedQty;
          newCostPerUnit = totalStock > 0 ? (currentStockVal + additionVal) / totalStock : priceVal;
          newCostPerUnit = Math.round(newCostPerUnit * 100) / 100;
        }
      }
    }

    const cleanSupplierName = supplierName?.trim() || null;

    // Database updates in transaction
    const [updatedMaterial, log] = await prisma.$transaction(async (tx) => {
      const updated = await tx.rawMaterial.update({
        where: { id: rawMaterialId },
        data: {
          stock: newStock,
          ...(parsedPurchasePrice !== null ? {
            costPerUnit: newCostPerUnit,
            lastPurchasePrice: parsedPurchasePrice,
          } : {}),
          ...(cleanSupplierName ? { supplier: cleanSupplierName } : {}),
        },
      });

      const newLog = await tx.rawMaterialLog.create({
        data: {
          rawMaterialId,
          changeQty: signedQty,
          type,
          purchasePrice: parsedPurchasePrice,
          totalCost,
          supplierName: cleanSupplierName,
          prevCostPerUnit: prevCost,
          priceDiff,
          priceDiffPercent,
          notes: notes || null,
          createdAt: logDate,
        },
      });

      // If supplier exists and price provided, record to SupplierPriceHistory
      if (cleanSupplierName && parsedPurchasePrice !== null) {
        const existingSupplier = await tx.supplier.findFirst({
          where: {
            name: { equals: cleanSupplierName, mode: "insensitive" },
          },
        });

        if (existingSupplier) {
          await tx.supplierPriceHistory.create({
            data: {
              supplierId: existingSupplier.id,
              itemName: material.name,
              qty: signedQty,
              unit: material.unit,
              price: parsedPurchasePrice,
              priceDiff,
              date: logDate,
              notes: priceDiff !== null
                ? priceDiff > 0
                  ? `Kenaikan harga (+${formatRupiah(priceDiff)})`
                  : priceDiff < 0
                  ? `Penurunan harga (${formatRupiah(priceDiff)})`
                  : "Harga stabil"
                : "Restok bahan",
            },
          });
        }
      }

      // If user enabled automatic cash expense recording
      if (recordCashExpense && totalCost && totalCost > 0) {
        const lastRecord = await tx.cashRecord.findFirst({
          orderBy: { date: "desc" },
        });
        const prevBalance = lastRecord?.balance || 0;
        const newBalance = prevBalance - totalCost;

        await tx.cashRecord.create({
          data: {
            account: "CASH",
            date: logDate,
            name: `Restok ${material.name} (${signedQty} ${material.unit}${cleanSupplierName ? ` - ${cleanSupplierName}` : ""})`,
            type: "KELUAR",
            category: "BAHAN_BAKU",
            amount: totalCost,
            balance: newBalance,
          },
        });
      }

      return [updated, newLog];
    });

    return NextResponse.json({
      success: true,
      material: updatedMaterial,
      log,
      priceDiff,
      priceDiffPercent,
      newCostPerUnit,
    });
  } catch (error: any) {
    console.error("POST /api/raw-materials/mutate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
