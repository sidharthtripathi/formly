"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Sparkles, FileText, MessageSquare, Calendar, Briefcase, BarChart, Target, Bug, Clock, Store, LayoutTemplate } from "lucide-react";

const QUICK_TEMPLATES = [
  { name: "Contact Form", icon: MessageSquare, description: "Name, Email, Subject, Message", slug: "contact" },
  { name: "Customer Feedback", icon: BarChart, description: "Stars, open feedback, NPS", slug: "feedback" },
  { name: "Event Registration", icon: Calendar, description: "Attendee info, session, dietary", slug: "event" },
  { name: "Job Application", icon: Briefcase, description: "Resume, cover letter, LinkedIn", slug: "job-app" },
  { name: "Customer Survey", icon: Target, description: "Multiple choice, Likert, open", slug: "survey" },
  { name: "Lead Generation", icon: Sparkles, description: "Email, company, interest area", slug: "lead-gen" },
  { name: "Bug Report", icon: Bug, description: "Steps, severity, screenshot", slug: "bug-report" },
  { name: "Meeting Booking", icon: Clock, description: "Date, time, meeting type, notes", slug: "booking" },
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
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center space-y-4 mb-6"
      >
        <h1 className="text-4xl font-bold tracking-tight">Create a form with AI</h1>
        <p className="text-muted-foreground text-lg">
          Describe what you want and let AI build it for you
        </p>
      </motion.div>

      {/* Prompt Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Describe your form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the form you want to create... (e.g., 'A customer feedback form with a 1-5 star rating, name, email, and open-ended feedback questions about their experience')"
                className="min-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <Button
                onClick={handleGenerate}
                className="w-full"
                size="lg"
                disabled={!prompt.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-4 mb-8"
      >
        <div className="flex-1 h-px bg-border" />
        <span className="text-sm text-muted-foreground">or start with a template</span>
        <div className="flex-1 h-px bg-border" />
      </motion.div>

      {/* Quick Templates Grid */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {QUICK_TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <motion.button
              key={template.name}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => router.push(`/builder/new?template=${template.slug}`)}
              className="p-4 rounded-lg border bg-card text-left hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Icon className="w-5 h-5 mb-2 text-primary" />
              <span className="font-medium text-sm block">{template.name}</span>
              <span className="text-xs text-muted-foreground mt-1 block line-clamp-1">
                {template.description}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex justify-center gap-6 text-sm"
      >
        <Button variant="ghost" asChild>
          <a href="/marketplace" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Browse Marketplace
          </a>
        </Button>
        <Button variant="ghost" asChild>
          <a href="/templates" className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4" />
            My Templates
          </a>
        </Button>
      </motion.div>
    </div>
  );
}
