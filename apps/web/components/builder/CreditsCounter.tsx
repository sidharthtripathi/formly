"use client";

import { useCreditStatus } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

export function CreditsCounter() {
  const { data: credits } = useCreditStatus();

  if (!credits) return null;

  // Pro users don't see credits
  if (credits.limit === -1) return null;

  const used = credits.used || 0;
  const limit = credits.limit || 20;
  const remaining = limit - used;
  const percent = (remaining / limit) * 100;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Credits:</span>
      <span
        className={cn(
          "font-medium",
          remaining <= 0 && "text-destructive",
          remaining > 0 && remaining <= 5 && "text-yellow-600",
          remaining > 5 && "text-green-600"
        )}
      >
        {remaining}/{limit}
      </span>
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            remaining <= 0 && "bg-destructive",
            remaining > 0 && remaining <= 5 && "bg-yellow-500",
            remaining > 5 && "bg-green-500"
          )}
          style={{ width: `${Math.max(0, percent)}%` }}
        />
      </div>
    </div>
  );
}
