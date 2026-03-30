import { useState, useCallback, useRef } from "react";
import { useCreditStatus, useUpdateForm } from "./useUser";
import { useFormStore } from "@/stores/formStore";
import type { FormSchema } from "@formly/shared/types/form-schema";

export function useFormGeneration(formId: string) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { applyDelta, setSchema, setMode } = useFormStore();
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
      const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate?${params}`);
      eventSourceRef.current = es;

      let content = "";

      es.addEventListener("schema_delta", (e) => {
        try {
          const delta = JSON.parse(e.data);
          content += delta.type || delta.text || "";
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
        } catch (err) {
          setError("Failed to parse generated form. Please try again.");
        }
      });

      es.onerror = () => {
        es.close();
        setIsGenerating(false);
        setError("Connection error. Please try again.");
      };
    },
    [credits, formId, applyDelta, setSchema, setMode, updateForm]
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

      const es = new EventSource(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ai/modify?prompt=${encodeURIComponent(prompt)}&currentSchema=${encodeURIComponent(JSON.stringify(currentSchema))}&selectedFieldId=${encodeURIComponent(selectedFieldId || "")}`
      );
      eventSourceRef.current = es;

      let content = "";

      es.addEventListener("data", (e) => {
        try {
          const delta = JSON.parse(e.data);
          content += delta.type || delta.text || "";
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
          setError("Failed to parse modified form. Please try again.");
        }
      });

      es.onerror = () => {
        es.close();
        setIsGenerating(false);
        setError("Connection error. Please try again.");
      };
    },
    [formId, setSchema, updateForm]
  );

  const stop = useCallback(() => {
    eventSourceRef.current?.close();
    setIsGenerating(false);
  }, []);

  return { modify, stop, isGenerating, error };
}
