export type FieldType =
  | 'short_text' | 'long_text' | 'email' | 'phone' | 'url' | 'number' | 'password'
  | 'single_choice' | 'multiple_choice' | 'dropdown' | 'multi_select_dropdown'
  | 'yes_no' | 'rating' | 'nps' | 'likert_scale' | 'ranking'
  | 'date' | 'time' | 'date_time' | 'date_range'
  | 'file_upload' | 'image_upload' | 'signature'
  | 'section_header' | 'statement' | 'page_break'
  | 'matrix' | 'slider' | 'address' | 'hidden_field' | 'calculated_field';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface ConditionalRule {
  fieldId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean;
  action: 'show' | 'hide' | 'jump_to_page' | 'require';
  targetId: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  pageIndex: number;
  order: number;
  options?: FieldOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    allowedFileTypes?: string[];
    maxFileSizeMb?: number;
  };
  matrixRows?: string[];
  matrixColumns?: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  ratingMax?: number;
  hiddenDefaultValue?: string;
  calculatedFormula?: string;
  conditions?: ConditionalRule[];
}

export interface FormPage {
  id: string;
  index: number;
  title?: string;
  description?: string;
}

export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  pages: FormPage[];
  fields: FormField[];
  settings: {
    showProgressBar: boolean;
    allowMultipleSubmissions: boolean;
    successMessage: string;
    redirectUrl?: string;
    formStyle?: 'default' | 'conversational';
  };
  version: number;
}
