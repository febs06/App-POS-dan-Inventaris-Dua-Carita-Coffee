import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPin, verifySessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    const sessionUser = verifySessionToken(token);

    // Kasir dilarang melihat daftar seluruh staf / akun di sistem
    if (sessionUser && sessionUser.role === "KASIR") {
      return NextResponse.json({ error: "Akses ditolak: Staf kasir tidak diizinkan melihat daftar akun" }, { status: 403 });
    }

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

    const cleanUsername = username.toLowerCase().trim();
    const existing = await prisma.employee.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username sudah digunakan oleh karyawan lain" },
        { status: 400 }
      );
    }

    const cleanPin = String(pin).trim();
    if (cleanPin.length < 6) {
      return NextResponse.json(
        { error: "Password / PIN minimal 6 karakter (disarankan 8 karakter kombinasi huruf & angka)" },
        { status: 400 }
      );
    }

    if (/^(\d)\1+$/.test(cleanPin) || ["123456", "654321", "12345678", "password"].includes(cleanPin.toLowerCase())) {
      return NextResponse.json(
        { error: "Password terlalu sederhana. Gunakan kombinasi huruf dan angka yang unik" },
        { status: 400 }
      );
    }

    const hashedPin = hashPin(cleanPin);

    const employee = await prisma.employee.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        pinHash: hashedPin,
        pin: null, // Do not store plaintext
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

    // Safety check: Pastikan tidak menonaktifkan atau mengubah role satu-satunya Owner aktif di sistem
    if (isActive === false || role === "KASIR") {
      const targetEmp = await prisma.employee.findUnique({ where: { id } });
      if (targetEmp?.role === "OWNER") {
        const otherActiveOwners = await prisma.employee.count({
          where: { role: "OWNER", isActive: true, NOT: { id } },
        });
        if (otherActiveOwners === 0) {
          return NextResponse.json(
            { error: "Satu-satunya akun Owner aktif tidak dapat dinonaktifkan atau diubah role-nya." },
            { status: 400 }
          );
        }
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
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
    if (pin !== undefined && pin.trim() !== "") {
      const cleanPin = String(pin).trim();
      if (cleanPin.length < 6) {
        return NextResponse.json(
          { error: "Password / PIN minimal 6 karakter (disarankan 8 karakter kombinasi huruf & angka)" },
          { status: 400 }
        );
      }
      if (/^(\d)\1+$/.test(cleanPin) || ["123456", "654321", "12345678", "password"].includes(cleanPin.toLowerCase())) {
        return NextResponse.json(
          { error: "Password terlalu sederhana. Gunakan kombinasi huruf dan angka yang unik" },
          { status: 400 }
        );
      }
      updateData.pinHash = hashPin(cleanPin);
      updateData.pin = null;
    }
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
