"use client";

import { useState } from "react";
import { useCreditStatus } from "@/hooks/useUser";
import { useFormStore } from "@/stores/formStore";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle } from "lucide-react";

export function CreditsBanner() {
  const { data: credits } = useCreditStatus();
  const { switchToManualDueToCredits } = useFormStore();
  const [dismissed, setDismissed] = useState(false);

  if (!credits || credits.limit === -1) return null;
  if (credits.used < credits.limit && credits.limit !== 0) return null;
  if (dismissed) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-yellow-800">
        <AlertTriangle className="w-4 h-4" />
        <span>
          You&apos;ve used all your AI credits for this month.
          You&apos;re now in Manual Mode.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100"
          onClick={() => switchToManualDueToCredits()}
        >
          Upgrade to Pro →
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-800 hover:text-yellow-900 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
