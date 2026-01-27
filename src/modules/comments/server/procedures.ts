import { z } from "zod";

import { db } from "@/db";
import { and, eq, getTableColumns, desc, lt, or, count, inArray, isNull, isNotNull } from "drizzle-orm";
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
      parentCommentId: z.uuid().nullish(),
      videoId: z.uuid(),
      value: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { parentCommentId, videoId, value } = input
      const { id: userId } = ctx.user

      const [existingComment] = await db
        .select()
        .from(comments)
        .where(inArray(comments.id, parentCommentId ? [parentCommentId] : []))

      if (!existingComment && parentCommentId) {
        throw new TRPCError({code: 'NOT_FOUND'})
      }

      // Check if the parent comment is a reply to another reply
      if( existingComment?.parentCommentId && parentCommentId ) {
        throw new TRPCError({code: 'BAD_REQUEST'})
      }

      const [createdComment] = await db
        .insert(comments)
        .values({
          userId,
          videoId,
          parentCommentId,
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
        parentId: z.uuid().nullish(),
        cursor: z.object({
          id: z.uuid(),
          createdAt: z.date()
        }).nullish(),
        limit: z.number().min(1).max(100), 
      })
    )
    .query(async ({ input, ctx }) => {
      const { videoId, parentId, cursor, limit } = input
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

      // 获取每条评论的回复数
      const replies = db.$with('replies').as(
        db
          .select({
            parentCommentId: comments.parentCommentId,
            count: count(comments.id).as('count')
          })
          .from(comments)
          .where(isNotNull(comments.parentCommentId))
          .groupBy(comments.parentCommentId)
      )

      // 并行执行两个查询
      const [total, data] = await Promise.all([
        db
          .select({ 
            count: count()
          })
          .from(comments)
          .where(and(
            eq(comments.videoId, videoId),
            isNull(comments.parentCommentId) // 只计算顶级评论
          )),
        db
          .with(viewerReactions, replies )
          .select({
            ...getTableColumns(comments),
            user: users,
            viewerReaction: viewerReactions.type,
            replyCount: replies.count,
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
            // 区分获取的是comment还是reply
            parentId 
              ? eq(comments.parentCommentId, parentId)
              : isNull(comments.parentCommentId),
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
          .leftJoin(replies, eq(comments.id, replies.parentCommentId))
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