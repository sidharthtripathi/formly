"use client";

import { Loader2, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface InitialGenerationScreenProps {
  prompt: string;
  phase: "creating" | "generating";
  isStreaming?: boolean;
  onCancel: () => void;
}

export function InitialGenerationScreen({
  prompt,
  phase,
  isStreaming = false,
  onCancel,
}: InitialGenerationScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full mx-auto px-4"
      >
        <div className="text-center space-y-6">
          {/* Icon and Status */}
          <div className="flex justify-center">
            {phase === "creating" ? (
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                </div>
                {isStreaming && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            )}
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {phase === "creating" ? "Creating your form..." : "AI is building your form"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {phase === "creating"
                ? "Setting things up for you"
                : "This may take a moment. You can cancel at any time."}
            </p>
          </div>

          {/* Prompt Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-muted/50 rounded-lg border p-4 text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] text-primary-foreground font-medium">P</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Your Prompt</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{prompt}</p>
          </motion.div>

          {/* Streaming Indicator */}
          {phase === "generating" && isStreaming && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Receiving response...</span>
            </motion.div>
          )}

          {/* Cancel Button */}
          <div className="pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onCancel}
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
