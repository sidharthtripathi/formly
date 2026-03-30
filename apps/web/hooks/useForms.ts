import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { FormSchema } from "@formly/shared/types/form-schema";

export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const { data } = await api.api.forms.get();
      return data;
    },
  });
}

export function useForm(formId: string) {
  return useQuery({
    queryKey: ["forms", formId],
    queryFn: async () => {
      const { data } = await api.api.forms({ id: formId }).get();
      return data;
    },
    enabled: !!formId,
  });
}

export function usePublicForm(slug: string) {
  return useQuery({
    queryKey: ["forms", "public", slug],
    queryFn: async () => {
      const { data } = await api.api.forms.public({ slug }).get();
      return data;
    },
    enabled: !!slug,
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; schema: FormSchema }) => {
      const { data } = await api.api.forms.post(payload);
      return data;
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
      const { data } = await api.api.forms({ id: formId }).patch(payload);
      return data;
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
      await api.api.forms({ id: formId }).delete();
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
      const { data } = await api.api.forms({ id: formId }).publish.post({});
      return data;
    },
    onSuccess: (_, formId) => {
      queryClient.invalidateQueries({ queryKey: ["forms", formId] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}
