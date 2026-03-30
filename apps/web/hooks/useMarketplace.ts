import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { FormSchema } from "@formly/shared/types/form-schema";

export function useMarketplace(params?: { category?: string; sort?: string; q?: string }) {
  return useQuery({
    queryKey: ["marketplace", params],
    queryFn: async () => {
      const { data } = await api.api.marketplace.get({ query: params as Record<string, string> });
      return data;
    },
  });
}

export function usePublishToMarketplace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; category?: string; tags?: string[]; schema: FormSchema }) => {
      const { data } = await api.api.marketplace.post(payload);
      return data;
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
      await api.api.marketplace({ id: listingId }).delete();
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
      const { data } = await api.api.marketplace({ id: listingId }).upvote.post({});
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
      const { data } = await api.api.marketplace({ id: listingId }).copy.post({});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
