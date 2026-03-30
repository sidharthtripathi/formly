import { createAuthClient } from "next-auth/react";

export const clientAuth = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
