import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormSchema } from "@formly/shared/types/form-schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export function useMarketplace(params?: { category?: string; sort?: string; q?: string }) {
  return useQuery({
    queryKey: ["marketplace", params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const res = await fetch(`${API_URL}/api/marketplace${queryString ? `?${queryString}` : ""}`);
      const data = await res.json();
      return data.data;
    },
  });
}

export function usePublishToMarketplace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; category?: string; tags?: string[]; schema: FormSchema }) => {
      const res = await fetch(`${API_URL}/api/marketplace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}

export function useUnpublishMarketplaceListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      await fetch(`${API_URL}/api/marketplace/${listingId}`, { method: "DELETE" });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}

export function useToggleUpvote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const res = await fetch(`${API_URL}/api/marketplace/${listingId}/upvote`, { method: "POST" });
      const data = await res.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace"] });
    },
  });
}

export function useCopyMarketplaceTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const res = await fetch(`${API_URL}/api/marketplace/${listingId}/copy`, { method: "POST" });
      const data = await res.json();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
