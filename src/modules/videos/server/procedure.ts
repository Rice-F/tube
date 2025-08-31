import { baseProcedure, protectedProcedure, createTRPCRouter } from '@/trpc/init'
import { TRPCError } from '@trpc/server'

import { z } from 'zod'

import { eq, and } from 'drizzle-orm'

import { db } from '@/db'
import { videos, videosUpdateSchema, users } from '@/db/schema'

import { mux } from '@/lib/mux'

export const videosRouter = createTRPCRouter({
  // mutation对应对数据库的增删改，表示会修改数据库数据
  create: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { id: userId } = ctx.user

      // mux-node-sdk提供的：创建一个新的 Direct Upload 接口
      // Direct Upload 表示前端直接将视频文件上传到 Mux，不需要经过自己的服务器
      const upload = await mux.video.uploads.create({
        new_asset_settings: {
          passthrough: userId, // 传递用户ID到Mux
          playback_policy: ['public'], // 设置播放策略为公开
          // mp4_support: "standard", // 设置MP4支持为标准
          input: [
            {
              generated_subtitles: [
                {
                  language_code: 'en',
                  name: 'English'
                }
              ]
            }
          ]
        },
        cors_origin: '*', // 允许所有CORS来源
      })

      const [video] = await db
        .insert(videos)
        .values({
          userId,
          title: 'Untitled',
          muxStatus: "waiting",
          muxUploadId: upload.id
        })
        .returning()

      return {
        video,
        uploadUrl: upload.url // 返回上传URL给前端
      }
    }),
  update: protectedProcedure
    .input(videosUpdateSchema) // 使用videosUpdateSchema作为输入验证规则
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      if(!input.id) throw new TRPCError({ code: 'BAD_REQUEST' })

      const [updatedVideo] = await db  
        .update(videos)
        .set({
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          visibility: input.visibility,
          updatedAt: new Date(),
        })
        .where(and(
          eq(videos.id, input.id),
          eq(videos.userId, userId)
        ))
        .returning()

      if(!updatedVideo) throw new TRPCError({ code: 'NOT_FOUND' })

      return updatedVideo
    }),
  delete: protectedProcedure
    .input(z.object({videoId: z.uuid()}))
    .mutation(async ({ ctx, input }) => {
      const {id: userId} = ctx.user

      const [deletedVideo] = await db
        .delete(videos)
        .where(and(
          eq(videos.userId, userId),
          eq(videos.id, input.videoId)
        ))
        .returning()

      if(!deletedVideo) throw new TRPCError({ code: 'NOT_FOUND' })

      return deletedVideo
    })
})