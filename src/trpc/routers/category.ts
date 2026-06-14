import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/features/categories/category.schema";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

function serializeCategory<
  TCategory extends { createdAt: Date; updatedAt: Date },
>(category: TCategory) {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export const categoryRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    const categories = await prisma.category.findMany({
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map(serializeCategory);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const category = await prisma.category.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { products: true },
          },
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy danh mục",
        });
      }
      return serializeCategory(category);
    }),

  create: protectedProcedure
    .input(createCategorySchema)
    .mutation(async ({ input }) => {
      const existing = await prisma.category.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Đường dẫn đã tồn tại",
        });
      }

      const maxPosition = await prisma.category.aggregate({
        _max: { position: true },
      });

      const category = await prisma.category.create({
        data: {
          ...input,
          image: input.image || null,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });

      return serializeCategory(category);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateCategorySchema }))
    .mutation(async ({ input }) => {
      const category = await prisma.category.findUnique({
        where: { id: input.id },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy danh mục",
        });
      }

      if (input.data.slug && input.data.slug !== category.slug) {
        const existing = await prisma.category.findUnique({
          where: { slug: input.data.slug },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Đường dẫn đã tồn tại",
          });
        }
      }

      const updatedCategory = await prisma.category.update({
        where: { id: input.id },
        data: {
          ...input.data,
          image: input.data.image || null,
        },
      });

      return serializeCategory(updatedCategory);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const category = await prisma.category.findUnique({
        where: { id: input.id },
        include: { _count: { select: { products: true } } },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy danh mục",
        });
      }
      if (category._count.products > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Không thể xoá: ${category._count.products} sản phẩm vẫn đang dùng danh mục này. Hãy chuyển chúng sang danh mục khác trước.`,
        });
      }

      return prisma.category.delete({ where: { id: input.id } });
    }),
});
