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
import { cn } from "@/lib/utils";

interface ThemeColors {
  primary: string;
  background: string;
  text: string;
  border: string;
}

interface FormThemeEditorProps {
  theme?: ThemeColors;
  onSave: (theme: ThemeColors) => void;
}

const PRESET_THEMES = [
  { name: "Default", colors: { primary: "#3b82f6", background: "#ffffff", text: "#1f2937", border: "#e5e7eb" } },
  { name: "Dark", colors: { primary: "#60a5fa", background: "#1f2937", text: "#f9fafb", border: "#374151" } },
  { name: "Earth", colors: { primary: "#92400e", background: "#fef3c7", text: "#451a03", border: "#fcd34d" } },
  { name: "Forest", colors: { primary: "#166534", background: "#f0fdf4", text: "#14532d", border: "#86efac" } },
  { name: "Sunset", colors: { primary: "#be185d", background: "#fdf2f8", text: "#831843", border: "#f9a8d4" } },
  { name: "Ocean", colors: { primary: "#0e7490", background: "#ecfeff", text: "#164e63", border: "#67e8f9" } },
];

export function FormThemeEditor({ theme, onSave }: FormThemeEditorProps) {
  const [colors, setColors] = useState<ThemeColors>(
    theme || PRESET_THEMES[0].colors
  );
  const [customName, setCustomName] = useState("");

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const handlePresetSelect = (preset: typeof PRESET_THEMES[0]) => {
    setColors(preset.colors);
  };

  return (
    <div className="space-y-6">
      {/* Preset Themes */}
      <div className="space-y-3">
        <Label>Preset Themes</Label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                JSON.stringify(colors) === JSON.stringify(preset.colors)
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex gap-1 mb-2">
                {(["primary", "background", "text"] as const).map((key) => (
                  <div
                    key={key}
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: preset.colors[key] }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="space-y-4">
        <Label>Custom Colors</Label>
        <div className="grid grid-cols-2 gap-4">
          {(["primary", "background", "text", "border"] as const).map((key) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-muted-foreground capitalize">
                {key}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <Input
                  value={colors[key]}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label>Preview</Label>
        <div
          className="rounded-lg p-6 border transition-colors"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
          }}
        >
          <h3
            className="font-semibold mb-2"
            style={{ color: colors.primary }}
          >
            Sample Form Title
          </h3>
          <div className="space-y-2">
            <div className="h-8 rounded border" style={{ borderColor: colors.border }} />
            <div className="h-8 rounded border" style={{ borderColor: colors.border }} />
          </div>
          <button
            className="mt-4 px-4 py-2 rounded text-white text-sm font-medium"
            style={{ backgroundColor: colors.primary }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
