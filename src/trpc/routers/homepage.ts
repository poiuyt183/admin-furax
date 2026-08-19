import { z } from "zod/v4";
import {
  defaultTrustItems,
  TRUST_ICON_KEYS,
} from "@/features/pages/trust-items";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

const bannerSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  link: z.string(),
  isActive: z.boolean(),
});

const trustItemSchema = z.object({
  id: z.string(),
  icon: z.enum(TRUST_ICON_KEYS),
  text: z.string().max(120),
});

const homepageSchema = z.object({
  banners: z.array(bannerSchema).default([]),
  featuredCategoryIds: z.array(z.string()).default([]),
  featuredProductIds: z.array(z.string()).default([]),
  productVideoIds: z.array(z.string()).default([]),
  trustItems: z.array(trustItemSchema).default(defaultTrustItems),
});

const homepageDefault = {
  banners: [],
  featuredCategoryIds: [],
  featuredProductIds: [],
  productVideoIds: [],
  trustItems: defaultTrustItems,
};

export type HomepageConfig = z.infer<typeof homepageSchema>;
export type Banner = z.infer<typeof bannerSchema>;

function parseHomepageConfig(value: unknown): HomepageConfig {
  const raw =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const parsed = homepageSchema.safeParse({
    ...raw,
    productVideoIds: Array.isArray(raw.productVideoIds)
      ? raw.productVideoIds
      : [],
    trustItems: Array.isArray(raw.trustItems)
      ? raw.trustItems
          .map((item) => trustItemSchema.safeParse(item))
          .filter((result) => result.success)
          .map((result) => result.data)
      : defaultTrustItems,
  });

  return parsed.success ? parsed.data : homepageDefault;
}

export const homepageRouter = createTRPCRouter({
  get: protectedProcedure.query(async () => {
    const config = await prisma.siteConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", homepage: homepageDefault },
      update: {},
    });

    const parsed = parseHomepageConfig(config.homepage);
    return parsed;
  }),

  update: protectedProcedure
    .input(homepageSchema)
    .mutation(async ({ input }) => {
      await prisma.siteConfig.upsert({
        where: { id: "singleton" },
        create: { id: "singleton", homepage: input },
        update: { homepage: input },
      });
      return { success: true };
    }),
});
