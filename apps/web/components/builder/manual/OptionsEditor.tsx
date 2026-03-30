"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldOption } from "@formly/shared/types/form-schema";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OptionsEditorProps {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}

function SortableOption({
  option,
  onUpdate,
  onDelete,
}: {
  option: FieldOption;
  onUpdate: (label: string, value: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2",
        isDragging && "opacity-50"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <Input
        value={option.label}
        onChange={(e) => onUpdate(e.target.value, e.target.value.toLowerCase().replace(/\s+/g, "_"))}
        placeholder="Option label"
        className="flex-1"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addOption = () => {
    const newOption: FieldOption = {
      id: crypto.randomUUID(),
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    onChange([...options, newOption]);
  };

  const updateOption = (id: string, label: string, value: string) => {
    onChange(options.map((o) => (o.id === id ? { ...o, label, value } : o)));
  };

  const deleteOption = (id: string) => {
    onChange(options.filter((o) => o.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = options.findIndex((o) => o.id === active.id);
    const newIndex = options.findIndex((o) => o.id === over.id);

    const newOptions = [...options];
    const [moved] = newOptions.splice(oldIndex, 1);
    newOptions.splice(newIndex, 0, moved);
    onChange(newOptions);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Options</label>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {options.map((option) => (
              <SortableOption
                key={option.id}
                option={option}
                onUpdate={(label, value) => updateOption(option.id, label, value)}
                onDelete={() => deleteOption(option.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button variant="outline" size="sm" onClick={addOption} className="mt-2">
        <Plus className="w-4 h-4 mr-1" />
        Add Option
      </Button>
    </div>
  );
}
