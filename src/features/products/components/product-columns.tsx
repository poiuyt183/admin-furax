"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  primaryImage: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  category: { id: string; name: string } | null;
};

interface ProductColumnsOptions {
  onDelete: (product: ProductRow) => void;
  onStatusChange: (
    product: ProductRow,
    newStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  ) => void;
}

export function getProductColumns({
  onDelete,
  onStatusChange,
}: ProductColumnsOptions): ColumnDef<ProductRow>[] {
  return [
    {
      accessorKey: "primaryImage",
      header: "",
      cell: ({ row }) => {
        const image = row.original.primaryImage;
        return (
          <div className="size-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            {image ? (
              <img
                src={image}
                alt={row.original.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-xs text-muted-foreground font-medium">
                {row.original.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sản phẩm
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
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
      accessorKey: "price",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Giá
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const price =
          typeof row.original.price === "string"
            ? Number.parseFloat(row.original.price)
            : row.original.price;
        const formatted = new Intl.NumberFormat("vi-VN").format(price);
        return <div className="font-medium">{formatted} ₫</div>;
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
              <Link href={`/products/${row.original.id}/edit`}>
                <Pencil className="size-4 mr-2" />
                Chỉnh sửa
              </Link>
            </DropdownMenuItem>
            {row.original.status !== "PUBLISHED" && (
              <DropdownMenuItem
                onClick={() => onStatusChange(row.original, "PUBLISHED")}
              >
                Xuất bản
              </DropdownMenuItem>
            )}
            {row.original.status !== "DRAFT" && (
              <DropdownMenuItem
                onClick={() => onStatusChange(row.original, "DRAFT")}
              >
                Chuyển về nháp
              </DropdownMenuItem>
            )}
            {row.original.status !== "ARCHIVED" && (
              <DropdownMenuItem
                onClick={() => onStatusChange(row.original, "ARCHIVED")}
              >
                Lưu trữ
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-4 mr-2" />
              Xoá
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
