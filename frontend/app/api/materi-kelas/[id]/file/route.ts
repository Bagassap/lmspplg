import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: _id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const filePath = request.nextUrl.searchParams.get("path");
  console.log("[PDF proxy] materi id:", _id, "| path param:", filePath);

  if (!filePath || !filePath.startsWith("/uploads/")) {
    console.warn("[PDF proxy] Invalid or missing path param, returning 400");
    return new NextResponse("Invalid path", { status: 400 });
  }

  const backendUrl = `${BACKEND}${filePath}`;
  console.log("[PDF proxy] Fetching:", backendUrl);

  try {
    const fileRes = await fetch(backendUrl, {
      cache: "no-store",
    });

    console.log(
      "[PDF proxy] Backend status:", fileRes.status,
      "| Content-Type:", fileRes.headers.get("content-type"),
      "| Content-Length:", fileRes.headers.get("content-length"),
    );

    if (!fileRes.ok) {
      console.warn("[PDF proxy] Backend returned", fileRes.status, "returning 404");
      return new NextResponse("File not found on backend", { status: 404 });
    }

    const fileBuffer = await fileRes.arrayBuffer();
    console.log("[PDF proxy] Buffer size:", fileBuffer.byteLength, "bytes");

    if (fileBuffer.byteLength === 0) {
      console.warn("[PDF proxy] Empty buffer received from backend, returning 404");
      return new NextResponse("Empty file from backend", { status: 404 });
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Length": String(fileBuffer.byteLength),
        "Accept-Ranges": "none",
      },
    });
  } catch (err) {
    console.error("[PDF proxy] Fetch error:", err);
    return new NextResponse("Failed to fetch file from backend", { status: 502 });
  }
}
