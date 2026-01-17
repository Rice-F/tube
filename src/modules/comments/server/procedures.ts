import { z } from "zod";

import { db } from "@/db";
import { and, eq, getTableColumns } from "drizzle-orm";
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
  getMany: baseProcedure
    .input(z.object({ videoId: z.uuid() }))
    .query(async ({ input }) => {
      const { videoId } = input

      const data = await db
        .select({
          ...getTableColumns(comments),
          user: users
        })
        .from(comments)
        .where(eq(comments.videoId, videoId))
        .innerJoin(users, eq(comments.userId, users.id))

      return data;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {}),
})