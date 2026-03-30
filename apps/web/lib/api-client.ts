import { treaty } from "@elysiajs/eden";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = treaty<any>(process.env.NEXT_PUBLIC_API_URL!);
export { api as api };
