import { createTRPCRouter } from '../init';

import { categoriesRouter } from '@/modules/categories/server/procedures';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedure';
import { VideoViewsRouter } from '@/modules/video-views/server/procedures';

// tRPC总路由
export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter,
  videos: videosRouter,
  videoViews: VideoViewsRouter,
});

export type AppRouter = typeof appRouter;