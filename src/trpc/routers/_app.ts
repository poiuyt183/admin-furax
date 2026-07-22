import { baseProcedure, createTRPCRouter, protectedProcedure } from '../init';
import prisma from '../../../lib/prisma';
import { categoryRouter } from './category';
import { productRouter } from './product';
import { homepageRouter } from './homepage';
import { postCategoryRouter } from './post-category';
import { postRouter } from './post';
import { reviewVideoRouter } from './review-video';
import { settingsRouter } from './settings';
import { storeRouter } from './store';

export const appRouter = createTRPCRouter({
  getUsers: protectedProcedure
    .query(({ ctx }) => {
      return prisma.user.findMany({
        where: {
          id: ctx.auth.user.id
        }
      })
    }),
  category: categoryRouter,
  product: productRouter,
  homepage: homepageRouter,
  settings: settingsRouter,
  postCategory: postCategoryRouter,
  post: postRouter,
  reviewVideo: reviewVideoRouter,
  store: storeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;