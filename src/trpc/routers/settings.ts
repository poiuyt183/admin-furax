import {
  parseSiteSettings,
  settingsDefault,
  siteSettingsSchema,
} from "@/features/settings/site-settings.schema";
import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";

export type { SiteSettings, NavItem, ContactSettings } from "@/features/settings/site-settings.schema";

export const settingsRouter = createTRPCRouter({
  get: protectedProcedure.query(async () => {
    const config = await prisma.siteConfig.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        homepage: {},
        settings: settingsDefault,
      },
      update: {},
    });

    return parseSiteSettings(config.settings);
  }),

  update: protectedProcedure
    .input(siteSettingsSchema)
    .mutation(async ({ input }) => {
      await prisma.siteConfig.upsert({
        where: { id: "singleton" },
        create: {
          id: "singleton",
          homepage: {},
          settings: input,
        },
        update: { settings: input },
      });

      return { success: true };
    }),
});
