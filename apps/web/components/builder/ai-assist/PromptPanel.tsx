"use client";

import { useState, useRef, useEffect } from "react";
import { useFormStore } from "@/stores/formStore";
import { useCreditStatus } from "@/hooks/useUser";
import { useFormModification } from "@/hooks/useAI";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Square, Loader2, X } from "lucide-react";

interface PromptPanelProps {
  formId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function PromptPanel({ formId }: PromptPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [taggedFields, setTaggedFields] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { schema, selectedFieldId, selectField } = useFormStore();
  const { data: credits } = useCreditStatus();
  const { modify, stop, isGenerating, error } = useFormModification(formId);

  const canUseAI = !credits || credits.limit === -1 || credits.used < credits.limit;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedFieldId && !taggedFields.includes(selectedFieldId)) {
      const field = schema?.fields.find((f) => f.id === selectedFieldId);
      if (field) {
        setInput((prev) => `${prev} @${field.label}`.trim());
        setTaggedFields((prev) => [...prev, selectedFieldId]);
      }
    }
  }, [selectedFieldId, schema]);

  const handleSend = () => {
    if (!input.trim() || isGenerating || !schema) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    modify(input, schema, taggedFields.join(","));
    setInput("");
    setTaggedFields([]);
    selectField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeTaggedField = (fieldId: string) => {
    setTaggedFields((prev) => prev.filter((id) => id !== fieldId));
    const field = schema?.fields.find((f) => f.id === fieldId);
    if (field) {
      setInput((prev) => prev.replace(`@${field.label}`, "").trim());
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation History */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-20">
            <p>Describe your form or click on fields to modify them.</p>
            <p className="mt-2">Use @fieldname to target specific fields.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                {msg.role === "assistant" ? "🤖" : "👤"}
                <span>
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI is editing your form...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Tagged Fields */}
      {taggedFields.length > 0 && (
        <div className="px-4 py-2 border-t flex flex-wrap gap-1">
          {taggedFields.map((fieldId) => {
            const field = schema?.fields.find((f) => f.id === fieldId);
            if (!field) return null;
            return (
              <span
                key={fieldId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs"
              >
                @{field.label}
                <button
                  onClick={() => removeTaggedField(fieldId)}
                  className="hover:text-primary/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t space-y-2">
        {!canUseAI && (
          <div className="text-xs text-center text-destructive mb-2">
            AI credits exhausted. Switch to Manual Mode or upgrade to Pro.
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              canUseAI
                ? "Describe changes or click a field to tag it..."
                : "Credits exhausted"
            }
            disabled={!canUseAI || isGenerating}
            className="flex-1 min-h-[60px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex flex-col gap-1">
            {isGenerating ? (
              <Button
                size="icon"
                variant="outline"
                onClick={stop}
                className="flex-shrink-0"
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || !canUseAI}
                className="flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
