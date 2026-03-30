import { auth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiError {
  error: string;
  details?: unknown;
}

export async function authedFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await auth();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Include user ID for server-side JWT validation
  if (session?.user?.id) {
    headers["X-User-Id"] = session.user.id;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export { API_URL };
