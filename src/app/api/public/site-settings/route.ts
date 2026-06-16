import { parseSiteSettings, settingsDefault } from "@/features/settings/site-settings.schema";
import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const config = await prisma.siteConfig.findUnique({
    where: { id: "singleton" },
  });

  if (!config) {
    return NextResponse.json(settingsDefault);
  }

  return NextResponse.json(parseSiteSettings(config.settings));
}
