"use client";

import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { useFormStore } from "@/stores/formStore";
import { useForm } from "@/hooks/useForms";
import type { FormSchema } from "@formly/shared/types/form-schema";

function createEmptySchema(): FormSchema {
  return {
    id: "new",
    title: "Untitled Form",
    description: "",
    pages: [{ id: crypto.randomUUID(), index: 0, title: "Page 1" }],
    fields: [],
    settings: {
      showProgressBar: true,
      allowMultipleSubmissions: false,
      successMessage: "Thank you for your response!",
    },
    version: 1,
  };
}

function BuilderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params.formId as string;
  const prompt = searchParams.get("prompt");

  const { data: form, isLoading } = useForm(formId);
  const { setSchema, schema } = useFormStore();

  // Initialize schema from form data
  useEffect(() => {
    if (form?.schema && !schema) {
      setSchema(form.schema as FormSchema);
    }
  }, [form, schema, setSchema]);

  // For new forms, generate schema from prompt
  useEffect(() => {
    if (formId === "new" && prompt && !schema) {
      // This would trigger AI generation
      // For now, initialize empty schema
      setSchema(createEmptySchema());
    }
  }, [formId, prompt, schema, setSchema]);

  if (formId === "new") {
    return <BuilderShell formId="new" initialSchema={createEmptySchema()} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  return <BuilderShell formId={formId} initialSchema={form?.schema as FormSchema} />;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BuilderContent />
    </Suspense>
  );
}
