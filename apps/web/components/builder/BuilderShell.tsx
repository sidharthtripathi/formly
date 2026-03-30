"use client";

import { useState } from "react";
import { useFormStore } from "@/stores/formStore";
import { SplitEditor } from "./ai-assist/SplitEditor";
import { ManualEditor } from "./manual/ManualEditor";
import { ModeToggle } from "./ModeToggle";
import { CreditsBanner } from "./CreditsBanner";
import { CreditsCounter } from "./CreditsCounter";
import { Button } from "@/components/ui/button";
import { PublishModal } from "./shared/PublishModal";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";

interface BuilderShellProps {
  formId: string;
  initialSchema?: import("@formly/shared/types/form-schema").FormSchema;
}

export function BuilderShell({ formId, initialSchema }: BuilderShellProps) {
  const { schema, builderMode, isGenerating } = useFormStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showPublishModal, setShowPublishModal] = useState(false);

  const currentSchema = schema || initialSchema;

  const handleSave = async () => {
    if (!currentSchema) return;
    setSaveStatus("saving");
    try {
      // Save will be handled by the useUpdateForm hook
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <span className="font-bold text-xl">formly</span>
            <input
              type="text"
              defaultValue={currentSchema?.title || ""}
              placeholder="Untitled Form"
              className="bg-transparent border-0 text-lg font-medium focus:outline-none focus:ring-0 w-auto min-w-[200px]"
              onBlur={(e) => {
                // Update title in store
              }}
            />
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <CreditsCounter />
            <ModeToggle />
            <Button onClick={() => setShowPublishModal(true)} size="sm">
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Credit Exhausted Banner */}
      <CreditsBanner />

      {/* Main Content */}
      <div className="flex-1">
        {builderMode === "ai" ? (
          <SplitEditor formId={formId} />
        ) : (
          <ManualEditor formId={formId} />
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishModal
          formId={formId}
          open={showPublishModal}
          onClose={() => setShowPublishModal(false)}
        />
      )}
    </div>
  );
}
