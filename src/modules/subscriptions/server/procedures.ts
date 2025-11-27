import { z } from "zod";

import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { subscriptions } from "@/db/schema";

import {  createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const subscriptionsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ userId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input; // 要订阅的用户ID

      if(  ctx.user.id === userId ) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const [subscription] = await db
        .insert(subscriptions)
        .values({
          viewerId: ctx.user.id,
          creatorId: userId,
        })
        .returning();

      return subscription;
    }),
  remove: protectedProcedure
    .input(z.object({ userId: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const { userId } = input; // 要取消订阅的用户ID

      if(  ctx.user.id === userId ) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }

      const [deletedSubscription] = await db
        .delete(subscriptions)
        .where(and(
          eq(subscriptions.viewerId, ctx.user.id),
          eq(subscriptions.creatorId, userId)
        ))
        .returning();

      return deletedSubscription;
    })
})