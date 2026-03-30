"use client";

import { AnalysisChat } from "@/components/analytics/AnalysisChat";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "@/hooks/useForms";

export default function AnalyticsPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { data: form } = useForm(formId);

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-4">
        <Link
          href={`/forms/${formId}/responses`}
          className="p-2 hover:bg-muted rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-semibold">AI Analysis</h1>
          <p className="text-sm text-muted-foreground">{form?.title}</p>
        </div>
      </div>

      {/* Chat */}
      <AnalysisChat formId={formId} />
    </div>
  );
}
