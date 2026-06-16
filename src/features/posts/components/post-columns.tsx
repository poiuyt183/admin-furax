"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  publishedAt: string | null;
  category: { id: string; name: string } | null;
};

interface PostColumnsOptions {
  onDelete: (post: PostRow) => void;
}

export function getPostColumns({
  onDelete,
}: PostColumnsOptions): ColumnDef<PostRow>[] {
  return [
    {
      accessorKey: "coverImage",
      header: "",
      cell: ({ row }) => {
        const image = row.original.coverImage;
        return (
          <div className="size-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {image ? (
              <img
                src={image}
                alt={row.original.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-xs text-muted-foreground font-medium">
                {row.original.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bài viết
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[240px]">
            {row.original.category?.name ?? "Chưa phân loại"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={
              status === "PUBLISHED"
                ? "default"
                : status === "DRAFT"
                  ? "secondary"
                  : "outline"
            }
            className={
              status === "PUBLISHED"
                ? "bg-green-500 hover:bg-green-600"
                : status === "DRAFT"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : ""
            }
          >
            {status === "PUBLISHED"
              ? "Đã xuất bản"
              : status === "DRAFT"
                ? "Bản nháp"
                : "Đã lưu trữ"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
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
            <DropdownMenuItem asChild>
              <Link href={`/posts/${row.original.id}/edit`}>
                <Pencil className="size-4" />
                Chỉnh sửa
              </Link>
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
