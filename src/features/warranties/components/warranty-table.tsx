"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import { getWarrantyColumns, type WarrantyRow } from "./warranty-columns";
import { WarrantyReviewDialog } from "./warranty-review-dialog";

export function WarrantyTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WarrantyRow | null>(null);

  const listInput = {
    status:
      statusFilter === "ALL"
        ? undefined
        : (statusFilter as "PENDING" | "APPROVED" | "REJECTED"),
    search: search.trim() || undefined,
  };

  const { data: warranties = [], isLoading } = useQuery(
    trpc.warranty.list.queryOptions(listInput),
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.warranty.list.queryKey(),
    });
  };

  const approveMutation = useMutation(
    trpc.warranty.approve.mutationOptions({
      onSuccess: () => {
        invalidate();
        setSelected(null);
        toast.success("Đã kích hoạt bảo hành");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const rejectMutation = useMutation(
    trpc.warranty.reject.mutationOptions({
      onSuccess: () => {
        invalidate();
        setSelected(null);
        toast.success("Đã từ chối yêu cầu");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const columns = useMemo(
    () =>
      getWarrantyColumns({
        onView: setSelected,
      }),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Đang tải danh sách bảo hành...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
            <SelectItem value="APPROVED">Đã kích hoạt</SelectItem>
            <SelectItem value="REJECTED">Từ chối</SelectItem>
            <SelectItem value="ALL">Tất cả</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên, SĐT, sản phẩm..."
          className="w-full sm:max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={warranties}
        searchPlaceholder="Tìm trong bảng..."
      />

      <WarrantyReviewDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        warranty={selected}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
        onApprove={(adminNote) => {
          if (!selected) return;
          approveMutation.mutate({ id: selected.id, adminNote });
        }}
        onReject={(adminNote) => {
          if (!selected) return;
          rejectMutation.mutate({ id: selected.id, adminNote });
        }}
      />
    </>
  );
}
