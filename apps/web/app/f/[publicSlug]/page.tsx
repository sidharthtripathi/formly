import { notFound } from "next/navigation";
import { usePublicForm } from "@/hooks/useForms";
import { FormFiller } from "@/components/filler/FormFiller";

interface PageProps {
  params: Promise<{ publicSlug: string }>;
}

export default async function PublicFormPage({ params }: PageProps) {
  const { publicSlug } = await params;

  if (!publicSlug) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <PublicFormContent slug={publicSlug} />
      </div>
    </div>
  );
}

function PublicFormContent({ slug }: { slug: string }) {
  // Using a simple fetch approach for SSR
  // In a real app, you'd use a server component with proper data fetching
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="space-y-3 mt-8">
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
      </div>
    </div>
  );
}
