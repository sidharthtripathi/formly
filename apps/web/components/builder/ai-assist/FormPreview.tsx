"use client";

import { useFormStore } from "@/stores/formStore";
import { FieldRenderer } from "@/components/builder/shared/FieldRenderer";
import { ConditionalWrapper } from "@/components/filler/ConditionalWrapper";
import { PageRenderer } from "@/components/filler/PageRenderer";
import { cn } from "@/lib/utils";
import type { FormSchema } from "@formly/shared/types/form-schema";
import { Pencil, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";

interface FormPreviewProps {
  schema: FormSchema | null;
  onFieldClick?: (fieldId: string) => void;
  selectedFieldId?: string | null;
  isEditable?: boolean;
}

export function FormPreview({
  schema,
  onFieldClick,
  selectedFieldId,
  isEditable = false,
}: FormPreviewProps) {
  const { addField, deleteField } = useFormStore();

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Start typing a prompt to generate your form</p>
        </div>
      </div>
    );
  }

  // If multi-page, show simplified preview
  if (schema.pages.length > 1) {
    return (
      <div className="p-6">
        <div className="bg-background rounded-lg border shadow-sm p-6 max-w-xl mx-auto">
          <h2 className="text-xl font-bold mb-1">{schema.title}</h2>
          {schema.description && (
            <p className="text-sm text-muted-foreground mb-4">{schema.description}</p>
          )}
          <div className="text-sm text-muted-foreground mb-4">
            {schema.pages.length} pages
          </div>
          <PageRenderer
            schema={schema}
            formId="preview"
            isAnonymous={true}
          />
        </div>
      </div>
    );
  }

  const visibleFields = schema.fields
    .filter((f) => f.type !== "page_break")
    .sort((a, b) => {
      if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
      return a.order - b.order;
    });

  return (
    <div className="p-6">
      <div className="bg-background rounded-lg border shadow-sm p-6 max-w-xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">{schema.title}</h2>
          {schema.description && (
            <p className="text-sm text-muted-foreground">{schema.description}</p>
          )}
        </div>

        <div className="space-y-4">
          {visibleFields.map((field) => {
            const isSelected = field.id === selectedFieldId;

            if (field.type === "section_header") {
              return (
                <div key={field.id} className="space-y-1">
                  <h3 className="text-lg font-semibold">{field.label}</h3>
                  {field.helpText && (
                    <p className="text-sm text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              );
            }

            if (field.type === "statement") {
              return (
                <p key={field.id} className="text-sm text-muted-foreground">
                  {field.helpText || field.label}
                </p>
              );
            }

            return (
              <div
                key={field.id}
                className={cn(
                  "group relative rounded-lg transition-all",
                  isSelected && "ring-2 ring-primary ring-offset-2",
                  isEditable && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => {
                  if (isEditable && onFieldClick) {
                    onFieldClick(field.id);
                  }
                }}
              >
                {/* Mini Toolbar (visible on hover) */}
                {isEditable && (
                  <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFieldClick?.(field.id);
                      }}
                      className="p-1 bg-background border rounded shadow-sm hover:bg-accent"
                      title="Edit field"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteField(field.id);
                      }}
                      className="p-1 bg-background border rounded shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                      title="Delete field"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <FieldRenderer
                  field={field}
                  disabled
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
