// Use the Next.js proxy API route for authenticated requests
const PROXY_URL = "/api/proxy";

export interface ApiError {
  error: string;
  details?: unknown;
}

export async function authedFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Strip /api prefix if present, as proxy uses the path directly
  const path = endpoint.startsWith("/api/") ? endpoint.slice(4) : endpoint;

  const res = await fetch(`${PROXY_URL}/${path}`, {
    ...options,
    credentials: "include",
  });

  if (!res.ok) {
    const error: ApiError = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
