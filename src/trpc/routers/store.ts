import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createStoreSchema,
  updateStoreSchema,
} from "@/features/stores/store.schema";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

function serializeStore<
  TStore extends { createdAt: Date; updatedAt: Date },
>(store: TStore) {
  return {
    ...store,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}

export const storeRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          city: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};

      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { address: { contains: input.search, mode: "insensitive" } },
          { city: { contains: input.search, mode: "insensitive" } },
          { district: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input?.city) {
        where.city = input.city;
      }
      if (input?.isActive !== undefined) {
        where.isActive = input.isActive;
      }

      const stores = await prisma.store.findMany({
        where,
        orderBy: [{ position: "asc" }, { name: "asc" }],
      });

      return stores.map(serializeStore);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const store = await prisma.store.findUnique({
        where: { id: input.id },
      });
      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy cửa hàng",
        });
      }
      return serializeStore(store);
    }),

  create: protectedProcedure
    .input(createStoreSchema)
    .mutation(async ({ input }) => {
      const existing = await prisma.store.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Mã cửa hàng đã tồn tại",
        });
      }

      const maxPosition = await prisma.store.aggregate({
        _max: { position: true },
      });

      const store = await prisma.store.create({
        data: {
          ...input,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });

      return serializeStore(store);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateStoreSchema }))
    .mutation(async ({ input }) => {
      const store = await prisma.store.findUnique({
        where: { id: input.id },
      });
      if (!store) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy cửa hàng",
        });
      }

      if (input.data.slug && input.data.slug !== store.slug) {
        const existing = await prisma.store.findUnique({
          where: { slug: input.data.slug },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Mã cửa hàng đã tồn tại",
          });
        }
      }

      const updatedStore = await prisma.store.update({
        where: { id: input.id },
        data: input.data,
      });

      return serializeStore(updatedStore);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.store.delete({ where: { id: input.id } });
    }),
});
