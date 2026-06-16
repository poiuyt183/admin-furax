"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";
import type { CreateStoreInput } from "../store.schema";
import { getStoreColumns } from "./store-columns";
import { StoreDialog } from "./store-dialog";

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

export function StoreTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreRow | null>(null);
  const [deletingStore, setDeletingStore] = useState<StoreRow | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("ALL");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const { data: allStores = [] } = useQuery(
    trpc.store.list.queryOptions({}),
  );

  const { data: stores = [], isLoading } = useQuery(
    trpc.store.list.queryOptions({
      city: cityFilter !== "ALL" ? cityFilter : undefined,
      isActive:
        activeFilter === "ALL"
          ? undefined
          : activeFilter === "ACTIVE",
    }),
  );

  const cities = useMemo(
    () => [...new Set(allStores.map((store) => store.city))].sort(),
    [allStores],
  );

  const createMutation = useMutation(
    trpc.store.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.store.list.queryKey(),
        });
        setDialogOpen(false);
        toast.success("Thêm cửa hàng thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.store.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.store.list.queryKey(),
        });
        setDialogOpen(false);
        setEditingStore(null);
        toast.success("Cập nhật cửa hàng thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.store.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.store.list.queryKey(),
        });
        setDeletingStore(null);
        toast.success("Đã xoá cửa hàng");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleSubmit = (data: CreateStoreInput) => {
    if (editingStore) {
      updateMutation.mutate({ id: editingStore.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(
    () =>
      getStoreColumns({
        onEdit: (store) => {
          setEditingStore(store);
          setDialogOpen(true);
        },
        onDelete: setDeletingStore,
      }),
    [],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">
          Đang tải danh sách cửa hàng...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center">
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Thành phố" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả thành phố</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="ACTIVE">Đang hiển thị</SelectItem>
            <SelectItem value="INACTIVE">Đang ẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={stores}
        searchKey="name"
        searchPlaceholder="Tìm theo tên, thành phố, quận..."
        toolbar={
          <Button
            onClick={() => {
              setEditingStore(null);
              setDialogOpen(true);
            }}
            className="ml-auto"
          >
            <Plus className="size-4" />
            Thêm cửa hàng
          </Button>
        }
      />

      <StoreDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingStore(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={
          editingStore
            ? {
                id: editingStore.id,
                slug: editingStore.slug,
                name: editingStore.name,
                address: editingStore.address,
                city: editingStore.city,
                district: editingStore.district,
                phone: editingStore.phone,
                hours: editingStore.hours,
                lat: editingStore.lat,
                lng: editingStore.lng,
                isMainStore: editingStore.isMainStore,
                isActive: editingStore.isActive,
              }
            : undefined
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deletingStore}
        onOpenChange={(open) => !open && setDeletingStore(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá cửa hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá &ldquo;{deletingStore?.name}&rdquo;? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingStore) {
                  deleteMutation.mutate({ id: deletingStore.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
