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
import { Mail, Trash2, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailNotification {
  id: string;
  type: "new_response" | "daily_digest" | "weekly_digest";
  recipientEmail: string;
  isActive: boolean;
}

interface EmailNotificationsEditorProps {
  formId: string;
  notifications: EmailNotification[];
  onAdd: (type: EmailNotification["type"], email: string) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  creatorEmail?: string;
}

const NOTIFICATION_TYPES = [
  {
    value: "new_response" as const,
    label: "New Response",
    description: "Get notified immediately when someone submits a response",
    icon: Bell,
  },
  {
    value: "daily_digest" as const,
    label: "Daily Digest",
    description: "Receive a summary of all responses once per day",
    icon: Mail,
  },
  {
    value: "weekly_digest" as const,
    label: "Weekly Digest",
    description: "Receive a summary of all responses once per week",
    icon: Mail,
  },
];

export function EmailNotificationsEditor({
  formId,
  notifications,
  onAdd,
  onRemove,
  onToggle,
  creatorEmail,
}: EmailNotificationsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EmailNotification["type"]>("new_response");
  const [customEmail, setCustomEmail] = useState("");
  const [useCreatorEmail, setUseCreatorEmail] = useState(true);

  const handleAdd = () => {
    const email = useCreatorEmail && creatorEmail ? creatorEmail : customEmail;
    if (email) {
      onAdd(selectedType, email);
      setCustomEmail("");
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Mail className="w-4 h-4 mr-2" />
        Email Notifications
        {notifications.filter((n) => n.isActive).length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
            {notifications.filter((n) => n.isActive).length} active
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Notifications</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add New */}
            <div className="space-y-3">
              <Label>Add notification</Label>

              {/* Notification Type */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as EmailNotification["type"])}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {NOTIFICATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {/* Email Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useCreatorEmail}
                    onChange={(e) => setUseCreatorEmail(e.target.checked)}
                    className="rounded"
                  />
                  Send to my email ({creatorEmail})
                </label>
                {!useCreatorEmail && (
                  <Input
                    type="email"
                    placeholder="custom@example.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                  />
                )}
              </div>

              <Button onClick={handleAdd} className="w-full">
                Add Notification
              </Button>
            </div>

            {/* Existing Notifications */}
            <div className="space-y-2">
              <Label>Active notifications</Label>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No notifications configured
                </p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => {
                    const typeConfig = NOTIFICATION_TYPES.find((t) => t.value === notif.type);
                    const TypeIcon = typeConfig?.icon || Bell;
                    return (
                      <div
                        key={notif.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{typeConfig?.label}</p>
                            <p className="text-xs text-muted-foreground">{notif.recipientEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onToggle(notif.id)}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              notif.isActive
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                            title={notif.isActive ? "Mute" : "Enable"}
                          >
                            {notif.isActive ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => onRemove(notif.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
