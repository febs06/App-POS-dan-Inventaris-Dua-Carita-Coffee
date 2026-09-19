import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, username, pin } = body;

    if (!pin) {
      return NextResponse.json({ error: "PIN wajib dimasukkan" }, { status: 400 });
    }

    let employee = null;
    if (id) {
      employee = await prisma.employee.findUnique({ where: { id } });
    } else if (username) {
      employee = await prisma.employee.findUnique({
        where: { username: username.toLowerCase().trim() },
      });
    }

    if (!employee) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 });
    }

    if (!employee.isActive) {
      return NextResponse.json({ error: "Akun karyawan ini sedang nonaktif" }, { status: 403 });
    }

    if (employee.pin !== String(pin).trim()) {
      return NextResponse.json({ error: "PIN yang Anda masukkan salah" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        role: employee.role,
      },
    });
  } catch (error: any) {
    console.error("POST /api/employees/login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
