"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ArrowUpDown,
  Crown,
  MapPin,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StoreRow = {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  hours: string;
  lat: number;
  lng: number;
  isMainStore: boolean;
  isActive: boolean;
  createdAt: string;
};

interface StoreColumnsOptions {
  onEdit: (store: StoreRow) => void;
  onDelete: (store: StoreRow) => void;
}

export function getStoreColumns({
  onEdit,
  onDelete,
}: StoreColumnsOptions): ColumnDef<StoreRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cửa hàng
          <ArrowUpDown className="ml-2 size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium flex items-center gap-1.5">
            {row.original.isMainStore && (
              <Crown className="size-3.5 text-amber-500 shrink-0" />
            )}
            {row.original.name}
          </div>
          <div className="text-xs text-muted-foreground">{row.original.slug}</div>
        </div>
      ),
    },
    {
      id: "location",
      header: "Khu vực",
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.city}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.district}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Điện thoại",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.phone}</span>
      ),
    },
    {
      accessorKey: "hours",
      header: "Giờ mở cửa",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.hours}</span>
      ),
    },
    {
      id: "coordinates",
      header: "Tọa độ",
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground font-mono">
          {row.original.lat.toFixed(4)}, {row.original.lng.toFixed(4)}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Hiển thị" : "Ẩn"}
        </Badge>
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
              <a
                href={`https://www.google.com/maps?q=${row.original.lat},${row.original.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="size-4" />
                Xem trên bản đồ
              </a>
            </DropdownMenuItem>
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
