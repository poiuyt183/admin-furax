"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTRPC } from "@/trpc/client";

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

type ProductStatus = ProductRow["status"];
type StatusFilter = ProductStatus | "ALL";

const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; className: string }
> = {
  PUBLISHED: {
    label: "Đã xuất bản",
    className: "bg-green-500 text-white hover:bg-green-600",
  },
  DRAFT: {
    label: "Bản nháp",
    className: "bg-yellow-500 text-white hover:bg-yellow-600",
  },
  ARCHIVED: {
    label: "Đã lưu trữ",
    className: "",
  },
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedValue(value),
      delayMs,
    );

    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

function formatPrice(value: ProductRow["price"]) {
  const price = typeof value === "string" ? Number.parseFloat(value) : value;
  return new Intl.NumberFormat("vi-VN").format(price);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function ProductTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [deletingProduct, setDeletingProduct] = useState<ProductRow | null>(
    null,
  );
  const [selectedRows, setSelectedRows] = useState<ProductRow[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data: categories = [] } = useQuery(trpc.category.list.queryOptions());

  const { data: products = [], isLoading } = useQuery({
    ...trpc.product.list.queryOptions({
      search: debouncedSearchQuery || undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      categoryId: categoryFilter !== "ALL" ? categoryFilter : undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation(
    trpc.product.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        });
        setDeletingProduct(null);
        toast.success("Đã xoá sản phẩm thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateStatusMutation = useMutation(
    trpc.product.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        });
        toast.success("Đã cập nhật trạng thái sản phẩm");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const bulkDeleteMutation = useMutation(
    trpc.product.bulkDelete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        });
        setBulkDeleting(false);
        setSelectedRows([]);
        toast.success("Đã xoá các sản phẩm thành công");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const bulkUpdateStatusMutation = useMutation(
    trpc.product.bulkUpdateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        });
        setSelectedRows([]);
        toast.success("Đã cập nhật trạng thái các sản phẩm");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleDelete = useCallback((product: ProductRow) => {
    setDeletingProduct(product);
  }, []);

  const handleStatusChange = useCallback(
    (product: ProductRow, newStatus: ProductStatus) => {
      updateStatusMutation.mutate({ id: product.id, status: newStatus });
    },
    [updateStatusMutation],
  );

  const handleBulkStatusChange = (newStatus: ProductStatus) => {
    if (selectedRows.length === 0) return;
    bulkUpdateStatusMutation.mutate({
      ids: selectedRows.map((r) => r.id),
      status: newStatus,
    });
  };

  const selectedProductIds = useMemo(
    () => new Set(selectedRows.map((product) => product.id)),
    [selectedRows],
  );

  const handleSelectionChange = useCallback(
    (product: ProductRow, checked: boolean) => {
      setSelectedRows((currentRows) => {
        if (checked) {
          if (currentRows.some((row) => row.id === product.id)) {
            return currentRows;
          }

          return [...currentRows, product];
        }

        return currentRows.filter((row) => row.id !== product.id);
      });
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2 w-full">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="ARCHIVED">Đã lưu trữ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <Select
                onValueChange={(value) =>
                  handleBulkStatusChange(value as ProductStatus)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Đặt trạng thái..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">Đặt xuất bản</SelectItem>
                  <SelectItem value="DRAFT">Đặt bản nháp</SelectItem>
                  <SelectItem value="ARCHIVED">Đặt lưu trữ</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setBulkDeleting(true)}
              >
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
          <Button asChild>
            <Link href="/products/new">
              <Plus className="size-4 mr-2" />
              Thêm sản phẩm
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Đang tải dữ liệu sản phẩm...
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center">
          <div>
            <p className="font-medium">Không tìm thấy sản phẩm</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Thử đổi bộ lọc hoặc thêm sản phẩm mới.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {products.map((product) => {
            const status = PRODUCT_STATUS_META[product.status];
            const isSelected = selectedProductIds.has(product.id);

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-lg border bg-card text-card-foreground shadow-xs transition-colors hover:border-primary/40"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {product.primaryImage ? (
                    <img
                      src={product.primaryImage}
                      alt={product.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-4xl font-semibold text-muted-foreground">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="absolute left-3 top-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectionChange(product, checked === true)
                      }
                      aria-label={`Chọn ${product.name}`}
                      className="bg-background/90 shadow-sm"
                    />
                  </div>

                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="size-8 bg-background/90 shadow-sm hover:bg-background"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.id}/edit`}>
                            <Pencil className="size-4 mr-2" />
                            Chỉnh sửa
                          </Link>
                        </DropdownMenuItem>
                        {product.status !== "PUBLISHED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(product, "PUBLISHED")
                            }
                          >
                            Xuất bản
                          </DropdownMenuItem>
                        )}
                        {product.status !== "DRAFT" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(product, "DRAFT")}
                          >
                            Chuyển về nháp
                          </DropdownMenuItem>
                        )}
                        {product.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(product, "ARCHIVED")
                            }
                          >
                            Lưu trữ
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(product)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Xoá
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5">
                        {product.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {product.category?.name ?? "Chưa phân loại"}
                      </p>
                    </div>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </div>

                  <div className="flex items-end justify-between gap-3 border-t pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Giá</p>
                      <p className="text-base font-semibold">
                        {formatPrice(product.price)} ₫
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Ngày tạo</p>
                      <p className="text-sm">{formatDate(product.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Single Delete Alert */}
      <AlertDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá &ldquo;{deletingProduct?.name}&rdquo;? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingProduct) {
                  deleteMutation.mutate({ id: deletingProduct.id });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Alert */}
      <AlertDialog
        open={bulkDeleting}
        onOpenChange={(open) => !open && setBulkDeleting(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xoá {selectedRows.length} sản phẩm?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá {selectedRows.length} sản phẩm đã chọn? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                bulkDeleteMutation.mutate({
                  ids: selectedRows.map((r) => r.id),
                });
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
