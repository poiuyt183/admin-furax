import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { normalizeVietnamPhone } from "@/lib/phone";
import { addMonths, parseWarrantyMonths } from "@/lib/warranty";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

const warrantyStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

function serializeActivation<
  T extends {
    createdAt: Date;
    updatedAt: Date;
    reviewedAt: Date | null;
    startsAt: Date | null;
    endsAt: Date | null;
  },
>(activation: T) {
  return {
    ...activation,
    createdAt: activation.createdAt.toISOString(),
    updatedAt: activation.updatedAt.toISOString(),
    reviewedAt: activation.reviewedAt?.toISOString() ?? null,
    startsAt: activation.startsAt?.toISOString() ?? null,
    endsAt: activation.endsAt?.toISOString() ?? null,
  };
}

export const warrantyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          status: warrantyStatusSchema.optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const where: Record<string, unknown> = {};

      if (input?.status) {
        where.status = input.status;
      }

      if (input?.search?.trim()) {
        const search = input.search.trim();
        const normalizedPhone = normalizeVietnamPhone(search);
        where.OR = [
          { customerName: { contains: search, mode: "insensitive" } },
          { customerPhone: { contains: search.replace(/\D/g, "") } },
          ...(normalizedPhone ? [{ customerPhone: normalizedPhone }] : []),
          { productName: { contains: search, mode: "insensitive" } },
          { productSku: { contains: search, mode: "insensitive" } },
        ];
      }

      const activations = await prisma.warrantyActivation.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              warranty: true,
              primaryImage: true,
            },
          },
        },
      });

      return activations.map(serializeActivation);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const activation = await prisma.warrantyActivation.findUnique({
        where: { id: input.id },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              warranty: true,
              primaryImage: true,
            },
          },
        },
      });

      if (!activation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy yêu cầu bảo hành",
        });
      }

      return serializeActivation(activation);
    }),

  approve: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        adminNote: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const activation = await prisma.warrantyActivation.findUnique({
        where: { id: input.id },
        include: {
          product: { select: { warranty: true } },
        },
      });

      if (!activation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy yêu cầu bảo hành",
        });
      }

      if (activation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Yêu cầu đã được xử lý",
        });
      }

      const now = new Date();
      const months = parseWarrantyMonths(activation.product.warranty);
      const endsAt = addMonths(now, months);

      const updated = await prisma.warrantyActivation.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          adminNote: input.adminNote || null,
          reviewedAt: now,
          reviewedById: ctx.auth.user.id,
          startsAt: now,
          endsAt,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              warranty: true,
              primaryImage: true,
            },
          },
        },
      });

      return serializeActivation(updated);
    }),

  reject: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        adminNote: z.string().trim().max(500).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const activation = await prisma.warrantyActivation.findUnique({
        where: { id: input.id },
      });

      if (!activation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy yêu cầu bảo hành",
        });
      }

      if (activation.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Yêu cầu đã được xử lý",
        });
      }

      const updated = await prisma.warrantyActivation.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          adminNote: input.adminNote || null,
          reviewedAt: new Date(),
          reviewedById: ctx.auth.user.id,
          startsAt: null,
          endsAt: null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              warranty: true,
              primaryImage: true,
            },
          },
        },
      });

      return serializeActivation(updated);
    }),
});
