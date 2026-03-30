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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePublishForm, useForm } from "@/hooks/useForms";
import { motion } from "framer-motion";
import { Copy, RefreshCw, Check, Globe, Lock } from "lucide-react";

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
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Publish Form
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 py-4"
        >
          {/* Access Control */}
          <div className="space-y-3">
            <Label>Who can fill this form?</Label>
            <div className="space-y-2">
              <motion.label
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isAnonymous ? "bg-primary/5 border-primary" : ""
                }`}
              >
                <input
                  type="radio"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous(true)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-sm flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Anyone (Anonymous)
                  </span>
                  <p className="text-xs text-muted-foreground">No login required for respondents</p>
                </div>
              </motion.label>
              <motion.label
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  !isAnonymous ? "bg-primary/5 border-primary" : ""
                }`}
              >
                <input
                  type="radio"
                  checked={!isAnonymous}
                  onChange={() => setIsAnonymous(false)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-medium text-sm flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Authenticated Users Only
                  </span>
                  <p className="text-xs text-muted-foreground">Respondents must sign in with Google</p>
                </div>
              </motion.label>
            </div>
          </div>

          {/* Allow Multiple Submissions */}
          <div className="flex items-center justify-between">
            <Label htmlFor="allow-multiple" className="cursor-pointer">
              Allow multiple submissions from the same person
            </Label>
            <Switch
              id="allow-multiple"
              checked={allowMultiple}
              onCheckedChange={(checked) => setAllowMultiple(checked)}
            />
          </div>

          {/* Public URL */}
          <div className="space-y-2">
            <Label htmlFor="slug">Public URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {typeof window !== "undefined" ? window.location.origin : ""}/f/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="your-form-slug"
                  className="flex-1 pl-24"
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleRegenerateSlug}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>

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
