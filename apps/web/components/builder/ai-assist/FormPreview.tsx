"use client";

import { useFormStore } from "@/stores/formStore";
import { FieldRenderer } from "@/components/builder/shared/FieldRenderer";
import { PageRenderer } from "@/components/filler/PageRenderer";
import { cn } from "@/lib/utils";
import type { FormSchema, FormField } from "@formly/shared/types/form-schema";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface FormPreviewProps {
  schema: FormSchema | null;
  onFieldClick?: (fieldId: string) => void;
  selectedFieldId?: string | null;
  isEditable?: boolean;
  isLocked?: boolean;
}

export function FormPreview({
  schema,
  onFieldClick,
  selectedFieldId,
  isEditable = false,
  isLocked = false,
}: FormPreviewProps) {
  const { deleteField, streamedFields, isGenerating } = useFormStore();

  // Combine schema fields with streamed fields for real-time display
  const [displayFields, setDisplayFields] = useState<FormField[]>([]);

  useEffect(() => {
    if (schema?.fields && schema.fields.length > 0) {
      // Use schema fields as the source of truth once we have them
      setDisplayFields(schema.fields);
    } else if (streamedFields.length > 0) {
      // Show streamed fields in real-time before full schema is ready
      setDisplayFields(streamedFields);
    }
  }, [schema, streamedFields]);

  if (!schema && streamedFields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Start typing a prompt to generate your form</p>
        </div>
      </div>
    );
  }

  // If we have a complete schema, use the original rendering logic
  if (schema && schema.fields && schema.fields.length > 0) {
    // If multi-page, show simplified preview
    if (schema.pages && schema.pages.length > 1) {
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
                    isEditable && !isLocked && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => {
                    if (isEditable && !isLocked && onFieldClick) {
                      onFieldClick(field.id);
                    }
                  }}
                >
                  {/* Mini Toolbar (visible on hover) */}
                  {isEditable && !isLocked && (
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

  // Real-time streaming mode: show fields as they arrive
  return (
    <div className="p-6">
      <div className="bg-background rounded-lg border shadow-sm p-6 max-w-xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold">
            {schema?.title || streamedFields[0]?.label || "Generating form..."}
          </h2>
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>AI is building your form...</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {displayFields
            .filter((f) => f.type !== "page_break")
            .sort((a, b) => {
              if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex;
              return a.order - b.order;
            })
            .map((field, index) => {
              const isSelected = field.id === selectedFieldId;
              const isNewlyAdded = index === displayFields.length - 1 && isGenerating;

              if (field.type === "section_header") {
                return (
                  <div key={field.id} className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                    <h3 className="text-lg font-semibold">{field.label}</h3>
                    {field.helpText && (
                      <p className="text-sm text-muted-foreground">{field.helpText}</p>
                    )}
                  </div>
                );
              }

              if (field.type === "statement") {
                return (
                  <p key={field.id} className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
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
                    isNewlyAdded && "animate-in ring-2 ring-primary ring-offset-2 bg-primary/5",
                    isEditable && !isLocked && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => {
                    if (isEditable && !isLocked && onFieldClick) {
                      onFieldClick(field.id);
                    }
                  }}
                >
                  {/* Streaming indicator for newly added fields */}
                  {isNewlyAdded && (
                    <div className="absolute -top-3 left-2 flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      <span>Just added</span>
                    </div>
                  )}

                  {/* Mini Toolbar (visible on hover) */}
                  {isEditable && !isLocked && (
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

          {/* Streaming skeleton for next field */}
          {isGenerating && displayFields.length > 0 && (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-10 bg-muted rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
