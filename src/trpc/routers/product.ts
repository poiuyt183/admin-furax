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
    comparePrice?: { toString: () => string } | null;
    createdAt: Date;
    updatedAt: Date;
  },
>(product: TProduct) {
  return {
    ...product,
    price: product.price.toString(),
    comparePrice: product.comparePrice?.toString() ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  images: { orderBy: { position: "asc" as const } },
  specs: { orderBy: { position: "asc" as const } },
} as const;

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
        include: PRODUCT_INCLUDE,
      });

      return products.map(serializeProduct);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const product = await prisma.product.findUnique({
        where: { id: input.id },
        include: PRODUCT_INCLUDE,
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

      const { images, specs, ...productData } = input;

      const product = await prisma.product.create({
        data: {
          ...productData,
          primaryImage: productData.primaryImage || null,
          categoryId: productData.categoryId || null,
          brand: productData.brand || null,
          origin: productData.origin || null,
          sku: productData.sku || null,
          warranty: productData.warranty || null,
          comparePrice: productData.comparePrice ?? null,
          images: images?.length
            ? {
                create: images.map((img, index) => ({
                  url: img.url,
                  alt: img.alt || null,
                  position: index,
                })),
              }
            : undefined,
          specs: specs?.length
            ? {
                create: specs.map((spec, index) => ({
                  label: spec.label,
                  value: spec.value,
                  group: spec.group || null,
                  position: spec.position ?? index,
                })),
              }
            : undefined,
        },
        include: PRODUCT_INCLUDE,
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

      const { images, specs, ...productData } = input.data;

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

        if (specs !== undefined) {
          await tx.productSpec.deleteMany({ where: { productId: input.id } });
          if (specs?.length) {
            await tx.productSpec.createMany({
              data: specs.map((spec, index) => ({
                label: spec.label,
                value: spec.value,
                group: spec.group || null,
                position: spec.position ?? index,
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
            brand: productData.brand === "" ? null : productData.brand,
            origin: productData.origin === "" ? null : productData.origin,
            sku: productData.sku === "" ? null : productData.sku,
            warranty: productData.warranty === "" ? null : productData.warranty,
            comparePrice: productData.comparePrice ?? undefined,
          },
          include: PRODUCT_INCLUDE,
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
