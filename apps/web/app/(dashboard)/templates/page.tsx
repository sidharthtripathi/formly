"use client";

import { useState } from "react";
import { useTemplates, useDeleteTemplate, useUseTemplate } from "@/hooks/useTemplates";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Copy, Upload, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function TemplatesPage() {
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();
  const useTemplate = useUseTemplate();
  const router = useRouter();

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleUseTemplate = async (templateId: string) => {
    const result = await useTemplate.mutateAsync(templateId);
    if (result?.data?.id) {
      router.push(`/builder/${result.data.id}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">📋 My Templates</h1>
          <p className="text-muted-foreground mt-1">
            Save forms as templates to reuse them later
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/marketplace">🏪 Browse Marketplace</Link>
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : templates?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No templates yet</p>
          <p className="text-sm mt-1">
            Save a form as a template from the builder to see it here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates?.map((template: any) => (
            <Card key={template.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">
                    {template.isPublic ? "🌐 Public" : "🔒 Private"}
                  </span>
                  {template.createdAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{template.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description || "No description"}
                </p>
              </CardContent>
              <CardFooter className="gap-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleUseTemplate(template.id)}
                  disabled={useTemplate.isPending}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Use
                </Button>
                {!template.isPublic && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/templates/${template.id}/publish`}>
                      <Upload className="w-4 h-4 mr-1" />
                      Publish
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirm(template.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The template will be permanently deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirm) {
                  deleteTemplate.mutate(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
