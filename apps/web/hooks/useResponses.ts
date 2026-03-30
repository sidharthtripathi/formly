import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function useResponses(formId: string, page = 1) {
  return useQuery({
    queryKey: ["responses", formId, { page }],
    queryFn: async () => {
      const { data } = await api.api.forms({ id: formId }).responses.get({ query: { page: String(page) } });
      return data;
    },
    enabled: !!formId,
  });
}

export function useInfiniteResponses(formId: string) {
  return useInfiniteQuery({
    queryKey: ["responses", formId],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await api.api.forms({ id: formId }).responses.get({ query: { page: String(pageParam) } });
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.data.length < 20) return undefined;
      return (lastPage.page || 1) + 1;
    },
    initialPageParam: 1,
    enabled: !!formId,
  });
}

export function useSubmitResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ formId, answers, metadata, respondentId }: { formId: string; answers: Record<string, unknown>; metadata?: Record<string, unknown>; respondentId?: string }) => {
      const { data } = await api.api.forms({ id: formId }).responses.post({
        answers,
        metadata,
        respondentId,
      });
      return data;
    },
    onSuccess: (_, { formId }) => {
      queryClient.invalidateQueries({ queryKey: ["responses", formId] });
    },
  });
}

export function useExportResponses() {
  return useMutation({
    mutationFn: async (formId: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/forms/${formId}/responses/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `responses-${formId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    },
  });
}
