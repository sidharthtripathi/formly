"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormField } from "@formly/shared/types/form-schema";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface FieldCardProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  email: "Email",
  phone: "Phone",
  url: "URL",
  number: "Number",
  password: "Password",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  dropdown: "Dropdown",
  multi_select_dropdown: "Multi-Select",
  yes_no: "Yes/No",
  rating: "Rating",
  nps: "NPS",
  likert_scale: "Likert Scale",
  ranking: "Ranking",
  date: "Date",
  time: "Time",
  date_time: "Date & Time",
  date_range: "Date Range",
  file_upload: "File Upload",
  image_upload: "Image Upload",
  signature: "Signature",
  section_header: "Section Header",
  statement: "Statement",
  page_break: "Page Break",
  matrix: "Matrix",
  slider: "Slider",
  address: "Address",
  hidden_field: "Hidden",
  calculated_field: "Calculated",
};

export function FieldCard({ field, isSelected, onSelect }: FieldCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card transition-colors cursor-pointer",
        isSelected && "border-primary ring-1 ring-primary",
        isDragging && "opacity-50 shadow-lg"
      )}
      onClick={onSelect}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {field.label || "Untitled Field"}
          </span>
          {field.required && (
            <span className="text-xs text-destructive">*</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {FIELD_TYPE_LABELS[field.type] || field.type}
        </span>
      </div>
    </div>
  );
}
