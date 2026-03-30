import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      const { data } = await api.api.users.me.get();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreditStatus() {
  return useQuery({
    queryKey: ["user", "credits"],
    queryFn: async () => {
      const { data } = await api.api.users.me.credits.get();
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export function useCreateStripeCheckout() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.api.stripe["create-checkout"].post({});
      return data;
    },
  });
}

export function useStripePortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.api.stripe.portal.post({});
      return data;
    },
  });
}
