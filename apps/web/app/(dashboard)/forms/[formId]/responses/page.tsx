"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useResponses, useExportResponses } from "@/hooks/useResponses";
import { useForm } from "@/hooks/useForms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Search, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ResponsesPage() {
  const params = useParams();
  const formId = params.formId as string;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<Record<string, unknown> | null>(null);

  const { data: form } = useForm(formId);
  const { data: responsesData, isLoading } = useResponses(formId, page);
  const exportResponses = useExportResponses();

  const responses = responsesData?.data || [];
  const totalPages = Math.ceil((responsesData?.data?.length || 0) / 20) || 1;

  const schemaFields = (form?.schema as any)?.fields || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href={`/builder/${formId}`}
            className="p-2 hover:bg-muted rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{form?.title || "Responses"}</h1>
            <p className="text-sm text-muted-foreground">
              {responses.length > 0 ? `${responses.length} responses` : "No responses yet"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => exportResponses.mutate(formId)}
          disabled={exportResponses.isPending || responses.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search responses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Calendar className="w-4 h-4" />
        </Button>
      </div>

      {/* Responses Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading responses...
            </div>
          ) : responses.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No responses yet. Share your form to start collecting responses.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</th>
                    {schemaFields.slice(0, 4).map((field: any) => (
                      <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {field.label}
                      </th>
                    ))}
                    {schemaFields.length > 4 && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        +{schemaFields.length - 4} more
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {responses.map((response: any, idx: number) => (
                    <tr
                      key={response.id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedResponse(response)}
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {(page - 1) * 20 + idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(response.submittedAt).toLocaleDateString()}
                      </td>
                      {schemaFields.slice(0, 4).map((field: any) => {
                        const answer = response.answers?.[field.id];
                        let displayValue = answer;
                        if (Array.isArray(answer)) displayValue = answer.join(", ");
                        if (field.type === "rating") displayValue = "★".repeat(answer || 0);
                        return (
                          <td key={field.id} className="px-4 py-3 text-sm truncate max-w-[200px]">
                            {displayValue ?? "-"}
                          </td>
                        );
                      })}
                      {schemaFields.length > 4 && <td className="px-4 py-3 text-sm text-muted-foreground">...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Response Detail Drawer */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedResponse(null)}
          />
          <div className="relative w-full max-w-md bg-background border-l overflow-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">Response Details</h3>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-1 hover:bg-muted rounded"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                Submitted {new Date(selectedResponse.submittedAt as string).toLocaleString()}
              </div>
              {schemaFields.map((field: any) => {
                const answer = (selectedResponse.answers as Record<string, unknown>)?.[field.id];
                return (
                  <div key={field.id} className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      {field.label}
                    </label>
                    <div className="text-sm">
                      {Array.isArray(answer) ? (answer as unknown[]).join(", ") : (answer as string) ?? "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
