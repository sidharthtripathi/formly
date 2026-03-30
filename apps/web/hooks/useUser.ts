import { useQuery, useMutation } from "@tanstack/react-query";
import { authedFetch, API_URL } from "@/lib/api-helpers";

export function useUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const data = await authedFetch<{ data: unknown }>("/api/users/me");
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreditStatus() {
  return useQuery({
    queryKey: ["user", "credits"],
    queryFn: async () => {
      const data = await authedFetch<{ used: number; limit: number; resetsAt: string }>("/api/users/me/credits");
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateStripeCheckout() {
  return useMutation({
    mutationFn: async () => {
      const data = await authedFetch<{ data: { url: string } }>("/api/stripe/create-checkout", { method: "POST" });
      return data.data;
    },
  });
}

export function useStripePortal() {
  return useMutation({
    mutationFn: async () => {
      const data = await authedFetch<{ data: { url: string } }>("/api/stripe/portal", { method: "POST" });
      return data.data;
    },
  });
}
