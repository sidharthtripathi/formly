"use client";

import { useState } from "react";
import Link from "next/link";
import { useForms } from "@/hooks/useForms";
import { useDeleteForm } from "@/hooks/useForms";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Eye,
  BarChart2,
  Copy,
  Save,
  Settings,
  Trash2,
  FileText,
  CheckCircle,
  Circle,
  Clock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { data: forms, isLoading } = useForms();
  const deleteForm = useDeleteForm();
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Toggle Button (mobile) */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 p-2 bg-background border rounded-md lg:hidden"
      >
        {open ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform lg:transform-none",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg"
            >
              ✨ New Form
            </Link>
          </div>

          {/* Forms List */}
          <div className="flex-1 overflow-auto">
            <div className="p-2">
              <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                My Forms
              </h3>

              {isLoading && (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              )}

              {forms?.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <p>No forms yet</p>
                  <Link
                    href="/builder/new"
                    className="text-primary hover:underline mt-2 inline-block"
                  >
                    Create your first form
                  </Link>
                </div>
              )}

              <div className="space-y-1">
                {forms?.map((form) => (
                  <FormListItem
                    key={form.id}
                    form={form}
                    onDelete={() => deleteForm.mutate(form.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="p-4 border-t space-y-1">
            <Link
              href="/templates"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              <Save className="w-4 h-4" />
              My Templates
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              🏪 Marketplace
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

function FormListItem({
  form,
  onDelete,
}: {
  form: {
    id: string;
    title: string;
    status: string;
    isPublished: boolean;
    publicSlug?: string;
  };
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const statusBadge = () => {
    if (form.status === "published") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="w-3 h-3" />
          Published
        </span>
      );
    }
    if (form.status === "closed") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Circle className="w-3 h-3" />
        Draft
      </span>
    );
  };

  return (
    <div
      className={cn(
        "group flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors",
        open && "bg-muted"
      )}
    >
      <Link
        href={`/builder/${form.id}`}
        className="flex-1 min-w-0 py-1"
      >
        <div className="truncate text-sm font-medium">{form.title || "Untitled"}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {statusBadge()}
        </div>
      </Link>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/builder/${form.id}`} className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit Form
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/forms/${form.id}/responses`} className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              View Responses
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/forms/${form.id}/analytics`} className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              AI Analysis
            </Link>
          </DropdownMenuItem>

          {form.publicSlug && (
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/f/${form.publicSlug}`);
              }}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy Public URL
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link href={`/templates?form=${form.id}`} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save as Template
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={onDelete}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
            Delete Form
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
