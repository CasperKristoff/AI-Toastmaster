import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Expect service account credentials via env
let SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || "ai-toastmaster.appspot.com";

async function ensureFirebaseInitialized() {
  if (getApps().length) return;

  // If env var not provided, try reading from a local file for dev convenience
  if (!SERVICE_ACCOUNT_JSON) {
    const fileFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
    const candidatePaths = [
      fileFromEnv,
      path.join(process.cwd(), "FIREBASE_CONFIG.json"),
    ].filter(Boolean) as string[];

    for (const p of candidatePaths) {
      try {
        const json = await readFile(p, "utf8");
        SERVICE_ACCOUNT_JSON = json;
        break;
      } catch {
        // continue
      }
    }
  }

  if (!SERVICE_ACCOUNT_JSON) {
    console.warn(
      "Upload API not configured: missing FIREBASE_SERVICE_ACCOUNT_JSON or readable FIREBASE_CONFIG.json.",
    );
    return;
  }

  initializeApp({
    credential: cert(JSON.parse(SERVICE_ACCOUNT_JSON)),
    storageBucket: STORAGE_BUCKET,
  });
}

export async function POST(req: NextRequest) {
  try {
    await ensureFirebaseInitialized();
    if (!getApps().length) {
      return NextResponse.json(
        { error: "Server not configured (missing service account)" },
        { status: 500 },
      );
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const path = (formData.get("path") as string) || `uploads/${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucket = getStorage().bucket();
    console.log("Attempting to upload to bucket:", bucket.name);

    const fileRef = bucket.file(path);
    await fileRef.save(buffer, {
      contentType: file.type || "application/octet-stream",
      resumable: false,
      public: true,
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    // Make the file publicly accessible
    await fileRef.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${encodeURIComponent(path)}`;
    console.log("Upload successful, public URL:", publicUrl);
    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("Upload error", e);
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 },
    );
  }
}
