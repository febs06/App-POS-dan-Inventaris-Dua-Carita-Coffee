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

    let fileUrl = "";

    // Cek jika berjalan di lokal (bukan Vercel Serverless)
    if (!process.env.VERCEL) {
      try {
        const ext = path.extname(file.name) || ".png";
        const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
        const uniqueFileName = `${Date.now()}-${baseName}${ext}`;

        const uploadDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, uniqueFileName);
        await writeFile(filePath, buffer);

        fileUrl = `/uploads/${uniqueFileName}`;
      } catch (fsErr) {
        console.warn("Filesystem read-only, falling back to Data URL:", fsErr);
      }
    }

    // Di Vercel (read-only filesystem): konversi ke Data URL (Base64)
    // agar foto tersimpan permanen di database PostgreSQL tanpa perlu cloud storage berbayar
    if (!fileUrl) {
      const mimeType = file.type || "image/png";
      const base64 = buffer.toString("base64");
      fileUrl = `data:${mimeType};base64,${base64}`;
    }

    return NextResponse.json({ url: fileUrl, message: "Foto berhasil diunggah" }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah foto: " + (error?.message || "Internal error") }, { status: 500 });
  }
}
