import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createReviewVideoSchema,
  updateReviewVideoSchema,
} from "@/features/review-videos/review-video.schema";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

function serializeReviewVideo<
  TVideo extends {
    createdAt: Date;
    updatedAt: Date;
    category: { id: string; name: string; slug: string };
  },
>(video: TVideo) {
  return {
    ...video,
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString(),
  };
}

export const reviewVideoRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          categoryId: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};

      if (input?.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { youtubeUrl: { contains: input.search, mode: "insensitive" } },
          {
            category: {
              name: { contains: input.search, mode: "insensitive" },
            },
          },
        ];
      }
      if (input?.categoryId) {
        where.categoryId = input.categoryId;
      }
      if (input?.isActive !== undefined) {
        where.isActive = input.isActive;
      }

      const videos = await prisma.reviewVideo.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      });

      return videos.map(serializeReviewVideo);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const video = await prisma.reviewVideo.findUnique({
        where: { id: input.id },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy video",
        });
      }

      return serializeReviewVideo(video);
    }),

  create: protectedProcedure
    .input(createReviewVideoSchema)
    .mutation(async ({ input }) => {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy danh mục sản phẩm",
        });
      }

      const maxPosition = await prisma.reviewVideo.aggregate({
        _max: { position: true },
      });

      const video = await prisma.reviewVideo.create({
        data: {
          title: input.title?.trim() || null,
          youtubeUrl: input.youtubeUrl.trim(),
          categoryId: input.categoryId,
          isActive: input.isActive,
          position: (maxPosition._max.position ?? -1) + 1,
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      return serializeReviewVideo(video);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateReviewVideoSchema }))
    .mutation(async ({ input }) => {
      const video = await prisma.reviewVideo.findUnique({
        where: { id: input.id },
      });

      if (!video) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy video",
        });
      }

      if (input.data.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: input.data.categoryId },
        });

        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Không tìm thấy danh mục sản phẩm",
          });
        }
      }

      const updatedVideo = await prisma.reviewVideo.update({
        where: { id: input.id },
        data: {
          ...input.data,
          title:
            input.data.title !== undefined
              ? input.data.title?.trim() || null
              : undefined,
          youtubeUrl: input.data.youtubeUrl?.trim(),
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      return serializeReviewVideo(updatedVideo);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.reviewVideo.delete({ where: { id: input.id } });
    }),
});
