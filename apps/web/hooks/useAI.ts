import { useState, useCallback, useRef } from "react";
import { useCreditStatus } from "./useUser";
import { useUpdateForm } from "./useForms";
import { useFormStore } from "@/stores/formStore";
import type { FormSchema, FormField } from "@formly/shared/types/form-schema";
import { useSession } from "next-auth/react";

const AI_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getSessionUserId(session: ReturnType<typeof useSession>["data"]) {
  return (session?.user as { id?: string })?.id;
}

export function useFormGeneration(formId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamedContent, setStreamedContent] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const { setSchema, setMode, addStreamedField } = useFormStore();
  const { data: credits } = useCreditStatus();
  const { data: session } = useSession();
  const updateForm = useUpdateForm();

  const generate = useCallback(
    async (prompt: string) => {
      console.log("[useFormGeneration] generate() called, prompt:", prompt);
      console.log("[useFormGeneration] session:", session);
      console.log("[useFormGeneration] userId from session:", getSessionUserId(session));
      console.log("[useFormGeneration] credits:", credits);

      if (credits && credits.limit !== -1 && credits.used >= credits.limit) {
        setError("AI credits exhausted. Please upgrade to Pro or wait for reset.");
        setMode("manual");
        return;
      }

      setIsGenerating(true);
      setError(null);
      setStreamedContent("");
      setHasStartedStreaming(false);

      // Get current user session for SSE auth
      const userId = getSessionUserId(session);
      console.log("[useFormGeneration] Connecting to SSE with userId:", userId);

      if (!userId) {
        setError("You must be signed in to generate forms.");
        setIsGenerating(false);
        return;
      }

      const params = new URLSearchParams({ prompt });
      if (userId) {
        params.set("userId", userId);
      }
      const es = new EventSource(`${AI_API_URL}/api/ai/generate?${params}`);
      console.log("[useFormGeneration] EventSource created, URL:", `${AI_API_URL}/api/ai/generate?${params}`);
      eventSourceRef.current = es;

      let content = "";
      let streamingStarted = false;
      const markStreamingStarted = () => {
        if (!streamingStarted) {
          streamingStarted = true;
          setHasStartedStreaming(true);
        }
      };

      // Handle raw text deltas for partial content display
      es.addEventListener("schema_delta", (e) => {
        markStreamingStarted();
        try {
          const delta = JSON.parse(e.data);
          content += delta.text || "";
          setStreamedContent(content);
        } catch {}
      });

      // Handle completed fields for real-time rendering
      es.addEventListener("field_complete", (e) => {
        markStreamingStarted();
        try {
          const { field } = JSON.parse(e.data) as { field: FormField };
          addStreamedField(field);
        } catch {}
      });

      // Handle metadata (title, pages)
      es.addEventListener("meta", (e) => {
        markStreamingStarted();
        try {
          const { title, pages } = JSON.parse(e.data);
          // Meta is handled through the final schema parse
        } catch {}
      });

      es.addEventListener("done", async () => {
        es.close();
        setIsGenerating(false);

        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const schema = JSON.parse(jsonMatch[0]) as FormSchema;

            // Validate schema has required fields before saving
            if (!schema || !Array.isArray(schema.fields) || !Array.isArray(schema.pages)) {
              console.error("[useFormGeneration] Invalid schema structure:", schema);
              setError("Failed to parse generated form. Please try again.");
              return;
            }

            setSchema(schema);
            if (formId) {
              try {
                await updateForm.mutateAsync({ formId, schema });
              } catch {
                setError("Failed to save form. Your generated form is still visible above.");
              }
            }
          } else {
            setError("Failed to parse generated form. Please try again.");
          }
        } catch {
          setError("Failed to parse generated form. Please try again.");
        }
      });

      es.onerror = (e) => {
        console.error("[useFormGeneration] SSE error:", e);
        es.close();
        setIsGenerating(false);
        setError("Connection error. Please try again.");
      };

      es.onopen = () => {
        console.log("[useFormGeneration] SSE connection opened");
      };
    },
    [credits, session, formId, setSchema, setMode, updateForm, addStreamedField]
  );

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    setIsGenerating(false);
    setHasStartedStreaming(false);
  }, []);

  return { generate, stop, isGenerating, hasStartedStreaming, error, streamedContent };
}

export function useFormModification(formId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { setSchema } = useFormStore();
  const { data: session } = useSession();
  const updateForm = useUpdateForm();

  const modify = useCallback(
    async (prompt: string, currentSchema: FormSchema, selectedFieldId?: string) => {
      setIsGenerating(true);
      setError(null);

      // Get current user session for auth
      const userId = getSessionUserId(session);
      const url = new URL(`${AI_API_URL}/api/ai/modify`);
      if (userId) {
        url.searchParams.set("userId", userId);
      }

      // Use fetch with POST for SSE
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, currentSchema, selectedFieldId }),
      });

      if (!response.ok) {
        setIsGenerating(false);
        setError("Failed to start modification");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setIsGenerating(false);
        setError("No response body");
        return;
      }

      const decoder = new TextDecoder();
      let content = "";

      const processStream = async () => {
        try {
          let result = await reader.read();
          while (!result.done) {
            const chunk = decoder.decode(result.value, { stream: true });
            // SSE events look like: event: schema_delta\ndata: {...}\n\n
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  content += data.text || "";
                } catch {}
              }
            }
            result = await reader.read();
          }
        } catch {
          // Stream ended
        }
      };

      processStream().then(() => {
        setIsGenerating(false);

        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const schema = JSON.parse(jsonMatch[0]) as FormSchema;
            setSchema(schema);
            if (formId) {
              updateForm.mutate({ formId, schema });
            }
          }
        } catch {
          setError("Failed to parse modified form. Please try again.");
        }
      });
    },
    [formId, setSchema, updateForm]
  );

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    setIsGenerating(false);
  }, []);

  return { modify, stop, isGenerating, error };
}
