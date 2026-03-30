"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageRenderer } from "./PageRenderer";
import { Button } from "@/components/ui/button";
import type { FormSchema } from "@formly/shared/types/form-schema";

interface FormFillerProps {
  form: {
    id: string;
    title: string;
    description?: string | null;
    schema: FormSchema;
    isAnonymous: boolean;
    status: string;
  };
}

export function FormFiller({ form }: FormFillerProps) {
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  if (form.status === "closed") {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Form Closed</h2>
        <p className="text-muted-foreground">This form is no longer accepting responses.</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  if (!form.isAnonymous) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Sign In Required</h2>
        <p className="text-muted-foreground">You need to sign in with Google to fill out this form.</p>
        <Button onClick={() => router.push(`/login?redirect=/f/${form.id}`)}>
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{form.title}</h1>
        {form.description && (
          <p className="text-muted-foreground">{form.description}</p>
        )}
      </div>

      <PageRenderer
        schema={form.schema}
        formId={form.id}
        isAnonymous={form.isAnonymous}
      />
    </div>
  );
}
