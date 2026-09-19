import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
    }

    // Validasi tipe file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar (JPG, PNG, WebP, dll)" }, { status: 400 });
    }

    // Batas ukuran 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitasi nama file dan buat nama unik
    const ext = path.extname(file.name) || ".png";
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const uniqueFileName = `${Date.now()}-${baseName}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;
    return NextResponse.json({ url: fileUrl, message: "Foto berhasil diunggah" }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah foto produk" }, { status: 500 });
  }
}
