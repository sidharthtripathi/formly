import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormSchema } from "@formly/shared/types/form-schema";
import { authedFetch, API_URL } from "@/lib/api-helpers";

export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const data = await authedFetch<{ data: unknown[] }>("/api/forms");
      return data.data || [];
    },
  });
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: ["forms", formId],
    queryFn: async () => {
      const data = await authedFetch<{ data: unknown }>(`/api/forms/${formId}`);
      return data.data;
    },
    enabled: !!formId,
  });
}

export function usePublicForm(slug: string) {
  return useQuery({
    queryKey: ["forms", "public", slug],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/forms/public/${slug}`);
      const data = await res.json();
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; schema: FormSchema }) => {
      const data = await authedFetch<{ data: unknown }>("/api/forms", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ formId, ...payload }: { formId: string; title?: string; description?: string; schema?: FormSchema; status?: string }) => {
      const data = await authedFetch<{ data: unknown }>(`/api/forms/${formId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return data.data;
    },
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formId: string) => {
      await authedFetch(`/api/forms/${formId}`, { method: "DELETE" });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function usePublishForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formId: string) => {
      const data = await authedFetch<{ data: unknown }>(`/api/forms/${formId}/publish`, {
        method: "POST",
      });
      return data.data;
    },
    onSuccess: (_, formId) => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
