import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, normalize } from "path";
import { randomBytes } from "crypto";
import { isAdminRequest } from "@/lib/session";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif"] as const;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Use volume in production (Railway), fallback to public/uploads for local dev
function getUploadDir() {
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (volumePath) {
    // Normalize to handle double-slash paths like "//data"
    return normalize(join(volumePath.replace(/^\/+/, "/"), "uploads"));
  }
  return join(process.cwd(), "public", "uploads");
}

const UPLOAD_DIR = getUploadDir();

export async function POST(req: NextRequest) {
  try {
    // Admin only — uploads go straight to our persistent volume and are
    // served under /uploads/*, so we cannot allow anonymous writes.
    if (!(await isAdminRequest())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Choose extension from the MIME type we just validated — ignore the
    // user-supplied filename entirely so things like "malware.jpg.php" are
    // impossible.
    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    if (!ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
      return NextResponse.json({ error: "Invalid extension" }, { status: 400 });
    }
    const filename = `${randomBytes(16).toString("hex")}.${ext}`;

    // Ensure upload directory exists
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
    } catch (mkdirErr) {
      console.error("mkdir error:", mkdirErr);
    }

    const filepath = join(UPLOAD_DIR, filename);
    console.log("Writing file to:", filepath);

    try {
      await writeFile(filepath, buffer);
    } catch (writeErr) {
      const msg = writeErr instanceof Error ? writeErr.message : String(writeErr);
      console.error("writeFile error:", msg, "path:", filepath);
      return NextResponse.json({
        error: `Write failed: ${msg}`,
        path: filepath,
      }, { status: 500 });
    }

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", err);
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}
