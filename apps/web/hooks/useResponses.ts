import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { auth } from "@/lib/auth";
import { authedFetch, API_URL } from "@/lib/api-helpers";

export function useResponses(formId: string, page = 1) {
  return useQuery({
    queryKey: ["responses", formId, { page }],
    queryFn: async () => {
      const data = await authedFetch<{ data: unknown[]; page: number; limit: number }>(`/api/forms/${formId}/responses?page=${page}`);
      return data;
    },
    enabled: !!formId,
    retry: false,
  });
}

export function useInfiniteResponses(formId: string) {
  return useInfiniteQuery({
    queryKey: ["responses", formId],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await authedFetch<{ data: unknown[]; page: number; limit: number }>(`/api/forms/${formId}/responses?page=${pageParam}`);
      return data;
    },
    getNextPageParam: (lastPage) => {
      if ((lastPage as any).data?.length < 20) return undefined;
      return ((lastPage as any).page || 1) + 1;
    },
    initialPageParam: 1,
    enabled: !!formId,
    retry: false,
  });
}

export function useSubmitResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ formId, answers, metadata, respondentId }: { formId: string; answers: Record<string, unknown>; metadata?: Record<string, unknown>; respondentId?: string }) => {
      // Submit response is public - no auth needed
      const res = await fetch(`${API_URL}/api/forms/${formId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, metadata, respondentId }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Failed to submit response" }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
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
      const session = await auth();
      const token = (session?.user as { id?: string })?.id;

      const response = await fetch(`${API_URL}/api/forms/${formId}/responses/export`, {
        headers: token ? { "X-User-Id": token } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to export responses");
      }

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
