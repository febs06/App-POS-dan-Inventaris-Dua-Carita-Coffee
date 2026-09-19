import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, pin, role } = body;

    if (!name || !username || !pin) {
      return NextResponse.json(
        { error: "Nama, username, dan PIN wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({
      where: { username },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username sudah digunakan oleh karyawan lain" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        username: username.toLowerCase().trim(),
        pin: String(pin).trim(),
        role: role || "KASIR",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, username, pin, role, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID karyawan dibutuhkan" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (username !== undefined) {
      const cleanUsername = username.toLowerCase().trim();
      const existingUser = await prisma.employee.findUnique({
        where: { username: cleanUsername },
      });
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json({ error: "Username sudah digunakan karyawan lain" }, { status: 400 });
      }
      updateData.username = cleanUsername;
    }
    if (pin !== undefined && pin.trim() !== "") updateData.pin = String(pin).trim();
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.employee.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/employees error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
