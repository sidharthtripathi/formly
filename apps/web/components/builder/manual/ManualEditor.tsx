"use client";

import { useState } from "react";
import { useFormStore } from "@/stores/formStore";
import { FieldList } from "./FieldList";
import { PropertyPanel } from "./PropertyPanel";
import { PageTabs } from "./PageTabs";

interface ManualEditorProps {
  formId: string;
}

export function ManualEditor({ formId }: ManualEditorProps) {
  const { schema, selectedFieldId } = useFormStore();

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>No form loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Field List - Left */}
      <div className="w-1/2 border-r flex flex-col bg-background">
        <PageTabs />
        <FieldList formId={formId} />
      </div>

      {/* Property Panel - Right */}
      <div className="w-1/2 overflow-auto bg-muted/20">
        {selectedFieldId ? (
          <PropertyPanel fieldId={selectedFieldId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Select a field to edit its properties
          </div>
        )}
      </div>
    </div>
  );
}
