"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BuilderShell } from "@/components/builder/BuilderShell";
import { InitialGenerationScreen } from "@/components/builder/InitialGenerationScreen";
import { useFormStore } from "@/stores/formStore";
import { useForm, useCreateForm } from "@/hooks/useForms";
import { useFormGeneration } from "@/hooks/useAI";
import type { FormSchema } from "@formly/shared/types/form-schema";

type GenerationPhase = "idle" | "creating" | "generating" | "done";

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
  const router = useRouter();
  const formId = params.formId as string;
  const prompt = searchParams.get("prompt") || sessionStorage.getItem("newFormPrompt");
  const template = searchParams.get("template");

  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [initializedFormId, setInitializedFormId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const { data: form, isLoading } = useForm(formId);
  const { setSchema, schema, clearStreamedFields, setGenerating } = useFormStore();
  const createForm = useCreateForm();
  const { generate, stop, isGenerating, hasStartedStreaming } = useFormGeneration(formId);

  const hasStartedGeneration = useRef(false);
  const currentPrompt = useRef<string | null>(null);

  // Track when we should transition from "creating" to "generating"
  useEffect(() => {
    if (hasStartedStreaming && phase === "creating") {
      setPhase("generating");
    }
  }, [hasStartedStreaming, phase]);

  // Track when generation is complete
  useEffect(() => {
    if (!isGenerating && phase === "generating" && hasStartedStreaming) {
      // Generation finished (either completed or stopped)
      setPhase("done");
      setGenerating(false);
    }
  }, [isGenerating, hasStartedStreaming, phase, setGenerating]);

  // Initialize: create form and start generation for new forms with prompt
  useEffect(() => {
    async function initNewForm() {
      if (formId !== "new" || phase !== "idle" || initializedFormId) return;

      // No prompt/template - just show builder normally
      if (!prompt && !template) {
        return;
      }

      setPhase("creating");
      currentPrompt.current = prompt;

      try {
        // Create form in database
        const newForm = await createForm.mutateAsync({
          title: "Untitled Form",
          description: "",
          schema: createEmptySchema(),
        });

        // @ts-ignore - form ID is returned
        const newFormId = newForm.id;

        // Clear sessionStorage now that we've consumed the prompt
        sessionStorage.removeItem("newFormPrompt");

        // Update URL without query params using router.replace
        router.replace(`/builder/${newFormId}`);

        setInitializedFormId(newFormId);

        // Start generation after form is created
        // The useEffect watching hasStartedStreaming will transition to "generating"
      } catch (err) {
        console.error("Failed to create form:", err);
        setPhase("idle");
        setInitError(err instanceof Error ? err.message : "Failed to create form");
      }
    }

    initNewForm();
  }, [formId, phase, initializedFormId, prompt, template, createForm, router]);

  // Start generation once we have the form ID
  useEffect(() => {
    if (phase === "creating" && initializedFormId && !hasStartedGeneration.current && currentPrompt.current) {
      hasStartedGeneration.current = true;
      clearStreamedFields();
      setGenerating(true);
      generate(currentPrompt.current);
    }
  }, [phase, initializedFormId, generate, clearStreamedFields, setGenerating]);

  // Handle cancel during creating/generating phases
  const handleCancel = useCallback(() => {
    if (phase === "creating" && !initializedFormId) {
      // Form not created yet, just go back home
      router.push("/");
      return;
    }
    if (phase === "generating") {
      stop();
      setPhase("done"); // Transition to done - user will see partial form
    }
  }, [phase, stop, initializedFormId, router]);

  // Handle error state
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

  // Phase: "creating" - showing initial generation screen while form is being created
  if (formId === "new" && phase === "creating" && !initializedFormId) {
    return (
      <InitialGenerationScreen
        prompt={prompt || ""}
        phase="creating"
        onCancel={handleCancel}
      />
    );
  }

  // Phase: "creating" or "generating" with form created - show locked builder
  if ((phase === "creating" || phase === "generating") && initializedFormId) {
    const formData = form as { schema?: FormSchema } | null | undefined;
    const currentSchema = schema || formData?.schema;

    return (
      <BuilderShell
        formId={initializedFormId}
        initialSchema={currentSchema}
        initialMessage={currentPrompt.current}
        isLocked={true}
      />
    );
  }

  // Existing forms or forms without prompt - normal builder
  const displayFormId = formId !== "new" ? formId : initializedFormId;

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

  // Existing form loaded - normal builder
  if (formId !== "new" && form) {
    const formData = form as { schema: FormSchema };
    return <BuilderShell formId={formId} initialSchema={formData.schema} />;
  }

  // New form without prompt - normal builder
  if (formId === "new" && !prompt && !template) {
    return <BuilderShell formId="new" initialSchema={createEmptySchema()} />;
  }

  // Phase: "done" or "idle" with initialized form - show normal builder
  if (displayFormId) {
    const formData = form as { schema?: FormSchema } | null | undefined;
    const currentSchema = schema || formData?.schema;
    return (
      <BuilderShell
        formId={displayFormId}
        initialSchema={currentSchema}
      />
    );
  }

  // Fallback - should not reach here normally
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
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
