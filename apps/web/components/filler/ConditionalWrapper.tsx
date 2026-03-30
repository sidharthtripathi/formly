"use client";

import type { ConditionalRule, FormField } from "@formly/shared/types/form-schema";

export function evaluateConditions(
  rules: ConditionalRule[],
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

interface ConditionalWrapperProps {
  field: FormField;
  answers: Record<string, unknown>;
  children: React.ReactNode;
}

export function ConditionalWrapper({ field, answers, children }: ConditionalWrapperProps) {
  const conditions = field.conditions;

  if (!conditions || conditions.length === 0) {
    return <>{children}</>;
  }

  const shouldShow = evaluateConditions(conditions, answers);

  if (!shouldShow) {
    return null;
  }

  return <>{children}</>;
}
