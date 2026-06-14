import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  createProductSchema,
  updateProductSchema,
} from "@/features/products/product.schema";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

function serializeProduct<
  TProduct extends {
    price: { toString: () => string };
    createdAt: Date;
    updatedAt: Date;
  },
>(product: TProduct) {
  return {
    ...product,
    price: product.price.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export const productRouter = createTRPCRouter({
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
        where.name = { contains: input.search, mode: "insensitive" };
      }
      if (input?.status) {
        where.status = input.status;
      }
      if (input?.categoryId) {
        where.categoryId = input.categoryId;
      }

      const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { position: "asc" } },
        },
      });

      return products.map(serializeProduct);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { position: "asc" } },
        },
      });
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy sản phẩm",
        });
      }
      return serializeProduct(product);
    }),

  create: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      const existing = await prisma.product.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Đường dẫn đã tồn tại",
        });
      }

      const { images, ...productData } = input;

      const product = await prisma.product.create({
        data: {
          ...productData,
          primaryImage: productData.primaryImage || null,
          categoryId: productData.categoryId || null,
          images: images?.length
            ? {
                create: images.map((img, index) => ({
                  url: img.url,
                  alt: img.alt || null,
                  position: index,
                })),
              }
            : undefined,
        },
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { position: "asc" } },
        },
      });

      return serializeProduct(product);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: updateProductSchema }))
    .mutation(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id },
      });
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Không tìm thấy sản phẩm",
        });
      }

      if (input.data.slug && input.data.slug !== product.slug) {
        const existing = await prisma.product.findUnique({
          where: { slug: input.data.slug },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Đường dẫn đã tồn tại",
          });
        }
      }

      const { images, ...productData } = input.data;

      return prisma.$transaction(async (tx) => {
        if (images !== undefined) {
          await tx.productImage.deleteMany({ where: { productId: input.id } });
          if (images?.length) {
            await tx.productImage.createMany({
              data: images.map((img, index) => ({
                url: img.url,
                alt: img.alt || null,
                position: index,
                productId: input.id,
              })),
            });
          }
        }

        const updatedProduct = await tx.product.update({
          where: { id: input.id },
          data: {
            ...productData,
            primaryImage:
              productData.primaryImage === "" ? null : productData.primaryImage,
            categoryId:
              productData.categoryId === "" ? null : productData.categoryId,
          },
          include: {
            category: { select: { id: true, name: true } },
            images: { orderBy: { position: "asc" } },
          },
        });

        return serializeProduct(updatedProduct);
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.product.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.product.delete({ where: { id: input.id } });
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      return prisma.product.deleteMany({
        where: { id: { in: input.ids } },
      });
    }),

  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.product.updateMany({
        where: { id: { in: input.ids } },
        data: { status: input.status },
      });
    }),
});
