import { z } from "zod";

import { db } from "@/db";
import { and, eq, getTableColumns, desc, lt, or, count } from "drizzle-orm";
import { comments, users, commentInsertSchema, commentUpdateSchema } from "@/db/schema";

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
    .query(async ({ input }) => {
      const { videoId, cursor, limit } = input

      // 并行执行两个查询
      const [total, data] = await Promise.all([
        db
          .select({ 
            count: count()
          })
          .from(comments)
          .where(eq(comments.videoId, videoId)),

        db
          .select({
            ...getTableColumns(comments),
            user: users
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