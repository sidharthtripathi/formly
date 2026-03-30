"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, Code, Columns, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmbedModalProps {
  formId: string;
  publicSlug?: string;
  open: boolean;
  onClose: () => void;
}

export function EmbedModal({ formId, publicSlug, open, onClose }: EmbedModalProps) {
  const [embedType, setEmbedType] = useState<"iframe" | "js" | "link">("iframe");
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl = `${baseUrl}/f/${publicSlug}`;

  const iframeCode = `<iframe
  src="${formUrl}"
  width="100%"
  height="600"
  frameborder="0"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  allow="clipboard-write"
></iframe>`;

  const jsCode = `<div id="formly-embed-${formId}"></div>
<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${baseUrl}/embed.js';
    script.setAttribute('data-form-id', '${formId}');
    script.onload = function() {
      FormlyEmbed.init('#formly-embed-${formId}', '${formUrl}');
    };
    document.head.appendChild(script);
  })();
</script>`;

  const linkCode = formUrl;

  const getCode = () => {
    switch (embedType) {
      case "iframe": return iframeCode;
      case "js": return jsCode;
      case "link": return linkCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embed Form</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Embed Type Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {[
              { value: "iframe", label: "iFrame", icon: Columns },
              { value: "js", label: "JavaScript", icon: Code },
              { value: "link", label: "Link", icon: LinkIcon },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setEmbedType(value as typeof embedType)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  embedType === value
                    ? "bg-background shadow-sm"
                    : "hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Code Preview */}
          <div className="relative">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-64">
              <code>{getCode()}</code>
            </pre>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Options */}
          {embedType === "iframe" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Width</label>
                <Input defaultValue="100%" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Height (px)</label>
                <Input type="number" defaultValue="600" className="mt-1" />
              </div>
            </div>
          )}

          {/* Preview Link */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">Live preview:</p>
            <a
              href={formUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {formUrl}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
