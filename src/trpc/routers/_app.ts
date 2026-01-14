import { createTRPCRouter } from '../init';

import { categoriesRouter } from '@/modules/categories/server/procedures';
import { studioRouter } from '@/modules/studio/server/procedures';
import { videosRouter } from '@/modules/videos/server/procedure';
import { VideoViewsRouter } from '@/modules/video-views/server/procedures';
import { VideoReactionsRouter } from '@/modules/video-reactions/server/procedure';
import { subscriptionsRouter } from '@/modules/subscriptions/server/procedures';
import { commentsRouter } from '@/modules/comments/server/procedures';

// tRPC总路由
export const appRouter = createTRPCRouter({
  categories: categoriesRouter,
  studio: studioRouter,
  videos: videosRouter,
  videoViews: VideoViewsRouter,
  videoReactions: VideoReactionsRouter,
  subscriptions: subscriptionsRouter,
  comments: commentsRouter,
});

export type AppRouter = typeof appRouter;