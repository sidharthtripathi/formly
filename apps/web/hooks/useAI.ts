import { useState, useCallback, useRef } from "react";
import { useCreditStatus } from "./useUser";
import { useUpdateForm } from "./useForms";
import { useFormStore } from "@/stores/formStore";
import type { FormSchema } from "@formly/shared/types/form-schema";

const AI_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export function useFormGeneration(formId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { setSchema, setMode } = useFormStore();
  const { data: credits } = useCreditStatus();
  const updateForm = useUpdateForm();

  const generate = useCallback(
    async (prompt: string) => {
      if (credits && credits.limit === 0) {
        setError("AI credits exhausted. Please upgrade to Pro or wait for reset.");
        setMode("manual");
        return;
      }

      setIsGenerating(true);
      setError(null);

      const params = new URLSearchParams({ prompt });
      const es = new EventSource(`${AI_API_URL}/api/ai/generate?${params}`);
      eventSourceRef.current = es;

      let content = "";

      es.addEventListener("schema_delta", (e) => {
        try {
          const delta = JSON.parse(e.data);
          content += delta.text || "";
        } catch {}
      });

      es.addEventListener("done", async () => {
        es.close();
        setIsGenerating(false);

        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const schema = JSON.parse(jsonMatch[0]) as FormSchema;
            setSchema(schema);
            if (formId) {
              await updateForm.mutateAsync({ formId, schema });
            }
          }
        } catch {
          setError("Failed to parse generated form. Please try again.");
        }
      });

      es.onerror = () => {
        es.close();
        setIsGenerating(false);
        setError("Connection error. Please try again.");
      };
    },
    [credits, formId, setSchema, setMode, updateForm]
  );

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    setIsGenerating(false);
  }, []);

  return { generate, stop, isGenerating, error };
}

export function useFormModification(formId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { setSchema } = useFormStore();
  const updateForm = useUpdateForm();

  const modify = useCallback(
    async (prompt: string, currentSchema: FormSchema, selectedFieldId?: string) => {
      setIsGenerating(true);
      setError(null);

      // Use fetch with POST for SSE
      const response = await fetch(`${AI_API_URL}/api/ai/modify`, {
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
