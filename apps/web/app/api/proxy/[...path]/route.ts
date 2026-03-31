import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function proxyRequest(
  request: NextRequest,
  method: string
): Promise<NextResponse> {
  // Use NextAuth v5's auth() function for server-side auth
  const session = await auth();

  if (!session?.user?.id) {
    console.error("Proxy auth failed - no valid session:", session);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the path from the URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/").filter(Boolean);

  // Find where "proxy" is and get everything after it
  const proxyIndex = pathParts.indexOf("proxy");
  const path = pathParts.slice(proxyIndex + 1).join("/");
  const queryString = url.search;

  const headers: Record<string, string> = {
    "X-User-Id": session.user.id,
    "Content-Type": "application/json",
  };

  let body: string | undefined;
  if (method !== "GET" && method !== "DELETE") {
    body = JSON.stringify(await request.json());
  }

  const response = await fetch(`${API_URL}/${path}${queryString}`, {
    method,
    headers,
    body,
    credentials: "include",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
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