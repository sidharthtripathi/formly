import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormSchema } from "@formly/shared/types/form-schema";
import { authedFetch, API_URL } from "@/lib/api-helpers";

export function useMarketplace(params?: { category?: string; sort?: string; q?: string }) {
  return useQuery({
    queryKey: ["marketplace", params],
    queryFn: async () => {
      // Marketplace list is public
      const queryString = new URLSearchParams(params as Record<string, string>).toString();
      const res = await fetch(`${API_URL}/api/marketplace${queryString ? `?${queryString}` : ""}`);
      if (!res.ok) {
        throw new Error("Failed to fetch marketplace");
      }
      const data = await res.json();
      return data.data;
    },
    retry: false,
  });
}

export function usePublishToMarketplace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; category?: string; tags?: string[]; schema: FormSchema }) => {
      const data = await authedFetch<{ data: unknown }>("/api/marketplace", {
        method: "POST",
        body: JSON.stringify(payload),
      });
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
      await authedFetch(`/api/marketplace/${listingId}`, { method: "DELETE" });
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
      const data = await authedFetch<{ upvoted: boolean }>(`/api/marketplace/${listingId}/upvote`, { method: "POST" });
      return data;
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
      const data = await authedFetch<{ data: unknown }>(`/api/marketplace/${listingId}/copy`, { method: "POST" });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
