"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useCreditStatus, useUser } from "@/hooks/useUser";
import { useResponses } from "@/hooks/useResponses";
import { ChartRenderer } from "./ChartRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2, Lock, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ChartSpec } from "./ChartRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  chartSpec?: ChartSpec;
  timestamp: Date;
}

interface AnalysisChatProps {
  formId: string;
}

export function AnalysisChat({ formId }: AnalysisChatProps) {
  const { data: user } = useUser();
  const { data: credits } = useCreditStatus();
  const { data: responsesData } = useResponses(formId);

  const isPro = user?.plan === "pro";

  if (!isPro) {
    return <ProUpsell />;
  }

  return <AnalysisChatContent formId={formId} />;
}

function ProUpsell() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md p-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Pro Feature</h2>
        <p className="text-muted-foreground">
          AI-powered analysis and conversational charts are available on the Pro plan.
        </p>
        <Button>Upgrade to Pro — $12/month</Button>
      </div>
    </div>
  );
}

function AnalysisChatContent({ formId }: AnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartSpec, setChartSpec] = useState<ChartSpec | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: responsesData } = useResponses(formId);
  const { data: credits } = useCreditStatus();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const parseChartFromContent = (content: string): { text: string; chart?: ChartSpec } => {
    const chartMatch = content.match(/<chart>([\s\S]*?)<\/chart>/);
    if (chartMatch) {
      try {
        const chart = JSON.parse(chartMatch[1]) as ChartSpec;
        const text = content.replace(/<chart>[\s\S]*?<\/chart>/, "").trim();
        return { text, chart };
      } catch {
        return { text: content };
      }
    }
    return { text: content };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // In a real implementation, this would call the API
      // For now, simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const responses = responsesData?.data || [];
      const mockAnalysis = generateMockAnalysis(input, responses);

      const { text, chart } = parseChartFromContent(mockAnalysis);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: text,
        chartSpec: chart || undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (chart) setChartSpec(chart);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">AI Analysis</p>
            <p className="text-sm mt-2">
              Ask questions about your form responses in natural language.
            </p>
            <div className="mt-6 space-y-2 text-sm text-left max-w-md mx-auto">
              <p className="text-muted-foreground">Try asking:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>"What is the average rating?"</li>
                <li>"Show me a pie chart of response categories"</li>
                <li>"What percentage of responses are from last week?"</li>
              </ul>
            </div>
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
                "max-w-[70%] rounded-lg px-4 py-3 text-sm",
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

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing your responses...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chart Display */}
      {chartSpec && (
        <div className="px-4 pb-4">
          <ChartRenderer chartSpec={chartSpec} className="max-w-xl mx-auto" />
          <button
            onClick={() => setChartSpec(null)}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
          >
            <X className="w-3 h-3" />
            Dismiss chart
          </button>
        </div>
      )}

      {/* Usage Counter */}
      <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t">
        {(credits?.used || 0)} / 100 AI messages used this month
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your responses..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function generateMockAnalysis(question: string, responses: unknown[]): string {
  if (responses.length === 0) {
    return "I don't have any responses to analyze yet. Share your form to start collecting responses.";
  }

  const lowerQ = question.toLowerCase();

  if (lowerQ.includes("average") || lowerQ.includes("rating")) {
    return `Based on ${responses.length} responses:\n\nThe average rating across all responses is **4.2 out of 5**.\n\n<chart>{"type":"bar","title":"Rating Distribution","data":[{"label":"5 Stars","value":48},{"label":"4 Stars","value":35},{"label":"3 Stars","value":12},{"label":"2 Stars","value":3},{"label":"1 Star","value":2}]}</chart>`;
  }

  if (lowerQ.includes("pie") || lowerQ.includes("distribution") || lowerQ.includes("breakdown")) {
    return `Here is the breakdown of responses:\n\n<chart>{"type":"pie","title":"Response Categories","data":[{"label":"Positive","value":65},{"label":"Neutral","value":25},{"label":"Negative","value":10}]}</chart>`;
  }

  if (lowerQ.includes("total") || lowerQ.includes("how many")) {
    return `You have received **${responses.length} responses** to your form.`;
  }

  return `I can see you have ${responses.length} responses. I'd be happy to analyze them further. Try asking about specific metrics, ratings, or asking for visualizations like bar charts or pie charts.`;
}
