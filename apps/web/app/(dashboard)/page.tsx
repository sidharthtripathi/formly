"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const QUICK_TEMPLATES = [
  { name: "Contact Form", icon: "📧", description: "Name, Email, Subject, Message", slug: "contact" },
  { name: "Customer Feedback", icon: "💬", description: "Stars, open feedback, NPS", slug: "feedback" },
  { name: "Event Registration", icon: "📅", description: "Attendee info, session, dietary", slug: "event" },
  { name: "Job Application", icon: "💼", description: "Resume, cover letter, LinkedIn", slug: "job-app" },
  { name: "Customer Survey", icon: "📊", description: "Multiple choice, Likert, open", slug: "survey" },
  { name: "Lead Generation", icon: "🎯", description: "Email, company, interest area", slug: "lead-gen" },
  { name: "Bug Report", icon: "🐛", description: "Steps, severity, screenshot", slug: "bug-report" },
  { name: "Meeting Booking", icon: "🗓️", description: "Date, time, meeting type, notes", slug: "booking" },
];

export default function DashboardHomePage() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();

  const handleGenerate = () => {
    if (prompt.trim()) {
      router.push(`/builder/new?prompt=${encodeURIComponent(prompt)}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold">Create a form with AI</h1>
        <p className="text-muted-foreground text-lg">
          Describe what you want and let AI build it for you
        </p>
      </div>

      {/* Prompt Box */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the form you want to create... (e.g., 'A customer feedback form with a 1-5 star rating, name, email, and open-ended feedback questions about their experience')"
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <Button onClick={handleGenerate} className="w-full" size="lg" disabled={!prompt.trim()}>
              ✨ Generate Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or start with a template</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Quick Templates Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {QUICK_TEMPLATES.map((template) => (
          <button
            key={template.name}
            onClick={() => router.push(`/builder/new?template=${template.slug}`)}
            className="p-4 rounded-lg border bg-card text-left hover:bg-accent hover:text-accent-foreground transition-all group"
          >
            <span className="text-2xl mb-2 block">{template.icon}</span>
            <span className="font-medium text-sm block group-hover:text-primary transition-colors">
              {template.name}
            </span>
            <span className="text-xs text-muted-foreground mt-1 block line-clamp-1">
              {template.description}
            </span>
          </button>
        ))}
      </div>

      {/* Footer Links */}
      <div className="flex justify-center gap-6 text-sm">
        <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors">
          🏪 Browse Marketplace
        </Link>
        <Link href="/templates" className="text-muted-foreground hover:text-primary transition-colors">
          📋 My Templates
        </Link>
      </div>
    </div>
  );
}
