import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createPostCategorySchema,
  updatePostCategorySchema,
} from "@/features/post-categories/post-category.schema";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

function serializePostCategory<
  TCategory extends { createdAt: Date; updatedAt: Date },
>(category: TCategory) {
  return {
    ...category,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export const postCategoryRouter = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    const categories = await prisma.postCategory.findMany({
      orderBy: { position: "asc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return categories.map(serializePostCategory);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const category = await prisma.postCategory.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy danh mục bài viết",
        });
      }
      return serializePostCategory(category);
    }),

  create: protectedProcedure
    .input(createPostCategorySchema)
    .mutation(async ({ input }) => {
      const existing = await prisma.postCategory.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Đường dẫn đã tồn tại",
        });
      }

      const maxPosition = await prisma.postCategory.aggregate({
        _max: { position: true },
      });

      const category = await prisma.postCategory.create({
        data: {
          ...input,
          image: input.image || null,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });

      return serializePostCategory(category);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updatePostCategorySchema }))
    .mutation(async ({ input }) => {
      const category = await prisma.postCategory.findUnique({
        where: { id: input.id },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy danh mục bài viết",
        });
      }

      if (input.data.slug && input.data.slug !== category.slug) {
        const existing = await prisma.postCategory.findUnique({
          where: { slug: input.data.slug },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Đường dẫn đã tồn tại",
          });
        }
      }

      const updatedCategory = await prisma.postCategory.update({
        where: { id: input.id },
        data: {
          ...input.data,
          image: input.data.image || null,
        },
      });

      return serializePostCategory(updatedCategory);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const category = await prisma.postCategory.findUnique({
        where: { id: input.id },
        include: { _count: { select: { posts: true } } },
      });
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy danh mục bài viết",
        });
      }
      if (category._count.posts > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Không thể xoá: ${category._count.posts} bài viết vẫn đang dùng danh mục này. Hãy chuyển chúng sang danh mục khác trước.`,
        });
      }

      return prisma.postCategory.delete({ where: { id: input.id } });
    }),
});
