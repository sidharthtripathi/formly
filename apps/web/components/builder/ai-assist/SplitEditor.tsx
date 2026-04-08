"use client";

import { SplitSquareHorizontal, Loader2 } from "lucide-react";
import { PromptPanel } from "./PromptPanel";
import { FormPreview } from "./FormPreview";
import { useFormStore } from "@/stores/formStore";
import { motion, AnimatePresence } from "framer-motion";

interface SplitEditorProps {
  formId: string;
  initialMessage?: string | null;
  isLocked?: boolean;
}

export function SplitEditor({ formId, initialMessage, isLocked = false }: SplitEditorProps) {
  const { schema, selectedFieldId, selectField, isGenerating } = useFormStore();

  return (
    <div className="flex h-[calc(100vh-57px)]">
      {/* Left Panel - AI Chat */}
      <div className="w-2/5 border-r flex flex-col bg-background">
        <PromptPanel formId={formId} initialMessage={initialMessage} isLocked={isLocked} />
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1 overflow-auto bg-muted/30 relative">
        <FormPreview
          schema={schema}
          onFieldClick={(fieldId) => selectField(fieldId)}
          selectedFieldId={selectedFieldId}
          isEditable={false}
          isLocked={isLocked || isGenerating}
        />

        {/* Loading Overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-[1.5px]"
            >
              <div className="flex flex-col items-center gap-3 p-6 bg-background/80 rounded-xl border shadow-sm backdrop-blur-md">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="font-medium text-sm text-foreground">
                  AI is updating your form...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
