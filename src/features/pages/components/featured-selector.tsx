"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { X, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  name: string;
  image: string | null;
}

interface SelectorUIProps {
  allItems: Item[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label: string;
}

// --- Skeleton fallback ---
export function FeaturedSelectorSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-52 w-full rounded-md" />
    </div>
  );
}

// --- Shared picker UI ---
function SelectorUI({ allItems, selectedIds, onChange, label }: SelectorUIProps) {
  const [search, setSearch] = useState("");

  const selectedItems = useMemo(
    () => selectedIds.map((id) => allItems.find((i) => i.id === id)).filter(Boolean) as Item[],
    [selectedIds, allItems],
  );

  const filteredItems = useMemo(
    () =>
      allItems.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) &&
          !selectedIds.includes(item.id),
      ),
    [allItems, search, selectedIds],
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((i) => i !== id));
    else onChange([...selectedIds, id]);
  };

  const remove = (id: string) => onChange(selectedIds.filter((i) => i !== id));

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <Badge key={item.id} variant="secondary" className="gap-1.5 pr-1.5 py-1">
              {item.image && (
                <img src={item.image} alt={item.name} className="size-4 rounded-sm object-cover" />
              )}
              <span className="text-sm">{item.name}</span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selectedItems.length > 0 && <Separator />}

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={`Tìm ${label}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-52 rounded-md border">
          <div className="p-1">
            {filteredItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {search ? "Không tìm thấy kết quả" : "Tất cả đã được chọn"}
              </p>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors text-left",
                    "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="size-8 rounded-md object-cover shrink-0 border"
                    />
                  ) : (
                    <div className="size-8 rounded-md bg-muted shrink-0" />
                  )}
                  <span className="flex-1 truncate">{item.name}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Đã chọn {selectedIds.length} {label}
        </p>
      )}
    </div>
  );
}

// --- Category selector (suspends while fetching) ---
export function CategorySelector({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const trpc = useTRPC();
  const { data: categories } = useSuspenseQuery(trpc.category.list.queryOptions());

  const items: Item[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    image: c.image ?? null,
  }));

  return <SelectorUI allItems={items} selectedIds={selectedIds} onChange={onChange} label="danh mục" />;
}

// --- Product selector (suspends while fetching) ---
export function ProductSelector({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const trpc = useTRPC();
  const { data: products } = useSuspenseQuery(trpc.product.list.queryOptions());

  const items: Item[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.primaryImage ?? null,
  }));

  return <SelectorUI allItems={items} selectedIds={selectedIds} onChange={onChange} label="sản phẩm" />;
}
