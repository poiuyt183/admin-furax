import { z } from "zod/v4";
import { isValidYoutubeUrl } from "@/lib/youtube";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

const bannerSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  link: z.string(),
  isActive: z.boolean(),
});

const homepageSchema = z.object({
  banners: z.array(bannerSchema).default([]),
  featuredCategoryIds: z.array(z.string()).default([]),
  featuredProductIds: z.array(z.string()).default([]),
  productVideoUrl: z
    .string()
    .default("")
    .refine(isValidYoutubeUrl, "Link YouTube không hợp lệ"),
});

const homepageDefault = {
  banners: [],
  featuredCategoryIds: [],
  featuredProductIds: [],
  productVideoUrl: "",
};

export type HomepageConfig = z.infer<typeof homepageSchema>;
export type Banner = z.infer<typeof bannerSchema>;

export const homepageRouter = createTRPCRouter({
  get: protectedProcedure.query(async () => {
    const config = await prisma.siteConfig.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", homepage: homepageDefault },
      update: {},
    });

    const parsed = homepageSchema.safeParse(config.homepage);
    return parsed.success ? parsed.data : homepageDefault;
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
