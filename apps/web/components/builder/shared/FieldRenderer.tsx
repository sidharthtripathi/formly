"use client";

import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FormField, FieldType } from "@formly/shared/types/form-schema";
import { Star, Heart, Check } from "lucide-react";

interface FieldRendererProps {
  field: FormField;
  value?: unknown;
  onChange?: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
}: FieldRendererProps) {
  const { type, label, placeholder, helpText, required, options, validation } = field;

  const baseProps = {
    disabled,
    placeholder,
    className: cn(
      "w-full",
      error && "border-destructive",
      className
    ),
  };

  const renderField = () => {
    switch (type) {
      case "short_text":
        return (
          <Input
            {...baseProps}
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
            maxLength={validation?.maxLength}
          />
        );

      case "long_text":
        return (
          <textarea
            {...baseProps}
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
            rows={4}
            className={cn(baseProps.className, "min-h-[100px] resize-none")}
            maxLength={validation?.maxLength}
          />
        );

      case "email":
        return (
          <Input
            {...baseProps}
            type="email"
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
        );

      case "phone":
        return (
          <Input
            {...baseProps}
            type="tel"
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
        );

      case "url":
        return (
          <Input
            {...baseProps}
            type="url"
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
        );

      case "number":
        return (
          <Input
            {...baseProps}
            type="number"
            value={value as number || ""}
            onChange={(e) => onChange?.(Number(e.target.value))}
            min={validation?.min}
            max={validation?.max}
            step={validation?.max ? 1 : undefined}
          />
        );

      case "password":
        return (
          <Input
            {...baseProps}
            type="password"
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
        );

      case "single_choice":
        return (
          <div className="space-y-2">
            {options?.map((opt) => (
              <label
                key={opt.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  value === opt.value && "border-primary bg-primary/5",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={() => onChange?.(opt.value)}
                  disabled={disabled}
                  className="w-4 h-4"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case "multiple_choice":
        return (
          <div className="space-y-2">
            {options?.map((opt) => {
              const arr = (value as string[]) || [];
              return (
                <label
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    arr.includes(opt.value) && "border-primary bg-primary/5",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={arr.includes(opt.value)}
                    onChange={(e) => {
                      const newArr = e.target.checked
                        ? [...arr, opt.value]
                        : arr.filter((v) => v !== opt.value);
                      onChange?.(newArr);
                    }}
                    disabled={disabled}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              );
            })}
          </div>
        );

      case "dropdown":
        return (
          <select
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              baseProps.className
            )}
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
          >
            <option value="">{placeholder || "Select an option"}</option>
            {options?.map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case "multi_select_dropdown":
        const multiVal = (value as string[]) || [];
        return (
          <div className="space-y-1">
            <select
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                baseProps.className
              )}
              onChange={(e) => {
                if (e.target.value && !multiVal.includes(e.target.value)) {
                  onChange?.([...multiVal, e.target.value]);
                }
                e.target.value = "";
              }}
              disabled={disabled}
            >
              <option value="">Select options</option>
              {options?.filter((opt) => !multiVal.includes(opt.value)).map((opt) => (
                <option key={opt.id} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1">
              {multiVal.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded text-xs"
                >
                  {options?.find((o) => o.value === v)?.label || v}
                  <button
                    type="button"
                    onClick={() => onChange?.(multiVal.filter((x) => x !== v))}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        );

      case "yes_no":
        return (
          <div className="flex gap-4">
            {["Yes", "No"].map((opt) => (
              <label
                key={opt}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                  value === (opt === "Yes") && "border-primary bg-primary/5",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  type="radio"
                  name={field.id}
                  checked={value === (opt === "Yes")}
                  onChange={() => onChange?.(opt === "Yes")}
                  disabled={disabled}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "rating":
        const max = field.ratingMax || 5;
        return (
          <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange?.(n)}
                disabled={disabled}
                className={cn(
                  "p-1 transition-colors",
                  n <= (value as number || 0) && "text-yellow-500",
                  n > (value as number || 0) && "text-muted-foreground"
                )}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
        );

      case "nps":
        return (
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange?.(n)}
                disabled={disabled}
                className={cn(
                  "w-10 h-10 rounded border text-sm transition-colors",
                  n === (value as number) && "border-primary bg-primary text-primary-foreground",
                  n !== (value as number) && "hover:bg-accent"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        );

      case "likert_scale":
        const points = validation?.max || 5;
        const labels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].slice(0, points);
        return (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: points }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange?.(n)}
                disabled={disabled}
                className={cn(
                  "flex-1 min-w-[80px] p-3 rounded-lg border text-center text-sm transition-colors",
                  n === (value as number) && "border-primary bg-primary text-primary-foreground",
                  n !== (value as number) && "hover:bg-accent"
                )}
              >
                <div className="font-medium">{n}</div>
                <div className="text-xs text-muted-foreground mt-1">{labels[n - 1]?.split(" ")[0]}</div>
              </button>
            ))}
          </div>
        );

      case "ranking":
        const items = options || [];
        const ranked = (value as string[]) || items.map((o) => o.value);
        return (
          <div className="space-y-2">
            {ranked.map((item, idx) => (
              <div
                key={item}
                className="flex items-center gap-3 p-2 rounded border bg-card"
              >
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {idx + 1}
                </span>
                <span className="text-sm flex-1">
                  {items.find((o) => o.value === item)?.label || item}
                </span>
                <div className="flex gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newRanked = [...ranked];
                        [newRanked[idx - 1], newRanked[idx]] = [newRanked[idx], newRanked[idx - 1]];
                        onChange?.(newRanked);
                      }}
                      className="p-1 hover:bg-accent rounded"
                      disabled={disabled}
                    >
                      ↑
                    </button>
                  )}
                  {idx < ranked.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newRanked = [...ranked];
                        [newRanked[idx], newRanked[idx + 1]] = [newRanked[idx + 1], newRanked[idx]];
                        onChange?.(newRanked);
                      }}
                      className="p-1 hover:bg-accent rounded"
                      disabled={disabled}
                    >
                      ↓
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );

      case "date":
        return (
          <Input
            {...baseProps}
            type="date"
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
            min={validation?.min ? new Date(validation.min).toISOString().split("T")[0] : undefined}
            max={validation?.max ? new Date(validation.max).toISOString().split("T")[0] : undefined}
          />
        );

      case "time":
        return (
          <Input
            {...baseProps}
            type="time"
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
        );

      case "date_time":
        return (
          <Input
            {...baseProps}
            type="datetime-local"
            value={value as string || ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
        );

      case "date_range":
        const rangeVal = (value as { start?: string; end?: string }) || {};
        return (
          <div className="flex gap-2">
            <Input
              {...baseProps}
              type="date"
              placeholder="Start"
              value={rangeVal.start || ""}
              onChange={(e) => onChange?.({ ...rangeVal, start: e.target.value })}
            />
            <Input
              {...baseProps}
              type="date"
              placeholder="End"
              value={rangeVal.end || ""}
              onChange={(e) => onChange?.({ ...rangeVal, end: e.target.value })}
            />
          </div>
        );

      case "file_upload":
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              id={`file-${field.id}`}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange?.(file);
              }}
              disabled={disabled}
              accept={validation?.allowedFileTypes?.join(",")}
            />
            <label
              htmlFor={`file-${field.id}`}
              className={cn("cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}
            >
              {value ? (
                <span className="text-sm">{(value as File).name}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Click to upload{validation?.allowedFileTypes ? ` (${validation.allowedFileTypes.join(", ")})` : ""}
                </span>
              )}
            </label>
          </div>
        );

      case "image_upload":
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              id={`image-${field.id}`}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onChange?.(file);
              }}
              disabled={disabled}
            />
            <label
              htmlFor={`image-${field.id}`}
              className={cn("cursor-pointer block", disabled && "opacity-50 cursor-not-allowed")}
            >
              {value ? (
                <img
                  src={URL.createObjectURL(value as File)}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Click to upload image</span>
              )}
            </label>
          </div>
        );

      case "signature":
        return (
          <div className="border rounded-lg p-4 bg-card">
            <textarea
              {...baseProps}
              placeholder="Type your signature"
              value={value as string || ""}
              onChange={(e) => onChange?.(e.target.value)}
              className={cn(baseProps.className, "font-serif text-lg min-h-[100px]")}
            />
          </div>
        );

      case "section_header":
        return (
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{label}</h3>
            {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
          </div>
        );

      case "statement":
        return (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{helpText || label}</p>
        );

      case "page_break":
        return null;

      case "matrix":
        const rows = field.matrixRows || [];
        const cols = field.matrixColumns || [];
        const matrixVal = (value as Record<string, string>) || {};
        return (
          <div className="space-y-2">
            <div className="grid gap-2" style={{ gridTemplateColumns: `auto repeat(${cols.length}, 1fr)` }}>
              <div />
              {cols.map((col) => (
                <div key={col} className="text-center text-xs font-medium">{col}</div>
              ))}
              {rows.map((row) => (
                <>
                  <div key={`label-${row}`} className="text-sm pr-2">{row}</div>
                  {cols.map((col) => (
                    <div key={`${row}-${col}`} className="flex justify-center">
                      <input
                        type="radio"
                        name={`matrix-${row}`}
                        checked={matrixVal[row] === col}
                        onChange={() => onChange?.({ ...matrixVal, [row]: col })}
                        disabled={disabled}
                        className="w-4 h-4"
                      />
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        );

      case "slider": {
        const sliderMin = field.sliderMin ?? 0;
        const sliderMax = field.sliderMax ?? 100;
        const sliderStep = field.sliderStep ?? 1;
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={sliderStep}
              value={value as number ?? sliderMin}
              onChange={(e) => onChange?.(Number(e.target.value))}
              disabled={disabled}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{sliderMin}</span>
              <span className="font-medium">{(value as number) ?? sliderMin}</span>
              <span>{sliderMax}</span>
            </div>
          </div>
        );
      }

      case "address":
        const addrVal = (value as Record<string, string>) || {};
        const addrFields = ["street", "city", "state", "country", "zip"] as const;
        return (
          <div className="space-y-2">
            {addrFields.map((f) => (
              <Input
                key={f}
                {...baseProps}
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                value={addrVal[f] || ""}
                onChange={(e) => onChange?.({ ...addrVal, [f]: e.target.value })}
              />
            ))}
          </div>
        );

      case "hidden_field":
        return <input type="hidden" value={field.hiddenDefaultValue || ""} />;

      case "calculated_field":
        return (
          <div className="p-3 bg-muted rounded-md text-sm">
            {helpText || "Calculated field"}
          </div>
        );

      default:
        return <Input {...baseProps} />;
    }
  };

  if (type === "section_header" || type === "statement" || type === "page_break" || type === "hidden_field") {
    return <>{renderField()}</>;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {renderField()}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
