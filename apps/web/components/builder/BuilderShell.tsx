"use client";

import { useState } from "react";
import { useFormStore } from "@/stores/formStore";
import { SplitEditor } from "./ai-assist/SplitEditor";
import { ManualEditor } from "./manual/ManualEditor";
import { ModeToggle } from "./ModeToggle";
import { CreditsBanner } from "./CreditsBanner";
import { CreditsCounter } from "./CreditsCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublishModal } from "./shared/PublishModal";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

interface BuilderShellProps {
  formId: string;
  initialSchema?: import("@formly/shared/types/form-schema").FormSchema;
}

export function BuilderShell({ formId, initialSchema }: BuilderShellProps) {
  const { schema, builderMode } = useFormStore();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showPublishModal, setShowPublishModal] = useState(false);

  const currentSchema = schema || initialSchema;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <span className="font-bold text-xl flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-primary" />
              formly
            </span>
            <Input
              type="text"
              defaultValue={currentSchema?.title || ""}
              placeholder="Untitled Form"
              className="bg-transparent border-0 text-lg font-medium focus:outline-none focus:ring-0 w-auto min-w-[200px] h-8"
            />
            <AnimatePresence mode="wait">
              {saveStatus === "saving" && (
                <motion.span
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs text-muted-foreground flex items-center gap-1"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </motion.span>
              )}
              {saveStatus === "saved" && (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs text-green-600 flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
            <CreditsCounter />
            <ModeToggle />
            <Button onClick={() => setShowPublishModal(true)} size="sm">
              Publish
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Credit Exhausted Banner */}
      <CreditsBanner />

      {/* Main Content */}
      <motion.div
        key={builderMode}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex-1"
      >
        {builderMode === "ai" ? (
          <SplitEditor formId={formId} />
        ) : (
          <ManualEditor formId={formId} />
        )}
      </motion.div>

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <PublishModal
            formId={formId}
            open={showPublishModal}
            onClose={() => setShowPublishModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
