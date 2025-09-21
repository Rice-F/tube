import { protectedProcedure, createTRPCRouter } from '@/trpc/init'

import z from 'zod'

import { eq, and } from 'drizzle-orm'

import { db } from '@/db'
import { videoViews } from '@/db/schema'

export const VideoViewsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user
      
      const [existingVideoView] = await db
        .select()
        .from(videoViews)
        .where(and(
          eq(videoViews.userId, userId),
          eq(videoViews.videoId, input.videoId)
        ))

      if (existingVideoView) return

      const [createdVideoView] = await db
        .insert(videoViews)
        .values({
          userId,
          videoId: input.videoId
        })
        .returning()

      return createdVideoView
    })
})