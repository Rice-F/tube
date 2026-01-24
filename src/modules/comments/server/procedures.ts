import { z } from "zod";

import { db } from "@/db";
import { and, eq, getTableColumns, desc, lt, or, count, inArray } from "drizzle-orm";
import { 
  comments, 
  users, 
  commentReactions
 } from "@/db/schema";

import {  baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      videoId: z.uuid(),
      value: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { videoId, value } = input
      const { id: userId } = ctx.user

      const [createdComment] = await db
        .insert(comments)
        .values({
          userId,
          videoId,
          value,
        })
        .returning()

      return createdComment;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { id } = input
      const { id: userId } = ctx.user
      
      const [deletedComment] = await db
        .delete(comments)
        .where(and(
          eq(comments.id, id),
          eq(comments.userId, userId)
        ))
        .returning()

      if (!deletedComment) throw new TRPCError({code: 'NOT_FOUND', message: 'Comment not found'})
      
        return deletedComment;
    }),
  getMany: baseProcedure
    .input(
      z.object({ 
        videoId: z.uuid(),
        cursor: z.object({
          id: z.uuid(),
          createdAt: z.date()
        }).nullish(),
        limit: z.number().min(1).max(100), 
      })
    )
    .query(async ({ input, ctx }) => {
      const { videoId, cursor, limit } = input
      const { clerkUserId } = ctx

      // 获取当前浏览者id
      let viewerId

      const [viewer] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

      if (viewer) viewerId = viewer.id

      // 获取当前浏览者对评论的反应
      const viewerReactions = db.$with('viewer-reactions').as(
        db
          .select({
            commentId: commentReactions.commentId,
            type: commentReactions.type,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.userId, viewerId ? [viewerId] : []))
      )

      // 并行执行两个查询
      const [total, data] = await Promise.all([
        db
          .select({ 
            count: count()
          })
          .from(comments)
          .where(eq(comments.videoId, videoId)),

        db
          .with(viewerReactions)
          .select({
            ...getTableColumns(comments),
            user: users,
            viewerReaction: viewerReactions.type,
            likeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, 'like'),
                eq(commentReactions.commentId, comments.id)
              )
            ),
            dislikeCount: db.$count(
              commentReactions,
              and(
                eq(commentReactions.type, 'dislike'),
                eq(commentReactions.commentId, comments.id)
              )
            )
          })
          .from(comments)
          .where(and(
            eq(comments.videoId, videoId),
            cursor ? or(
              lt(comments.createdAt, cursor.createdAt),
              and(
                eq(comments.createdAt, cursor.createdAt),
                lt(comments.id, cursor.id)
              )
            ) : undefined
          ))
          .innerJoin(users, eq(comments.userId, users.id))
          .leftJoin(viewerReactions, eq(comments.id, viewerReactions.commentId))
          .orderBy(desc(comments.createdAt), desc(comments.id))
          .limit(limit + 1)
      ])

      const hasMore = data.length > limit
      const commentsData = hasMore ? data.slice(0, -1) : data
      const lastComment = commentsData[commentsData.length - 1]
      const nextCursor = hasMore ? {
        id: lastComment.id,
        createdAt: lastComment.createdAt,
      } : null

      return {
        total: Number(total[0]?.count || 0),
        commentsData,
        nextCursor
      }
    }),
})