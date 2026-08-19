"use client";

import { useState } from "react";
import {
  GripVertical,
  List,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TRUST_ICON_OPTIONS } from "../trust-icons";
import { type TrustIconKey, type TrustItem } from "../trust-items";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function TrustItemRow({
  item,
  index,
  isDragOver,
  dragOverPosition,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: TrustItem;
  index: number;
  isDragOver: boolean;
  dragOverPosition: "top" | "bottom" | null;
  onChange: (item: TrustItem) => void;
  onRemove: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (event: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const selectedIcon = TRUST_ICON_OPTIONS.find((option) => option.value === item.icon);
  const SelectedIcon = selectedIcon?.icon;

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
        onDragStart(index);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver(event, index);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(index);
      }}
      className={[
        "relative flex items-center gap-2 rounded-lg border bg-card p-3 transition-all select-none",
        isDragging ? "opacity-40 scale-[0.98] shadow-none" : "shadow-sm",
        isDragOver ? "ring-2 ring-primary" : "",
      ].join(" ")}
    >
      {isDragOver && dragOverPosition === "top" && (
        <div className="absolute top-0 left-4 right-4 h-0.5 -translate-y-1 bg-primary rounded-full" />
      )}
      {isDragOver && dragOverPosition === "bottom" && (
        <div className="absolute bottom-0 left-4 right-4 h-0.5 translate-y-1 bg-primary rounded-full" />
      )}

      <GripVertical className="size-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />

      <Select
        value={item.icon}
        onValueChange={(value) =>
          onChange({ ...item, icon: value as TrustIconKey })
        }
      >
        <SelectTrigger
          className="w-[168px] shrink-0"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              {SelectedIcon ? <SelectedIcon className="size-4" /> : null}
              {selectedIcon?.label ?? "Chọn icon"}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {TRUST_ICON_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <Icon className="size-4" />
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Input
        value={item.text}
        onChange={(event) => onChange({ ...item, text: event.target.value })}
        placeholder="Nội dung hiển thị trên dải chạy"
        maxLength={120}
        className="flex-1"
        onPointerDown={(event) => event.stopPropagation()}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function TrustStripEditor({
  items,
  onChange,
  onSave,
  isSaving,
}: {
  items: TrustItem[];
  onChange: (items: TrustItem[]) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<"top" | "bottom" | null>(
    null,
  );

  const handleDragStart = (index: number) => setDragFromIndex(index);

  const handleDragOver = (event: React.DragEvent, index: number) => {
    if (dragFromIndex === null || dragFromIndex === index) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverIndex(index);
    setDragOverPosition(event.clientY < midY ? "top" : "bottom");
  };

  const handleDrop = (toIndex: number) => {
    if (dragFromIndex === null || dragFromIndex === toIndex) {
      setDragFromIndex(null);
      setDragOverIndex(null);
      setDragOverPosition(null);
      return;
    }

    onChange((() => {
      const next = [...items];
      const [moved] = next.splice(dragFromIndex, 1);
      const insertAt = dragOverPosition === "top" ? toIndex : toIndex + 1;
      const adjustedIndex = dragFromIndex < toIndex ? insertAt - 1 : insertAt;
      next.splice(adjustedIndex, 0, moved);
      return next;
    })());

    setDragFromIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const handleDragEnd = () => {
    setDragFromIndex(null);
    setDragOverIndex(null);
    setDragOverPosition(null);
  };

  const addItem = () => {
    onChange([
      ...items,
      { id: generateId(), icon: "star", text: "" },
    ]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <List className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">Dải chạy cam kết</CardTitle>
          <CardDescription>
            Các dòng chữ chạy ngay dưới banner trang chủ
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="size-4" />
          Thêm mục
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Lưu
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <List className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Chưa có mục nào — dải chạy sẽ bị ẩn trên trang chủ
            </p>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="size-4" />
              Thêm mục đầu tiên
            </Button>
          </div>
        ) : (
          items.map((item, index) => (
            <TrustItemRow
              key={item.id}
              item={item}
              index={index}
              isDragOver={dragOverIndex === index}
              dragOverPosition={dragOverIndex === index ? dragOverPosition : null}
              onChange={(updated) =>
                onChange(items.map((current, i) => (i === index ? updated : current)))
              }
              onRemove={() => onChange(items.filter((_, i) => i !== index))}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
