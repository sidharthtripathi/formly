"use client";

import { useFormStore } from "@/stores/formStore";
import { cn } from "@/lib/utils";
import { Bot, Pencil } from "lucide-react";

export function ModeToggle() {
  const { builderMode, setMode } = useFormStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <button
        onClick={() => setMode("ai")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          builderMode === "ai"
            ? "bg-background shadow-sm text-primary"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Bot className="w-4 h-4" />
        <span>AI Assist</span>
      </button>
      <button
        onClick={() => setMode("manual")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          builderMode === "manual"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Pencil className="w-4 h-4" />
        <span>Manual</span>
      </button>
    </div>
  );
}
