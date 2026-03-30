"use client";

import { SplitSquareHorizontal } from "lucide-react";
import { PromptPanel } from "./PromptPanel";
import { FormPreview } from "./FormPreview";
import { useFormStore } from "@/stores/formStore";

interface SplitEditorProps {
  formId: string;
}

export function SplitEditor({ formId }: SplitEditorProps) {
  const { schema, selectedFieldId, selectField } = useFormStore();

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Left Panel - AI Chat */}
      <div className="w-2/5 border-r flex flex-col bg-background">
        <PromptPanel formId={formId} />
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1 overflow-auto bg-muted/30">
        <FormPreview
          schema={schema}
          onFieldClick={(fieldId) => selectField(fieldId)}
          selectedFieldId={selectedFieldId}
          isEditable={false}
        />
      </div>
    </div>
  );
}
