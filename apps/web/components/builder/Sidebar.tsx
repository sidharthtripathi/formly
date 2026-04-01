"use client";

import { useState } from "react";
import Link from "next/link";
import { useForms } from "@/hooks/useForms";
import { useUser } from "@/hooks/useUser";
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
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";

type FormListItem = {
  id: string;
  title: string;
  status: string;
  isPublished: boolean;
  publicSlug?: string | null;
};

export function Sidebar() {
  const { data: forms, isLoading } = useForms() as { data: FormListItem[] | undefined; isLoading: boolean };
  const { data: user } = useUser();
  const deleteForm = useDeleteForm();
  const [open, setOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Toggle Button (mobile) */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-[60] p-2 bg-background border rounded-md shadow-sm lg:hidden"
      >
        {open ? <X className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
      </button>

      {/* Collapsed toggle (desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex fixed top-4 z-[60] p-2 bg-background border rounded-md shadow-sm hover:bg-muted transition-colors"
        style={{ left: isCollapsed ? "4px" : "284px" }}
      >
        {isCollapsed ? <FileText className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        <motion.aside
          initial={false}
          animate={{
            width: isCollapsed ? 72 : 280,
            opacity: 1,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "fixed inset-y-0 left-0 z-40 bg-background border-r overflow-hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full w-[280px]">
            {/* Header */}
            <div className={cn("p-4 border-b", isCollapsed && "p-2 flex flex-col items-center gap-3")}>
              {isCollapsed ? (
                <>
                  <Link href="/" className="p-2 hover:bg-muted rounded-md transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </Link>
                  <Link href="/builder/new" className="p-2 hover:bg-muted rounded-md transition-colors">
                    <Plus className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <Link
                  href="/"
                  className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Formly</span>
                </Link>
              )}
            </div>

            {/* New Form Button */}
            {!isCollapsed && (
              <div className="p-3">
                <Button asChild className="w-full" size="sm">
                  <Link href="/builder/new">
                    <Plus className="w-4 h-4 mr-2" />
                    New Form
                  </Link>
                </Button>
              </div>
            )}

            {/* Forms List */}
            {!isCollapsed && (
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
            )}

            {/* User Section */}
            <div className={cn("border-t", isCollapsed ? "p-2 flex flex-col items-center gap-3" : "p-4")}>
              {user ? (
                isCollapsed ? (
                  <div className="flex flex-col items-center gap-2">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || "User"}
                        className="w-9 h-9 rounded-full"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="p-2 rounded-md hover:bg-muted transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name || "User"}
                          className="w-9 h-9 rounded-full"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="p-2 rounded-md hover:bg-muted transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )
              ) : (
                isCollapsed ? (
                  <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-2 w-28 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                )
              )}

              {!isCollapsed && (
                <div className="mt-3 space-y-1">
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
              )}
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