import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormSchema } from "@formly/shared/types/form-schema";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/forms`);
      const data = await res.json();
      return data.data || [];
    },
  });
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: ["forms", formId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/forms/${formId}`);
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/api/forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
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
      const res = await fetch(`${API_URL}/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
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
      await fetch(`${API_URL}/api/forms/${formId}`, { method: "DELETE" });
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
      const res = await fetch(`${API_URL}/api/forms/${formId}/publish`, { method: "POST" });
      const data = await res.json();
      return data.data;
    },
    onSuccess: (_, formId) => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
