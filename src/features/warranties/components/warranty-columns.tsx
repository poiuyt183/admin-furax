"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPhoneDisplay } from "@/lib/phone";

export type WarrantyRow = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  productId: string;
  productSku: string | null;
  productName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  reviewedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    warranty: string | null;
    primaryImage: string | null;
  };
};

const statusMeta: Record<
  WarrantyRow["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  PENDING: { label: "Chờ duyệt", variant: "secondary" },
  APPROVED: { label: "Đã kích hoạt", variant: "default" },
  REJECTED: { label: "Từ chối", variant: "destructive" },
};

interface WarrantyColumnsOptions {
  onView: (row: WarrantyRow) => void;
}

export function getWarrantyColumns({
  onView,
}: WarrantyColumnsOptions): ColumnDef<WarrantyRow>[] {
  return [
    {
      accessorKey: "createdAt",
      header: "Ngày gửi",
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm"),
    },
    {
      accessorKey: "customerName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium">{row.original.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {formatPhoneDisplay(row.original.customerPhone)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Sản phẩm",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium">{row.original.productName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.productSku ?? "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const meta = statusMeta[row.original.status];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      accessorKey: "endsAt",
      header: "Hạn BH",
      cell: ({ row }) =>
        row.original.endsAt
          ? format(new Date(row.original.endsAt), "dd/MM/yyyy")
          : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onView(row.original)}>
          <Eye className="size-4" />
          Chi tiết
        </Button>
      ),
    },
  ];
}
