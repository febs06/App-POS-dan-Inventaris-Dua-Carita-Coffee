import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPin, hashPin, createSessionToken } from "@/lib/auth";

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

    // Verify PIN against pinHash or legacy plaintext pin
    const isMatch = verifyPin(String(pin).trim(), employee.pinHash || employee.pin);
    if (!isMatch) {
      return NextResponse.json({ error: "PIN yang Anda masukkan salah" }, { status: 401 });
    }

    // Auto-migrate legacy plaintext PIN to pinHash if not yet migrated
    if (!employee.pinHash && employee.pin) {
      const newHash = hashPin(employee.pin);
      await prisma.employee.update({
        where: { id: employee.id },
        data: { pinHash: newHash, pin: null },
      });
    }

    const sessionUser = {
      id: employee.id,
      name: employee.name,
      username: employee.username,
      role: employee.role,
    };

    const token = createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      token,
      employee: sessionUser,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "session_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/employees/login error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
