import { createTRPCRouter } from '../init';

import { categoriesRouter } from '@/modules/categories/server/procedures';
import { studioRouter } from '@/modules/studio/server/procedures';

// tRPC总路由
export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter
});

export type AppRouter = typeof appRouter;