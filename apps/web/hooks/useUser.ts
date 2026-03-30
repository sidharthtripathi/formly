import { useQuery, useMutation } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export function useUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/me`);
      const data = await res.json();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreditStatus() {
  return useQuery({
    queryKey: ["user", "credits"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/users/me/credits`);
      const data = await res.json();
      return data.data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateStripeCheckout() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/stripe/create-checkout`, { method: "POST" });
      const data = await res.json();
      return data.data;
    },
  });
}

export function useStripePortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/stripe/portal`, { method: "POST" });
      const data = await res.json();
      return data.data;
    },
  });
}
