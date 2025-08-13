import { createTRPCRouter } from '../init';

import { categoriesRouter } from '@/modules/categories/server/procedures';

// tRPC总路由
export const appRouter = createTRPCRouter({
  categories: categoriesRouter
});

export type AppRouter = typeof appRouter;