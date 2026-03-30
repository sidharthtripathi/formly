import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { FormSchema, FormField, FieldType } from "@formly/shared/types/form-schema";

interface SchemaDelta {
  op: "set_field" | "update_field" | "delete_field" | "set_title" | "set_description" | "add_page";
  field?: FormField;
  fieldId?: string;
  patch?: Partial<FormField>;
  value?: string;
  pageIndex?: number;
}

interface FormStore {
  schema: FormSchema | null;
  history: FormSchema[];
  historyIndex: number;
  selectedFieldId: string | null;
  isGenerating: boolean;
  builderMode: "ai" | "manual";

  setSchema: (schema: FormSchema) => void;
  applyDelta: (delta: SchemaDelta) => void;
  selectField: (fieldId: string | null) => void;
  setMode: (mode: "ai" | "manual") => void;
  switchToManualDueToCredits: () => void;
  undo: () => void;
  redo: () => void;
  setGenerating: (v: boolean) => void;

  addField: (type: FieldType, pageIndex: number) => void;
  updateField: (fieldId: string, patch: Partial<FormField>) => void;
  deleteField: (fieldId: string) => void;
  reorderFields: (pageIndex: number, oldIndex: number, newIndex: number) => void;
  moveFieldToPage: (fieldId: string, targetPageIndex: number) => void;
  addPage: () => void;
  deletePage: (pageIndex: number) => void;
  renamePage: (pageIndex: number, title: string) => void;
}

export const useFormStore = create<FormStore>()(
  immer((set, get) => ({
    schema: null,
    history: [],
    historyIndex: -1,
    selectedFieldId: null,
    isGenerating: false,
    builderMode: "ai",

    setSchema: (schema) =>
      set((state) => {
        if (state.schema) {
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(state.schema);
          if (state.history.length > 20) state.history.shift();
          state.historyIndex = state.history.length - 1;
        }
        state.schema = schema;
      }),

    applyDelta: (delta) =>
      set((state) => {
        if (!state.schema) return;
        // delta application handled by AI streaming
      }),

    selectField: (fieldId) =>
      set((state) => {
        state.selectedFieldId = fieldId;
      }),

    setMode: (mode) =>
      set((state) => {
        state.builderMode = mode;
      }),

    switchToManualDueToCredits: () =>
      set((state) => {
        state.builderMode = "manual";
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex >= 0) {
          state.schema = state.history[state.historyIndex];
          state.historyIndex--;
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.schema = state.history[state.historyIndex];
        }
      }),

    setGenerating: (v) =>
      set((state) => {
        state.isGenerating = v;
      }),

    addField: (type, pageIndex) =>
      set((state) => {
        if (!state.schema) return;
        // Save current state to history
        if (state.history.length > 0) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        state.history.push(JSON.parse(JSON.stringify(state.schema)));
        if (state.history.length > 20) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const newField: FormField = {
          id: crypto.randomUUID(),
          type,
          label: `New ${type} field`,
          required: false,
          pageIndex,
          order: state.schema.fields.filter((f) => f.pageIndex === pageIndex).length,
        };
        state.schema.fields.push(newField);
        state.selectedFieldId = newField.id;
      }),

    updateField: (fieldId, patch) =>
      set((state) => {
        if (!state.schema) return;
        // Save current state to history before mutation
        if (state.history.length > 0) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        state.history.push(JSON.parse(JSON.stringify(state.schema)));
        if (state.history.length > 20) state.history.shift();
        state.historyIndex = state.history.length - 1;

        const field = state.schema.fields.find((f) => f.id === fieldId);
        if (field) Object.assign(field, patch);
      }),

    deleteField: (fieldId) =>
      set((state) => {
        if (!state.schema) return;
        // Save current state to history
        if (state.history.length > 0) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        state.history.push(JSON.parse(JSON.stringify(state.schema)));
        if (state.history.length > 20) state.history.shift();
        state.historyIndex = state.history.length - 1;

        state.schema.fields = state.schema.fields.filter((f) => f.id !== fieldId);
        if (state.selectedFieldId === fieldId) state.selectedFieldId = null;
      }),

    reorderFields: (pageIndex, oldIndex, newIndex) =>
      set((state) => {
        if (!state.schema) return;
        const pageFields = state.schema.fields
          .filter((f) => f.pageIndex === pageIndex)
          .sort((a, b) => a.order - b.order);
        const [moved] = pageFields.splice(oldIndex, 1);
        pageFields.splice(newIndex, 0, moved);
        pageFields.forEach((f, i) => {
          const field = state.schema!.fields.find((sf) => sf.id === f.id);
          if (field) field.order = i;
        });
      }),

    moveFieldToPage: (fieldId, targetPageIndex) =>
      set((state) => {
        if (!state.schema) return;
        const field = state.schema.fields.find((f) => f.id === fieldId);
        if (field) {
          field.pageIndex = targetPageIndex;
          field.order = state.schema.fields.filter(
            (f) => f.pageIndex === targetPageIndex
          ).length;
        }
      }),

    addPage: () =>
      set((state) => {
        if (!state.schema) return;
        state.schema.pages.push({
          id: crypto.randomUUID(),
          index: state.schema.pages.length,
        });
      }),

    deletePage: (pageIndex) =>
      set((state) => {
        if (!state.schema) return;
        state.schema.pages = state.schema.pages.filter((p) => p.index !== pageIndex);
        state.schema.fields = state.schema.fields.filter(
          (f) => f.pageIndex !== pageIndex
        );
      }),

    renamePage: (pageIndex, title) =>
      set((state) => {
        if (!state.schema) return;
        const page = state.schema.pages.find((p) => p.index === pageIndex);
        if (page) page.title = title;
      }),
  }))
);
