"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowUpDown,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getYoutubeThumbnailUrl } from "@/lib/youtube";

type ReviewVideoRow = {
  id: string;
  title: string | null;
  youtubeUrl: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

interface ReviewVideoColumnsOptions {
  onEdit: (video: ReviewVideoRow) => void;
  onDelete: (video: ReviewVideoRow) => void;
}

export function getReviewVideoColumns({
  onEdit,
  onDelete,
}: ReviewVideoColumnsOptions): ColumnDef<ReviewVideoRow>[] {
  return [
    {
      accessorKey: "youtubeUrl",
      header: "Video",
      cell: ({ row }) => {
        const thumbnail = getYoutubeThumbnailUrl(row.original.youtubeUrl);

        return (
          <div className="flex items-center gap-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={row.original.title ?? "Video thumbnail"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">
                {row.original.title || "Video review"}
              </div>
              <a
                href={row.original.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 truncate max-w-[280px]"
              >
                {row.original.youtubeUrl}
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Danh mục",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category.name}</Badge>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "outline"}>
          {row.original.isActive ? "Hiển thị" : "Ẩn"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ngày tạo
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="size-4" />
              Chỉnh sửa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4" />
              Xoá
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
