import prisma from "../../../lib/prisma";
import { createTRPCRouter, protectedProcedure } from "../init";
import { categoryRouter } from "./category";
import { homepageRouter } from "./homepage";
import { postRouter } from "./post";
import { postCategoryRouter } from "./post-category";
import { productRouter } from "./product";
import { reviewVideoRouter } from "./review-video";
import { settingsRouter } from "./settings";
import { storeRouter } from "./store";
import { warrantyRouter } from "./warranty";

export const appRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(({ ctx }) => {
    return prisma.user.findMany({
      where: {
        id: ctx.auth.user.id,
      },
    });
  }),
  category: categoryRouter,
  product: productRouter,
  homepage: homepageRouter,
  settings: settingsRouter,
  postCategory: postCategoryRouter,
  post: postRouter,
  reviewVideo: reviewVideoRouter,
  store: storeRouter,
  warranty: warrantyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
