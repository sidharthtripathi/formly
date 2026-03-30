import { z } from "zod";
import type { FieldType } from "../types/form-schema";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s-()]+$/;
const urlRegex = /^https?:\/\/.+/;

export const fieldValidators: Record<FieldType, z.ZodTypeAny> = {
  short_text: z.string().min(1),
  long_text: z.string().min(1),
  email: z.string().regex(emailRegex, "Invalid email address"),
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  url: z.string().regex(urlRegex, "Invalid URL"),
  number: z.number(),
  password: z.string().min(6),
  single_choice: z.string(),
  multiple_choice: z.array(z.string()),
  dropdown: z.string(),
  multi_select_dropdown: z.array(z.string()),
  yes_no: z.boolean(),
  rating: z.number().min(1).max(10),
  nps: z.number().min(0).max(10),
  likert_scale: z.number(),
  ranking: z.array(z.string()),
  date: z.string(),
  time: z.string(),
  date_time: z.string(),
  date_range: z.object({ start: z.string(), end: z.string() }),
  file_upload: z.instanceof(File).optional(),
  image_upload: z.instanceof(File).optional(),
  signature: z.string(),
  section_header: z.string().optional(),
  statement: z.string().optional(),
  page_break: z.string().optional(),
  matrix: z.record(z.string()),
  slider: z.number(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    zip: z.string(),
  }),
  hidden_field: z.string().optional(),
  calculated_field: z.string().optional(),
};

export function validateFieldValue(
  type: FieldType,
  value: unknown,
  required: boolean
): { valid: boolean; error?: string } {
  if (required && (value === undefined || value === null || value === "")) {
    return { valid: false, error: "This field is required" };
  }

  if (value === undefined || value === null || value === "") {
    return { valid: true };
  }

  const validator = fieldValidators[type];
  if (!validator) return { valid: true };

  try {
    if (type === "multiple_choice" || type === "multi_select_dropdown") {
      if (!Array.isArray(value)) {
        return { valid: false, error: "Expected array" };
      }
    }
    if (type === "number" || type === "rating" || type === "nps" || type === "slider") {
      const num = Number(value);
      if (isNaN(num)) return { valid: false, error: "Expected a number" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid value" };
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
