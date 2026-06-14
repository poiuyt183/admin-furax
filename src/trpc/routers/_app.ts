import { baseProcedure, createTRPCRouter, protectedProcedure } from '../init';
import prisma from '../../../lib/prisma';
import { categoryRouter } from './category';
import { productRouter } from './product';

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
});

// export type definition of API
export type AppRouter = typeof appRouter;