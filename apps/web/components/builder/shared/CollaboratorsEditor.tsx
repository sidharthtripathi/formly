"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserPlus, Trash2, Eye, Pencil, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Collaborator {
  id: string;
  email: string;
  name?: string;
  role: "viewer" | "editor" | "admin";
  avatarUrl?: string;
}

interface CollaboratorsEditorProps {
  formId: string;
  collaborators: Collaborator[];
  onAdd: (email: string, role: Collaborator["role"]) => void;
  onRemove: (userId: string) => void;
  onUpdateRole: (userId: string, role: Collaborator["role"]) => void;
}

const ROLE_CONFIG = {
  viewer: { label: "Viewer", icon: Eye, description: "Can view responses" },
  editor: { label: "Editor", icon: Pencil, description: "Can edit form and view responses" },
  admin: { label: "Admin", icon: Crown, description: "Full access including settings and deletion" },
};

export function CollaboratorsEditor({
  formId,
  collaborators,
  onAdd,
  onRemove,
  onUpdateRole,
}: CollaboratorsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Collaborator["role"]>("editor");

  const handleAdd = () => {
    if (email.trim()) {
      onAdd(email, role);
      setEmail("");
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <UserPlus className="w-4 h-4 mr-2" />
        Manage Collaborators
        {collaborators.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-muted rounded-full text-xs">
            {collaborators.length}
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Collaborators</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add Collaborator */}
            <div className="space-y-2">
              <Label>Invite someone</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Collaborator["role"])}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <Button onClick={handleAdd} disabled={!email.trim()}>
                  Add
                </Button>
              </div>
            </div>

            {/* Collaborators List */}
            <div className="space-y-2">
              {collaborators.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No collaborators yet. Invite someone to collaborate on this form.
                </p>
              ) : (
                collaborators.map((collab) => {
                  const RoleIcon = ROLE_CONFIG[collab.role].icon;
                  return (
                    <div
                      key={collab.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          {collab.avatarUrl ? (
                            <img
                              src={collab.avatarUrl}
                              alt={collab.name || collab.email}
                              className="w-full h-full rounded-full"
                            />
                          ) : (
                            <span className="text-xs font-medium">
                              {(collab.name || email)[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {collab.name || collab.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {collab.email !== collab.name ? collab.email : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={collab.role}
                          onChange={(e) =>
                            onUpdateRole(collab.id, e.target.value as Collaborator["role"])
                          }
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemove(collab.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
