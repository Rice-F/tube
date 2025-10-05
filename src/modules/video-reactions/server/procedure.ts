import { protectedProcedure, createTRPCRouter } from '@/trpc/init'

import z from 'zod'

import { eq, and } from 'drizzle-orm'

import { db } from '@/db'
import { videoReactions } from '@/db/schema'

export const VideoReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input
      const { id: userId } = ctx.user

      // 检查用户是否已经对该视频有like reaction
      const [existingReaction] = await db
        .select()
        .from(videoReactions)
        .where(and(
          eq(videoReactions.userId, userId),
          eq(videoReactions.videoId, videoId),
          eq(videoReactions.type, 'like')
        ))

      // 如果已经有like reaction，则删除它（即取消点赞）
      if (existingReaction) {
        const [deletedReaction] = await db
          .delete(videoReactions)
          .where(and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, 'like')
          ))
          .returning()

        return deletedReaction
      }

      // 根据 userId + videoId 检查冲突，用户对该视频虽然没有like reaction，但可能有dislike reaction
      // 如果存在dislike reaction，则更新为like，否则插入新的like reaction
      const [createdReaction] = await db
        .insert(videoReactions)
        .values({ userId, videoId, type: 'like' })
        .onConflictDoUpdate({
          target: [videoReactions.userId, videoReactions.videoId], // 检查冲突的字段
          set: { type: 'like' } // 如果有冲突需要更新的字段
        })
        .returning()

      return createdReaction
    }),
  dislike: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input
      const { id: userId } = ctx.user

      const [existingReaction] = await db
        .select()
        .from(videoReactions)
        .where(and(
          eq(videoReactions.userId, userId),
          eq(videoReactions.videoId, videoId),
          eq(videoReactions.type, 'dislike')
        ))

      if (existingReaction) {
        const [deletedReaction] = await db
          .delete(videoReactions)
          .where(and(
            eq(videoReactions.userId, userId),
            eq(videoReactions.videoId, videoId),
            eq(videoReactions.type, 'dislike')
          ))
          .returning()

        return deletedReaction
      }
      
      const [createdReaction] = await db
        .insert(videoReactions)
        .values({ userId, videoId, type: 'dislike' })
        .onConflictDoUpdate({
          target: [videoReactions.userId, videoReactions.videoId],
          set: { type: 'dislike' }
        })
        .returning()

      return createdReaction
    })
})