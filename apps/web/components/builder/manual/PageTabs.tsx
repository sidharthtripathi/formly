"use client";

import { useState } from "react";
import { useFormStore } from "@/stores/formStore";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function PageTabs() {
  const { schema, addPage, deletePage, renamePage } = useFormStore();
  const [editingPage, setEditingPage] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const pages = schema?.pages || [];

  return (
    <div className="border-b bg-background px-4 py-2">
      <div className="flex items-center gap-1">
        {pages.map((page, idx) => (
          <div key={page.id} className="relative group">
            <button
              onClick={() => setEditingPage(idx)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                editingPage === idx
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {editingPage === idx ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    renamePage(idx, editValue);
                    setEditingPage(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      renamePage(idx, editValue);
                      setEditingPage(null);
                    }
                    if (e.key === "Escape") {
                      setEditingPage(null);
                    }
                  }}
                  className="bg-transparent outline-none w-20"
                  autoFocus
                />
              ) : (
                page.title || `Page ${idx + 1}`
              )}
            </button>
            {editingPage !== idx && pages.length > 1 && (
              <button
                onClick={() => deletePage(idx)}
                className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => addPage()}
          className="px-3 py-1.5 rounded text-sm hover:bg-muted transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>
    </div>
  );
}
