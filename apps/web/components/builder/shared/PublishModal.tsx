"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePublishForm, useForm } from "@/hooks/useForms";
import { Copy, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishModalProps {
  formId: string;
  open: boolean;
  onClose: () => void;
}

export function PublishModal({ formId, open, onClose }: PublishModalProps) {
  const { data: form } = useForm(formId);
  const publishForm = usePublishForm();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [slug, setSlug] = useState(form?.publicSlug || "");
  const [copied, setCopied] = useState(false);

  const publicUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/f/${slug}` : "";

  const handlePublish = async () => {
    await publishForm.mutateAsync(formId);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateSlug = () => {
    const newSlug = `${formId.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`;
    setSlug(newSlug);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Form</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Access Control */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Who can fill this form?</label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer">
                <input
                  type="radio"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-sm">Anyone (Anonymous)</span>
                  <p className="text-xs text-muted-foreground">No login required for respondents</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer">
                <input
                  type="radio"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-sm">Authenticated Users Only</span>
                  <p className="text-xs text-muted-foreground">Respondents must sign in with Google</p>
                </div>
              </label>
            </div>
          </div>

          {/* Allow Multiple Submissions */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow-multiple"
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="allow-multiple" className="text-sm font-medium">
              Allow multiple submissions from the same person
            </label>
          </div>

          {/* Public URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Public URL</label>
            <div className="flex gap-2">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="your-form-slug"
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={handleRegenerateSlug}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            {publicUrl && (
              <p className="text-xs text-muted-foreground">
                {publicUrl}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={publishForm.isPending}>
            {publishForm.isPending ? "Publishing..." : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
