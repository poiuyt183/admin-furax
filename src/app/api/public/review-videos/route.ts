import prisma from "../../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const categorySlug = searchParams.get("categorySlug") ?? undefined;

  const videos = await prisma.reviewVideo.findMany({
    where: {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(categorySlug
        ? { category: { slug: categorySlug } }
        : {}),
    },
    include: {
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(
    videos.map((video) => ({
      id: video.id,
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      categoryId: video.categoryId,
      category: video.category,
      createdAt: video.createdAt.toISOString(),
    })),
  );
}
