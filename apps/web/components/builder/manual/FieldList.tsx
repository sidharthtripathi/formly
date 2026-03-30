"use client";

import { useFormStore } from "@/stores/formStore";
import { FieldCard } from "./FieldCard";
import { AddFieldMenu } from "./AddFieldMenu";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface FieldListProps {
  formId: string;
}

export function FieldList({ formId }: FieldListProps) {
  const { schema, reorderFields, selectField, selectedFieldId } = useFormStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!schema) return null;

  const pageIndex = schema.pages.length - 1; // Current page
  const pageFields = schema.fields
    .filter((f) => f.pageIndex === pageIndex && f.type !== "page_break")
    .sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pageFields.findIndex((f) => f.id === active.id);
    const newIndex = pageFields.findIndex((f) => f.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      reorderFields(pageIndex, oldIndex, newIndex);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pageFields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {pageFields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                isSelected={field.id === selectedFieldId}
                onSelect={() => selectField(field.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        <AddFieldMenu pageIndex={pageIndex} />
      </div>
    </div>
  );
}
