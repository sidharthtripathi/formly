"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ConditionalRule, FormSchema } from "@formly/shared/types/form-schema";

interface ConditionRuleEditorProps {
  fieldId: string;
  conditions: ConditionalRule[];
  schema: FormSchema;
  onChange: (conditions: ConditionalRule[]) => void;
}

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
] as const;

const ACTIONS = [
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
  { value: "require", label: "Require" },
  { value: "jump_to_page", label: "Jump to page" },
] as const;

export function ConditionRuleEditor({
  fieldId,
  conditions,
  schema,
  onChange,
}: ConditionRuleEditorProps) {
  const [isAdding, setIsAdding] = useState(false);

  const otherFields = schema.fields.filter(
    (f) => f.id !== fieldId && f.type !== "page_break" && f.type !== "section_header" && f.type !== "statement"
  );

  const addRule = () => {
    if (otherFields.length === 0) return;

    const newRule: ConditionalRule = {
      fieldId: otherFields[0].id,
      operator: "equals",
      value: "",
      action: "show",
      targetId: fieldId,
    };
    onChange([...conditions, newRule]);
    setIsAdding(false);
  };

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onChange(newConditions);
  };

  const deleteRule = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const sourceField = (id: string) => schema.fields.find((f) => f.id === id);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Conditional Logic</label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          disabled={otherFields.length === 0 || isAdding}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Rule
        </Button>
      </div>

      {conditions.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground">No rules yet</p>
      )}

      {conditions.map((rule, idx) => {
        const sourceFieldData = sourceField(rule.fieldId);
        return (
          <div key={idx} className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Rule {idx + 1}
              </span>
              <button
                onClick={() => deleteRule(idx)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">If</span>
                <select
                  value={rule.fieldId}
                  onChange={(e) => updateRule(idx, { fieldId: e.target.value })}
                  className="w-full mt-1 h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  {otherFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-muted-foreground">Operator</span>
                <select
                  value={rule.operator}
                  onChange={(e) => updateRule(idx, { operator: e.target.value as ConditionalRule["operator"] })}
                  className="w-full mt-1 h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {rule.operator !== "is_empty" && rule.operator !== "is_not_empty" && (
                <div>
                  <span className="text-muted-foreground">Value</span>
                  {sourceFieldData?.options ? (
                    <select
                      value={String(rule.value)}
                      onChange={(e) => updateRule(idx, { value: e.target.value })}
                      className="w-full mt-1 h-8 rounded border border-input bg-background px-2 text-xs"
                    >
                      <option value="">Select...</option>
                      {sourceFieldData.options.map((opt) => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(rule.value)}
                      onChange={(e) => updateRule(idx, { value: e.target.value })}
                      className="w-full mt-1 h-8 rounded border border-input bg-background px-2 text-xs"
                      placeholder="Value"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Then</span>
                <select
                  value={rule.action}
                  onChange={(e) => updateRule(idx, { action: e.target.value as ConditionalRule["action"] })}
                  className="w-full mt-1 h-8 rounded border border-input bg-background px-2 text-xs"
                >
                  {ACTIONS.map((act) => (
                    <option key={act.value} value={act.value}>
                      {act.label}
                    </option>
                  ))}
                </select>
              </div>

              {rule.action === "jump_to_page" ? (
                <div>
                  <span className="text-muted-foreground">Page</span>
                  <select
                    value={rule.targetId}
                    onChange={(e) => updateRule(idx, { targetId: e.target.value })}
                    className="w-full mt-1 h-8 rounded border border-input bg-background px-2 text-xs"
                  >
                    {schema.pages.map((p, i) => (
                      <option key={p.id} value={p.id}>
                        {p.title || `Page ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground italic">
              {rule.action === "show" ? "Show this field" : rule.action === "hide" ? "Hide this field" : rule.action === "require" ? "Make this field required" : "Jump to page"} when {sourceFieldData?.label || "field"} {rule.operator.replace("_", " ")} {rule.operator === "is_empty" || rule.operator === "is_not_empty" ? "" : String(rule.value)}
            </p>
          </div>
        );
      })}

      {isAdding && (
        <Button variant="outline" size="sm" onClick={addRule}>
          <Plus className="w-4 h-4 mr-1" />
          Add Condition
        </Button>
      )}
    </div>
  );
}
