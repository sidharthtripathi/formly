"use client";

import { AnalysisChat } from "@/components/analytics/AnalysisChat";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "@/hooks/useForms";

interface FormData {
  title?: string;
  [key: string]: unknown;
}

export default function AnalyticsPage() {
  const params = useParams();
  const formId = params.formId as string;
  const { data: form } = useForm(formId) as { data?: FormData };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[calc(100vh-57px)]"
    >
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="border-b px-4 py-3 flex items-center gap-4"
      >
        <Link
          href={`/forms/${formId}/responses`}
          className="p-2 hover:bg-muted rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <div>
            <h1 className="font-semibold">AI Analysis</h1>
            <p className="text-sm text-muted-foreground">{form?.title}</p>
          </div>
        </div>
      </motion.div>

      {/* Chat */}
      <AnalysisChat formId={formId} />
    </motion.div>
  );
}
