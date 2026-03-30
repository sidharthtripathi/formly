"use client";

import { useState } from "react";
import { useFormStore } from "@/stores/formStore";
import { Button } from "@/components/ui/button";
import type { FieldType } from "@formly/shared/types/form-schema";
import { Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddFieldMenuProps {
  pageIndex: number;
}

const FIELD_GROUPS = [
  {
    label: "Text Inputs",
    fields: [
      { type: "short_text" as FieldType, label: "Short Text", icon: "Aa" },
      { type: "long_text" as FieldType, label: "Long Text", icon: "¶" },
      { type: "email" as FieldType, label: "Email", icon: "@" },
      { type: "phone" as FieldType, label: "Phone", icon: "#" },
      { type: "url" as FieldType, label: "URL", icon: "🔗" },
      { type: "number" as FieldType, label: "Number", icon: "#" },
      { type: "password" as FieldType, label: "Password", icon: "***" },
    ],
  },
  {
    label: "Selection",
    fields: [
      { type: "single_choice" as FieldType, label: "Single Choice", icon: "○" },
      { type: "multiple_choice" as FieldType, label: "Multiple Choice", icon: "☐" },
      { type: "dropdown" as FieldType, label: "Dropdown", icon: "▾" },
      { type: "multi_select_dropdown" as FieldType, label: "Multi-Select", icon: "☰" },
      { type: "yes_no" as FieldType, label: "Yes/No", icon: "✓" },
      { type: "rating" as FieldType, label: "Rating", icon: "★" },
      { type: "nps" as FieldType, label: "NPS", icon: "0-10" },
      { type: "likert_scale" as FieldType, label: "Likert Scale", icon: "¹-⁵" },
      { type: "ranking" as FieldType, label: "Ranking", icon: "↕" },
    ],
  },
  {
    label: "Date & Time",
    fields: [
      { type: "date" as FieldType, label: "Date", icon: "📅" },
      { type: "time" as FieldType, label: "Time", icon: "🕐" },
      { type: "date_time" as FieldType, label: "Date & Time", icon: "📆" },
      { type: "date_range" as FieldType, label: "Date Range", icon: "↔" },
    ],
  },
  {
    label: "Media & File",
    fields: [
      { type: "file_upload" as FieldType, label: "File Upload", icon: "📎" },
      { type: "image_upload" as FieldType, label: "Image Upload", icon: "🖼" },
      { type: "signature" as FieldType, label: "Signature", icon: "✍" },
    ],
  },
  {
    label: "Layout",
    fields: [
      { type: "section_header" as FieldType, label: "Section Header", icon: "§" },
      { type: "statement" as FieldType, label: "Statement", icon: "ℹ" },
      { type: "page_break" as FieldType, label: "Page Break", icon: "⎄" },
    ],
  },
  {
    label: "Advanced",
    fields: [
      { type: "matrix" as FieldType, label: "Matrix", icon: "⊞" },
      { type: "slider" as FieldType, label: "Slider", icon: "⟷" },
      { type: "address" as FieldType, label: "Address", icon: "🏠" },
      { type: "hidden_field" as FieldType, label: "Hidden Field", icon: "👁" },
      { type: "calculated_field" as FieldType, label: "Calculated", icon: "∑" },
    ],
  },
];

export function AddFieldMenu({ pageIndex }: AddFieldMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { addField } = useFormStore();

  const handleAddField = (type: FieldType) => {
    addField(type, pageIndex);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Field
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-[300px] overflow-auto">
          {FIELD_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">
                {group.label}
              </div>
              {group.fields.map((field) => (
                <button
                  key={field.type}
                  onClick={() => handleAddField(field.type)}
                  className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                >
                  <span className="w-6 text-center text-muted-foreground">{field.icon}</span>
                  <span>{field.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
