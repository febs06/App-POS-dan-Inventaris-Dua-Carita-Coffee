import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPin, hashPin, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, username, pin, password } = body;
    const inputPassword = password !== undefined ? password : pin;

    if (!username && !id) {
      return NextResponse.json({ error: "Email atau username wajib dimasukkan" }, { status: 400 });
    }

    if (!inputPassword) {
      return NextResponse.json({ error: "Password wajib dimasukkan" }, { status: 400 });
    }

    // Pembersihan input username / email (mendukung format @username atau username langsung)
    const rawUser = String(username || "").trim();
    const cleanUsername = rawUser.startsWith("@") ? rawUser.substring(1).toLowerCase() : rawUser.toLowerCase();

    let employee = null;
    if (cleanUsername) {
      employee = await prisma.employee.findUnique({
        where: { username: cleanUsername },
      });
    } else if (id) {
      employee = await prisma.employee.findUnique({ where: { id } });
    }

    // Pesan error generic untuk mencegah User Enumeration attack
    const GENERIC_AUTH_ERROR = "Email atau password anda salah";

    if (!employee) {
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    // Verify Password / PIN against pinHash or legacy plaintext pin
    const isMatch = verifyPin(String(inputPassword).trim(), employee.pinHash || employee.pin);
    if (!isMatch) {
      return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { error: "Akun ini sedang dinonaktifkan oleh admin. Silakan hubungi Owner." },
        { status: 403 }
      );
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
