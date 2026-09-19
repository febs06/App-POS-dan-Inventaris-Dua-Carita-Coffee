import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    let setting = await prisma.storeSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.storeSetting.create({
        data: {
          id: "default",
          storeName: "Dua Carita Coffee",
          tagline: "Bazaar & Pre-Order System",
          phoneNumber: "081234567890",
          address: "Jakarta, Indonesia",
          receiptFooter: "Terima Kasih atas Kunjungan Anda! Follow IG @duacarita.coffee",
        },
      });
    }

    return NextResponse.json(setting);
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { storeName, tagline, logoUrl, phoneNumber, address, receiptFooter } = body;

    const setting = await prisma.storeSetting.upsert({
      where: { id: "default" },
      update: {
        storeName: storeName !== undefined ? storeName : undefined,
        tagline: tagline !== undefined ? tagline : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
        address: address !== undefined ? address : undefined,
        receiptFooter: receiptFooter !== undefined ? receiptFooter : undefined,
      },
      create: {
        id: "default",
        storeName: storeName || "Dua Carita Coffee",
        tagline: tagline || "Bazaar & Pre-Order System",
        logoUrl: logoUrl || null,
        phoneNumber: phoneNumber || "",
        address: address || "",
        receiptFooter: receiptFooter || "Terima Kasih atas Kunjungan Anda!",
      },
    });

    return NextResponse.json(setting);
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
