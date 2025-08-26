import { baseProcedure, protectedProcedure, createTRPCRouter } from '@/trpc/init'

import { z } from 'zod'

import { eq, and } from 'drizzle-orm'

import { db } from '@/db'
import { videos } from '@/db/schema'

export const videosRouter = createTRPCRouter({
  // mutation对应对数据库的增删改，表示会修改数据库数据
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { id: userId } = ctx.user

    const [video] = await db
      .insert(videos)
      .values({
        userId,
        title: 'Untitled',
      })
      .returning()

    return {
      video
    }
  })
})