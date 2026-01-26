import { protectedProcedure, createTRPCRouter } from '@/trpc/init'

import z from 'zod'

import { eq, and } from 'drizzle-orm'

import { db } from '@/db'
import { commentReactions } from '@/db/schema'

export const CommentReactionsRouter = createTRPCRouter({
  like: protectedProcedure
    .input(z.object({ commentId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input
      const { id: userId } = ctx.user

      // 检查用户是否已经对该评论有like reaction
      const [existingReaction] = await db
        .select()
        .from(commentReactions)
        .where(and(
          eq(commentReactions.userId, userId),
          eq(commentReactions.commentId, commentId),
          eq(commentReactions.type, 'like')
        ))

      // 如果已经有like reaction，则删除它（即取消点赞）
      if (existingReaction) {
        const [deletedReaction] = await db
          .delete(commentReactions)
          .where(and(
            eq(commentReactions.userId, userId),
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.type, 'like')
          ))
          .returning()

        return deletedReaction
      }

      // 根据 userId + commentId 检查冲突，用户对该评论虽然没有like reaction，但可能有dislike reaction
      // 如果存在dislike reaction，则更新为like，否则插入新的like reaction
      const [createdReaction] = await db
        .insert(commentReactions)
        .values({ userId, commentId, type: 'like' })
        .onConflictDoUpdate({
          target: [commentReactions.userId, commentReactions.commentId], // 检查冲突的字段
          set: { type: 'like' } // 如果有冲突需要更新的字段
        })
        .returning()

      return createdReaction
    }),
  dislike: protectedProcedure
    .input(z.object({ commentId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { commentId } = input
      const { id: userId } = ctx.user

      const [existingReaction] = await db
        .select()
        .from(commentReactions)
        .where(and(
          eq(commentReactions.userId, userId),
          eq(commentReactions.commentId, commentId),
          eq(commentReactions.type, 'dislike')
        ))

      // 如果已经有dislike reaction，则删除它（即取消点踩）
      if (existingReaction) {
        const [deletedReaction] = await db
          .delete(commentReactions)
          .where(and(
            eq(commentReactions.userId, userId),
            eq(commentReactions.commentId, commentId),
            eq(commentReactions.type, 'dislike')
          ))
          .returning()

        return deletedReaction
      }

      // 根据 userId + commentId 检查冲突，用户对该评论虽然没有dislike reaction，但可能有like reaction
      // 如果存在like reaction，则更新为dislike，否则插入新的dislike reaction
      const [createdReaction] = await db
        .insert(commentReactions)
        .values({ userId, commentId, type: 'dislike' })
        .onConflictDoUpdate({
          target: [commentReactions.userId, commentReactions.commentId], // 检查冲突的字段
          set: { type: 'dislike' } // 如果有冲突需要更新的字段
        })
        .returning()

      return createdReaction
    }),   
})