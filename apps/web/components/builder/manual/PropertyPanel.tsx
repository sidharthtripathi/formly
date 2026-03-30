"use client";

import { useState } from "react";
import { useFormStore } from "@/stores/formStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OptionsEditor } from "./OptionsEditor";
import { ConditionRuleEditor } from "./ConditionRuleEditor";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldType, FieldOption } from "@formly/shared/types/form-schema";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
  { value: "number", label: "Number" },
  { value: "password", label: "Password" },
  { value: "single_choice", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multi_select_dropdown", label: "Multi-Select" },
  { value: "yes_no", label: "Yes/No" },
  { value: "rating", label: "Rating" },
  { value: "nps", label: "NPS" },
  { value: "likert_scale", label: "Likert Scale" },
  { value: "ranking", label: "Ranking" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "date_time", label: "Date & Time" },
  { value: "date_range", label: "Date Range" },
  { value: "file_upload", label: "File Upload" },
  { value: "image_upload", label: "Image Upload" },
  { value: "signature", label: "Signature" },
  { value: "section_header", label: "Section Header" },
  { value: "statement", label: "Statement" },
  { value: "page_break", label: "Page Break" },
  { value: "matrix", label: "Matrix" },
  { value: "slider", label: "Slider" },
  { value: "address", label: "Address" },
  { value: "hidden_field", label: "Hidden Field" },
  { value: "calculated_field", label: "Calculated Field" },
];

interface PropertyPanelProps {
  fieldId: string;
}

export function PropertyPanel({ fieldId }: PropertyPanelProps) {
  const { schema, updateField, deleteField } = useFormStore();
  const field = schema?.fields.find((f) => f.id === fieldId);

  if (!field) return null;

  const hasOptions = ["single_choice", "multiple_choice", "dropdown", "multi_select_dropdown", "ranking"].includes(field.type);
  const hasScale = ["rating", "nps", "likert_scale"].includes(field.type);
  const hasMatrix = field.type === "matrix";
  const hasSlider = field.type === "slider";
  const hasFileValidation = ["file_upload", "image_upload"].includes(field.type);
  const hasLengthValidation = ["short_text", "long_text"].includes(field.type);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Edit: {field.label || "Untitled Field"}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => deleteField(fieldId)}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>

      {/* Field Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Field Type</label>
        <select
          value={field.type}
          onChange={(e) => updateField(fieldId, { type: e.target.value as FieldType })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {FIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Label</label>
        <Input
          value={field.label}
          onChange={(e) => updateField(fieldId, { label: e.target.value })}
          placeholder="Field label"
        />
      </div>

      {/* Placeholder */}
      {["short_text", "long_text", "email", "phone", "url", "number", "password"].includes(field.type) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Placeholder</label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => updateField(fieldId, { placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </div>
      )}

      {/* Help Text */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Help Text</label>
        <Input
          value={field.helpText || ""}
          onChange={(e) => updateField(fieldId, { helpText: e.target.value })}
          placeholder="Optional help text"
        />
      </div>

      {/* Required */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={field.required}
          onChange={(e) => updateField(fieldId, { required: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        <label htmlFor="required" className="text-sm font-medium">Required</label>
      </div>

      {/* Options Editor */}
      {hasOptions && (
        <OptionsEditor
          options={field.options || []}
          onChange={(options) => updateField(fieldId, { options })}
        />
      )}

      {/* Rating Max */}
      {field.type === "rating" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Max Rating</label>
          <select
            value={field.ratingMax || 5}
            onChange={(e) => updateField(fieldId, { ratingMax: Number(e.target.value) })}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value={5}>5 Stars</option>
            <option value={10}>10 Stars</option>
          </select>
        </div>
      )}

      {/* Matrix Rows/Columns */}
      {hasMatrix && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Row Labels (comma-separated)</label>
            <Input
              value={(field.matrixRows || []).join(", ")}
              onChange={(e) => updateField(fieldId, { matrixRows: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="Row 1, Row 2, Row 3"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Column Labels (comma-separated)</label>
            <Input
              value={(field.matrixColumns || []).join(", ")}
              onChange={(e) => updateField(fieldId, { matrixColumns: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="Column 1, Column 2, Column 3"
            />
          </div>
        </>
      )}

      {/* Slider Min/Max */}
      {hasSlider && (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Min</label>
            <Input
              type="number"
              value={field.sliderMin ?? 0}
              onChange={(e) => updateField(fieldId, { sliderMin: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max</label>
            <Input
              type="number"
              value={field.sliderMax ?? 100}
              onChange={(e) => updateField(fieldId, { sliderMax: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Step</label>
            <Input
              type="number"
              value={field.sliderStep ?? 1}
              onChange={(e) => updateField(fieldId, { sliderStep: Number(e.target.value) })}
            />
          </div>
        </div>
      )}

      {/* File Validation */}
      {hasFileValidation && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Size (MB)</label>
            <Input
              type="number"
              value={field.validation?.maxFileSizeMb ?? 10}
              onChange={(e) => updateField(fieldId, {
                validation: { ...field.validation, maxFileSizeMb: Number(e.target.value) }
              })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Allowed Types</label>
            <Input
              value={(field.validation?.allowedFileTypes || []).join(", ")}
              onChange={(e) => updateField(fieldId, {
                validation: { ...field.validation, allowedFileTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }
              })}
              placeholder=".pdf, .png, .jpg"
            />
          </div>
        </div>
      )}

      {/* Text Length Validation */}
      {hasLengthValidation && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Min Length</label>
            <Input
              type="number"
              value={field.validation?.minLength ?? ""}
              onChange={(e) => updateField(fieldId, {
                validation: { ...field.validation, minLength: e.target.value ? Number(e.target.value) : undefined }
              })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Length</label>
            <Input
              type="number"
              value={field.validation?.maxLength ?? ""}
              onChange={(e) => updateField(fieldId, {
                validation: { ...field.validation, maxLength: e.target.value ? Number(e.target.value) : undefined }
              })}
            />
          </div>
        </div>
      )}

      {/* Hidden Field Default Value */}
      {field.type === "hidden_field" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Default Value</label>
          <Input
            value={field.hiddenDefaultValue || ""}
            onChange={(e) => updateField(fieldId, { hiddenDefaultValue: e.target.value })}
            placeholder="{{url_param}} for URL parameter"
          />
        </div>
      )}

      {/* Conditional Logic */}
      <ConditionRuleEditor
        fieldId={fieldId}
        conditions={field.conditions || []}
        schema={schema!}
        onChange={(conditions) => updateField(fieldId, { conditions })}
      />
    </div>
  );
}
