export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'url' | 'number' | 'password'
  | 'single_choice' | 'multiple_choice' | 'dropdown' | 'multi_select_dropdown'
  | 'yes_no' | 'rating' | 'nps' | 'likert_scale' | 'ranking'
  | 'date' | 'time' | 'date_time' | 'date_range'
  | 'file_upload' | 'image_upload' | 'signature'
  | 'section_header' | 'statement' | 'page_break'
  | 'matrix' | 'slider' | 'address' | 'hidden_field' | 'calculated_field';

export type Plan = 'free' | 'pro';
export type FormStatus = 'draft' | 'published' | 'closed';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total?: number;
}

export interface User {
  id: string;
  googleId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  plan: Plan;
  aiCreditsUsed: number;
  aiCreditsResetAt: string;
}

export interface Form {
  id: string;
  ownerId: string;
  title: string;
  description?: string;
  schema: import('./form-schema').FormSchema;
  isPublished: boolean;
  isAnonymous: boolean;
  publicSlug?: string;
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentId?: string;
  answers: Record<string, unknown>;
  metadata?: {
    userAgent?: string;
    ip?: string;
    submittedAt?: string;
  };
  submittedAt: string;
}

export interface CreditStatus {
  used: number;
  limit: number;
  resetsAt: string;
}
