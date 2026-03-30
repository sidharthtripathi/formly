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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Eye,
  BarChart2,
  Copy,
  Save,
  Trash2,
  FileText,
  CheckCircle,
  Circle,
  Clock,
  X,
  Sparkles,
  LayoutDashboard,
  Store,
} from "lucide-react";

type FormListItem = {
  id: string;
  title: string;
  status: string;
  isPublished: boolean;
  publicSlug?: string | null;
};

export function Sidebar() {
  const { data: forms, isLoading } = useForms() as { data: FormListItem[] | undefined; isLoading: boolean };
  const deleteForm = useDeleteForm();
  const [open, setOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Toggle Button (mobile) */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 p-2 bg-background border rounded-md shadow-sm lg:hidden"
      >
        {open ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      </button>

      {/* Collapsed toggle (desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex fixed top-4 left-64 z-40 p-2 bg-background border rounded-md shadow-sm hover:bg-muted transition-colors"
      >
        {isCollapsed ? <FileText className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        <motion.aside
          initial={false}
          animate={{
            width: isCollapsed ? 0 : 280,
            opacity: isCollapsed ? 0 : 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "fixed lg:static inset-y-0 left-0 z-40 bg-background border-r overflow-hidden",
            open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div className="p-4 border-b">
              <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                <span>Formly</span>
              </Link>
            </div>

            {/* New Form Button */}
            <div className="p-3">
              <Button asChild className="w-full" size="sm">
                <Link href="/builder/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Form
                </Link>
              </Button>
            </div>

            {/* Forms List */}
            <div className="flex-1 overflow-auto">
              <div className="p-2">
                <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <LayoutDashboard className="w-3 h-3" />
                  My Forms
                </h3>

                {isLoading && (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                )}

                {forms?.length === 0 && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No forms yet</p>
                    <Link
                      href="/builder/new"
                      className="text-primary hover:underline mt-2 inline-block"
                    >
                      Create your first form
                    </Link>
                  </motion.div>
                )}

                <motion.div
                  className="space-y-1"
                  initial={false}
                >
                  {forms?.map((form, index) => (
                    <motion.div
                      key={form.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <FormListItem
                        form={form}
                        onDelete={() => deleteForm.mutate(form.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
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
                <Store className="w-4 h-4" />
                Marketplace
              </Link>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Overlay (mobile) */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
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
    publicSlug?: string | null;
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
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors cursor-pointer",
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
    </motion.div>
  );
}