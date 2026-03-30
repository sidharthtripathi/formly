import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormSchema } from "@formly/shared/types/form-schema";
import { authedFetch } from "@/lib/api-helpers";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const data = await authedFetch<{ data: unknown[] }>("/api/templates");
      return data.data;
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; schema: FormSchema; isPublic?: boolean }) => {
      const data = await authedFetch<{ data: unknown }>("/api/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      await authedFetch(`/api/templates/${templateId}`, { method: "DELETE" });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useUseTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (templateId: string) => {
      const data = await authedFetch<{ data: unknown }>(`/api/templates/${templateId}/use`, { method: "POST" });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
