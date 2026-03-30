"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FieldRenderer } from "@/components/builder/shared/FieldRenderer";
import { ConditionalWrapper } from "./ConditionalWrapper";
import { ProgressBar } from "./ProgressBar";
import { Button } from "@/components/ui/button";
import type { FormSchema, FormField } from "@formly/shared/types/form-schema";
import { useSubmitResponse } from "@/hooks/useResponses";
import { validateFieldValue } from "@formly/shared/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface PageRendererProps {
  schema: FormSchema;
  formId: string;
  isAnonymous: boolean;
}

export function PageRenderer({ schema, formId, isAnonymous }: PageRendererProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();
  const submitResponse = useSubmitResponse();

  const pages = schema.pages.length > 0 ? schema.pages : [{ id: "default", index: 0, title: "" }];
  const totalPages = pages.length;

  const currentPageFields = schema.fields
    .filter((f) => f.pageIndex === currentPage && f.type !== "page_break" && f.type !== "hidden_field" && f.type !== "section_header" && f.type !== "statement")
    .sort((a, b) => a.order - b.order);

  const visibleFields = currentPageFields.filter((f) => {
    const conditions = f.conditions;
    if (!conditions || conditions.length === 0) return true;
    return evaluateConditions(conditions, answers);
  });

  const validatePage = (): boolean => {
    const newErrors: Record<string, string> = {};
    visibleFields.forEach((field) => {
      const result = validateFieldValue(field.type, answers[field.id], field.required);
      if (!result.valid) {
        newErrors[field.id] = result.error || "Invalid value";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage()) {
      setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
    }
  };

  const handlePrev = () => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validatePage()) return;

    setIsSubmitting(true);
    try {
      await submitResponse.mutateAsync({
        formId,
        answers,
        metadata: {
          userAgent: navigator.userAgent,
          submittedAt: new Date().toISOString(),
        },
        respondentId: isAnonymous ? undefined : undefined,
      });
      setIsComplete(true);
    } catch {
      setErrors({ _submit: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }, [errors]);

  if (isComplete) {
    return (
      <div className="text-center space-y-4 py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">{schema.settings?.successMessage || "Thank you!"}</h2>
        {schema.settings?.redirectUrl && (
          <p className="text-muted-foreground">Redirecting...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {totalPages > 1 && schema.settings?.showProgressBar !== false && (
        <ProgressBar current={currentPage + 1} total={totalPages} />
      )}

      <div className="space-y-6">
        {visibleFields.map((field) => (
          <ConditionalWrapper key={field.id} field={field} answers={answers}>
            <FieldRenderer
              field={field}
              value={answers[field.id]}
              onChange={(val) => handleFieldChange(field.id, val)}
              error={errors[field.id]}
            />
          </ConditionalWrapper>
        ))}
      </div>

      {errors._submit && (
        <p className="text-sm text-destructive">{errors._submit}</p>
      )}

      <div className="flex justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={currentPage === 0 || isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {currentPage < totalPages - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
            {!isSubmitting && <Check className="w-4 h-4 ml-1" />}
          </Button>
        )}
      </div>
    </div>
  );
}

function evaluateConditions(
  rules: import("@formly/shared/types/form-schema").ConditionalRule[],
  answers: Record<string, unknown>
): boolean {
  return rules.every((rule) => {
    const fieldValue = answers[rule.fieldId];
    let matches = false;

    switch (rule.operator) {
      case "equals":
        matches = String(fieldValue) === String(rule.value);
        break;
      case "not_equals":
        matches = String(fieldValue) !== String(rule.value);
        break;
      case "contains":
        matches = String(fieldValue).includes(String(rule.value));
        break;
      case "greater_than":
        matches = Number(fieldValue) > Number(rule.value);
        break;
      case "less_than":
        matches = Number(fieldValue) < Number(rule.value);
        break;
      case "is_empty":
        matches = fieldValue === undefined || fieldValue === null || fieldValue === "";
        break;
      case "is_not_empty":
        matches = fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
        break;
    }

    return matches;
  });
}
