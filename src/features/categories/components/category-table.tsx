"use client"

import { useState, useMemo } from "react"
import { useTRPC } from "@/trpc/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { getCategoryColumns } from "./category-columns"
import { CategoryDialog } from "./category-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { CreateCategoryInput } from "../category.schema"

type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  createdAt: string
  _count: { products: number }
}

export function CategoryTable() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<CategoryRow | null>(null)

  const { data: categories = [], isLoading } = useQuery(trpc.category.list.queryOptions())

  const createMutation = useMutation(
    trpc.category.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.category.list.queryKey() })
        setDialogOpen(false)
        toast.success("Tạo danh mục thành công")
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const updateMutation = useMutation(
    trpc.category.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.category.list.queryKey() })
        setDialogOpen(false)
        setEditingCategory(null)
        toast.success("Cập nhật danh mục thành công")
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.category.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.category.list.queryKey() })
        setDeletingCategory(null)
        toast.success("Đã xoá danh mục")
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const handleSubmit = (data: CreateCategoryInput) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (category: CategoryRow) => {
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDelete = (category: CategoryRow) => {
    setDeletingCategory(category)
  }

  const columns = useMemo(
    () => getCategoryColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    []
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Đang tải dữ liệu danh mục...</div>
      </div>
    )
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        searchPlaceholder="Tìm kiếm danh mục..."
        toolbar={
          <Button
            onClick={() => {
              setEditingCategory(null)
              setDialogOpen(true)
            }}
            className="ml-auto"
          >
            <Plus className="size-4" />
            Thêm danh mục
          </Button>
        }
      />

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}
        onSubmit={handleSubmit}
        defaultValues={
          editingCategory
            ? {
                id: editingCategory.id,
                name: editingCategory.name,
                slug: editingCategory.slug,
                description: editingCategory.description ?? "",
                image: editingCategory.image ?? "",
              }
            : undefined
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xoá &ldquo;{deletingCategory?.name}&rdquo;?
              Hành động này không thể hoàn tác.
              {(deletingCategory?._count?.products ?? 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Danh mục này đang có {deletingCategory?._count.products} sản phẩm.
                  Bạn phải chuyển các sản phẩm này sang danh mục khác trước khi xoá.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingCategory) {
                  deleteMutation.mutate({ id: deletingCategory.id })
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
  )
}
