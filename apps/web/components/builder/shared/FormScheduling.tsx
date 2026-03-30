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
import { Calendar, Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleConfig {
  isScheduled: boolean;
  openAt?: string; // ISO date
  closeAt?: string; // ISO date
  timezone?: string;
}

interface FormSchedulingProps {
  config?: ScheduleConfig;
  onSave: (config: ScheduleConfig) => void;
}

export function FormScheduling({ config, onSave }: FormSchedulingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScheduled, setIsScheduled] = useState(config?.isScheduled || false);
  const [openAt, setOpenAt] = useState(config?.openAt || "");
  const [closeAt, setCloseAt] = useState(config?.closeAt || "");
  const [timezone, setTimezone] = useState(config?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  const handleSave = () => {
    onSave({
      isScheduled,
      openAt: isScheduled ? openAt : undefined,
      closeAt: isScheduled ? closeAt : undefined,
      timezone: isScheduled ? timezone : undefined,
    });
    setIsOpen(false);
  };

  const now = new Date().toISOString().slice(0, 16);

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Calendar className="w-4 h-4 mr-2" />
        {isScheduled && config?.openAt ? (
          <span className="text-muted-foreground">
            Closes {new Date(config.closeAt!).toLocaleDateString()}
          </span>
        ) : (
          <span>Set Schedule</span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Form Scheduling</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Scheduled Access</Label>
                <p className="text-sm text-muted-foreground">
                  Set specific times when your form is open for responses
                </p>
              </div>
              <button
                onClick={() => setIsScheduled(!isScheduled)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  isScheduled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    isScheduled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {isScheduled && (
              <div className="space-y-4 animate-in slide-in-from-top-2">
                {/* Open Date */}
                <div className="space-y-2">
                  <Label htmlFor="openAt">Opens At</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="openAt"
                      type="datetime-local"
                      value={openAt}
                      onChange={(e) => setOpenAt(e.target.value)}
                      min={now}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to open immediately when published
                  </p>
                </div>

                {/* Close Date */}
                <div className="space-y-2">
                  <Label htmlFor="closeAt">Closes At</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="closeAt"
                      type="datetime-local"
                      value={closeAt}
                      onChange={(e) => setCloseAt(e.target.value)}
                      min={openAt || now}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Preview */}
                <div className="p-3 rounded-lg bg-muted space-y-1">
                  <p className="text-sm font-medium">Schedule Status</p>
                  {openAt && (
                    <p className="text-xs text-muted-foreground">
                      Opens: {new Date(openAt).toLocaleString(timezone)}
                    </p>
                  )}
                  {closeAt ? (
                    <p className="text-xs text-muted-foreground">
                      Closes: {new Date(closeAt).toLocaleString(timezone)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Closes: When you manually close the form
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
