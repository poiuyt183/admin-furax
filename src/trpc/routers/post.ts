import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createPostSchema,
  updatePostSchema,
} from "@/features/posts/post.schema";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

function serializePost<
  TPost extends {
    createdAt: Date;
    updatedAt: Date;
    publishedAt: Date | null;
  },
>(post: TPost) {
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null,
  };
}

function normalizePostFields(
  data: z.infer<typeof createPostSchema> | z.infer<typeof updatePostSchema>,
) {
  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.slug !== undefined ? { slug: data.slug } : {}),
    ...(data.excerpt !== undefined ? { excerpt: data.excerpt || null } : {}),
    ...(data.content !== undefined ? { content: data.content || null } : {}),
    ...(data.coverImage !== undefined
      ? { coverImage: data.coverImage || null }
      : {}),
    ...(data.categoryId !== undefined
      ? { categoryId: data.categoryId || null }
      : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
  };
}

function resolvePublishedAt(
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
  existingPublishedAt?: Date | null,
): Date | null | undefined {
  if (status === "PUBLISHED") {
    return existingPublishedAt ?? new Date();
  }
  if (status === "DRAFT" || status === "ARCHIVED") {
    return null;
  }
  return undefined;
}

export const postRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
          categoryId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};

      if (input?.search) {
        where.title = { contains: input.search, mode: "insensitive" };
      }
      if (input?.status) {
        where.status = input.status;
      }
      if (input?.categoryId) {
        where.categoryId = input.categoryId;
      }

      const posts = await prisma.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      return posts.map(serializePost);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await prisma.post.findUnique({
        where: { id: input.id },
        include: {
          category: { select: { id: true, name: true } },
        },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy bài viết",
        });
      }
      return serializePost(post);
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ input }) => {
      const existing = await prisma.post.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Đường dẫn đã tồn tại",
        });
      }

      const { title, slug, excerpt, content, coverImage, status, categoryId } =
        input;

      const post = await prisma.post.create({
        data: {
          title,
          slug,
          excerpt: excerpt || null,
          content: content || null,
          coverImage: coverImage || null,
          status,
          categoryId: categoryId || null,
          publishedAt: resolvePublishedAt(status) ?? null,
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      return serializePost(post);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updatePostSchema }))
    .mutation(async ({ input }) => {
      const post = await prisma.post.findUnique({
        where: { id: input.id },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy bài viết",
        });
      }

      if (input.data.slug && input.data.slug !== post.slug) {
        const existing = await prisma.post.findUnique({
          where: { slug: input.data.slug },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Đường dẫn đã tồn tại",
          });
        }
      }

      const updatedPost = await prisma.post.update({
        where: { id: input.id },
        data: {
          ...normalizePostFields(input.data),
          ...(resolvePublishedAt(input.data.status, post.publishedAt) !==
          undefined
            ? {
                publishedAt: resolvePublishedAt(
                  input.data.status,
                  post.publishedAt,
                ),
              }
            : {}),
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      return serializePost(updatedPost);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
      }),
    )
    .mutation(async ({ input }) => {
      const post = await prisma.post.findUnique({
        where: { id: input.id },
      });
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy bài viết",
        });
      }

      const updatedPost = await prisma.post.update({
        where: { id: input.id },
        data: {
          status: input.status,
          publishedAt: resolvePublishedAt(input.status, post.publishedAt) ?? null,
        },
      });

      return serializePost(updatedPost);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.post.delete({ where: { id: input.id } });
    }),
});
