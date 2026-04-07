"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { useFormStore } from "@/stores/formStore";
import { useForm, useCreateForm } from "@/hooks/useForms";
import { useFormGeneration } from "@/hooks/useAI";
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

// Separate component to handle AI generation with correct formId
function AIGenerationHandler({
  formId,
  prompt,
  onGenerated
}: {
  formId: string;
  prompt: string | null;
  onGenerated?: () => void;
}) {
  console.log("[AIGenerationHandler] Rendered with:", { formId, prompt });
  const { schema, clearStreamedFields, setGenerating } = useFormStore();
  const { generate, isGenerating } = useFormGeneration(formId);
  const hasGenerated = useRef(false);

  useEffect(() => {
    // Only generate once, when we have a real formId, a prompt, empty schema, and not already generating
    console.log("[AIGenerationHandler] effect fired:", { formId, prompt, fieldCount: schema?.fields?.length ?? 0, isGenerating, hasGenerated: hasGenerated.current });
    if (!formId || formId === "new" || !prompt || (schema?.fields?.length ?? 0) > 0 || isGenerating || hasGenerated.current) {
      console.log("[AIGenerationHandler] Skipping generate - condition not met");
      return;
    }

    console.log("[AIGenerationHandler] Calling generate with prompt:", prompt);
    hasGenerated.current = true;
    // Clear any previous streamed fields and start fresh
    clearStreamedFields();
    setGenerating(true);
    generate(prompt);
  }, [formId, prompt, schema, isGenerating, generate, clearStreamedFields, setGenerating]);

  // Call onGenerated callback when generation is complete
  useEffect(() => {
    if ((schema?.fields?.length ?? 0) > 0 && onGenerated) {
      setGenerating(false);
      onGenerated();
    }
  }, [schema, onGenerated, setGenerating]);

  return null;
}

function BuilderContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const formId = params.formId as string;
  const prompt = searchParams.get("prompt");
  const template = searchParams.get("template");

  const [isInitializing, setIsInitializing] = useState(false);
  const [initializedFormId, setInitializedFormId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const { data: form, isLoading } = useForm(formId);
  const { setSchema, schema } = useFormStore();
  const createForm = useCreateForm();

  // Initialize schema from form data
  useEffect(() => {
    const formData = form as { schema?: FormSchema } | null | undefined;
    if (formData?.schema && !schema) {
      setSchema(formData.schema);
    }
  }, [form, schema, setSchema]);

  // Handle new form creation with prompt
  useEffect(() => {
    async function initNewForm() {
      if (formId !== "new" || isInitializing || initializedFormId) return;
      if (!prompt && !template) {
        // No prompt or template, just show builder with empty schema
        setShowBuilder(true);
        return;
      }

      setIsInitializing(true);

      try {
        // Create form in database
        const newForm = await createForm.mutateAsync({
          title: "Untitled Form",
          description: "",
          schema: createEmptySchema(),
        });

        // @ts-ignore - form ID is returned
        const newFormId = newForm.id;

        // Update URL without refresh using router.replace
        router.replace(`/builder/${newFormId}?${prompt ? `prompt=${encodeURIComponent(prompt)}` : `template=${template}`}`);

        setInitializedFormId(newFormId);
        setShowBuilder(true);
      } catch (err) {
        console.error("Failed to create form:", err);
        setIsInitializing(false);
        setInitError(err instanceof Error ? err.message : "Failed to create form");
      }
    }

    initNewForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId, prompt, template]);

  // For existing forms or when we have a real formId, show builder
  const displayFormId = formId !== "new" ? formId : initializedFormId;

  // Show loading while initializing
  if (formId === "new" && isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Creating your form...</p>
        </div>
      </div>
    );
  }

  // Show error state when form creation fails
  if (formId === "new" && initError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to create form: {initError}</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go back home
          </Button>
        </div>
      </div>
    );
  }

  // For new forms without prompt, show builder with empty schema
  if (formId === "new" && showBuilder && !initializedFormId) {
    return <BuilderShell formId="new" initialSchema={createEmptySchema()} />;
  }

  // When we have a real formId (after creation), render builder with AI handler
  if (displayFormId && showBuilder) {
    const formData = form as { schema?: FormSchema } | null | undefined;
    const currentSchema = schema || formData?.schema;

    return (
      <>
        <AIGenerationHandler formId={displayFormId} prompt={prompt} />
        <BuilderShell formId={displayFormId} initialSchema={currentSchema} />
      </>
    );
  }

  // Loading state for existing forms
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

  // Existing form loaded
  if (formId !== "new" && form) {
    const formData = form as { schema: FormSchema };
    return <BuilderShell formId={formId} initialSchema={formData.schema} />;
  }

  // Fallback - should not reach here normally
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Form not found</p>
      </div>
    </div>
  );
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
