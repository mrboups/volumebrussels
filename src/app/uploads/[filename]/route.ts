import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize } from "path";
import { existsSync } from "fs";

function getUploadDir() {
  const volumePath = process.env.RAILWAY_VOLUME_MOUNT_PATH;
  if (volumePath) {
    return normalize(join(volumePath.replace(/^\/+/, "/"), "uploads"));
  }
  return join(process.cwd(), "public", "uploads");
}

const UPLOAD_DIR = getUploadDir();

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Security: prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }

  const filepath = join(UPLOAD_DIR, filename);
  if (!existsSync(filepath)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(filepath);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
