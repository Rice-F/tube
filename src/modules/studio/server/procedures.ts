import { protectedProcedure, createTRPCRouter } from '@/trpc/init'

import { z } from 'zod'

import { eq, and, or, lt, desc } from 'drizzle-orm'

import { db } from '@/db'
import { videos } from '@/db/schema'
import { TRPCError } from '@trpc/server'

export const studioRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z.object({
        // 可选游标参数，上一次的最后一条数据，首次请求可不传
        cursor: z.object({ 
            id: z.uuid(),
            updatedAt: z.date(),
        }).nullish(), 
        // 每页数据条数限制
        limit: z.number().min(1).max(100), 
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input
      const { id: userId } = ctx.user

      const data = await db
        .select()
        .from(videos)
        .where(
          and(
            eq( videos.userId, userId ),  // 只查询当前用户的视频
            cursor ? or(
              lt(videos.updatedAt, cursor.updatedAt),  // 查询更新时间小于游标参数的记录
              and(
                eq(videos.updatedAt, cursor.updatedAt),  // 如果更新时间相同，则查询id小于游标参数的记录
                lt(videos.id, cursor.id)
              )
            ) : undefined
          )
        )
        .orderBy(desc(videos.updatedAt), desc(videos.id))  // 按更新时间和ID降序排列，也就是最新的视频在前面
        .limit(limit + 1)  // 多查询一条数据用于判断是否还有下一页

        const hasMore = data.length > limit // 判断是否还有下一页
        const videosData = hasMore ? data.slice(0, -1) : data // 如果还有下一页，则去掉最后一条数据
        const lastVideo = videosData[videosData.length - 1] // 获取最后一条数据，用于生成下一页的游标
        // 生成下一页的cursor
        const nextCursor = hasMore ? { 
          id: lastVideo.id,
          updatedAt: lastVideo.updatedAt,
        } : null

      return {
        videosData,
        nextCursor, // 是一个对象，包含了id和updatedAt两个字段
      }
    }),

  getOne: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const { videoId } = input
      const { id: userId } = ctx.user

      const [video] = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.id, videoId),
            eq(videos.userId, userId) // 只能查询自己的视频
          )
        )
      
      if(!video) throw new TRPCError({ code: 'NOT_FOUND'})
      
      return video
    })
})