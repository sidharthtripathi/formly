import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function proxyRequest(
  request: NextRequest,
  method: string
): Promise<NextResponse> {
  // Use getToken at Edge Runtime for auth
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.id) {
    console.error("Proxy auth failed - no valid token:", token);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the path from the URL - everything after /api/proxy/
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Find where "proxy" is and get everything after it (including /api prefix)
  const proxyIndex = pathParts.indexOf("proxy");
  // Keep the /api prefix by including everything after proxy, not removing it
  const path = "/" + pathParts.slice(proxyIndex + 1).join("/");
  const queryString = url.search;

  const headers: Record<string, string> = {
    "X-User-Id": token.id as string,
    "Content-Type": "application/json",
  };

  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    body = JSON.stringify(await request.json());
  }

  const response = await fetch(`${API_URL}/api${path}${queryString}`, {
    method,
    headers,
    body,
    credentials: "include",
  });

  // For CSV exports, stream the response directly
  if (path.includes("/export")) {
    const blob = await response.blob();
    return new NextResponse(blob, {
      status: response.status,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": response.headers.get("Content-Disposition") || `attachment; filename="export.csv"`,
      },
    });
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  // For other responses, return as text
  const text = await response.text();
  return new NextResponse(text, { status: response.status });
}

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, "POST");
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request, "PATCH");
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, "DELETE");
}