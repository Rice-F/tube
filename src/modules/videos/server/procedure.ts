import { baseProcedure, protectedProcedure, createTRPCRouter } from '@/trpc/init'
import { TRPCError } from '@trpc/server'

import { z } from 'zod'

import { eq, and, getTableColumns, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { videos, videosUpdateSchema, users, videoViews, videoReactions } from '@/db/schema'

import { mux } from '@/lib/mux'
import { workflow } from '@/lib/workflow'

import { UTApi } from "uploadthing/server";

export const videosRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(z.object({ videoId: z.uuid() })) 
    .query(async ({ input, ctx }) => {
      const { clerkUserId } = ctx // 可选的，未登录时为undefined

      let viewerId;

      // 从users表中查找clerkUserId对应的用户，也就是当前浏览视频的用户
      // 浏览者可能未登录，未登录状态下clerkUserId为undefined
      // inArray() 方法生成SQL的IN子句，确保即使clerkUserId为undefined时不会报错，只是匹配不到用户
      const [viewer] = await db
        .select()
        .from(users)
        .where(inArray(users.clerkId, clerkUserId ? [clerkUserId] : []))

      if (viewer) viewerId = viewer.id

      // 创建一个子查询，获取当前浏览者对每个视频的reaction作为一个临时表
      // 后续在主查询中通过leftJoin()获取浏览者对当前视频的reaction
      const viewerReactions = db.$with('viewer_reactions').as(
        db
          .select({
            videoId: videoReactions.videoId,
            type: videoReactions.type
          })
          .from(videoReactions)
          .where(inArray(videoReactions.userId, viewerId ? [viewerId] : []))
      )

      const [video] = await db
        .with(viewerReactions) // 使用上面定义的子查询
        .select({  // 返回一个嵌套对象
          ...getTableColumns(videos),
          // 视频发布者的信息
          user: {...getTableColumns(users) }, 
          // 计算关联的videoViews数量
          videoViews: db.$count(videoViews, eq(videoViews.videoId, videos.id)), 
          // 计算关联的videoReactions中type为'like'的数量
          videoLikesCount: db.$count(videoReactions, and( 
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, 'like')
          )),
          // 计算关联的videoReactions中type为'dislike'的数量
          videoDislikesCount: db.$count(videoReactions, and( 
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, 'dislike')
          )),
          // 当前浏览视频的用户对该视频的reaction类型
          viewerReaction: viewerReactions.type 
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id)) // 关联用户表，获取视频发布者的信息
        .leftJoin(viewerReactions, eq(videos.id, viewerReactions.videoId)) // 关联当前浏览视频的用户对视频的reaction
        .where(eq(videos.id, input.videoId)) 
        // .groupBy(
        //   videos.id,
        //   users.id,
        //   viewerReactions.type
        // )

      if (!video) throw new TRPCError({ code: 'NOT_FOUND' })
      
      return video
    }),
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
    .input(z.object({ videoId: z.uuid() }))
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
    }),
  restoreThumbnail: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const {id: userId} = ctx.user

      const [exitingVideo] = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.id, input.videoId),
          eq(videos.userId, userId)
        ))
      if(!exitingVideo) throw new TRPCError({ code: 'NOT_FOUND' })

      if (exitingVideo.thumbnailKey) {
        const utApi = new UTApi(); 
        await utApi.deleteFiles(exitingVideo.thumbnailKey); // 清除uploadthing旧的thumbnail
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null }) // 清除数据库中旧的thumbnail
          .where(
            and(
              eq(videos.id, input.videoId),
              eq(videos.userId, userId)
            )
          );
      }

      if(!exitingVideo.muxPlaybackId) throw new TRPCError({ code: 'BAD_REQUEST' })

      const tempThumbnailUrl = `https://image.mux.com/${exitingVideo.muxPlaybackId}/thumbnail.jpg`
      const utApi = new UTApi(); 
      const uploadThumbnail = await utApi.uploadFilesFromUrl(tempThumbnailUrl)
      if(!uploadThumbnail.data) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

      const { key: thumbnailKey, ufsUrl: thumbnailUrl } = uploadThumbnail.data

      const [updatedVideo] = await db
        .update(videos)
        .set({ thumbnailUrl, thumbnailKey })
        .where(
          and(
            eq(videos.id, input.videoId),
            eq(videos.userId, userId)
          )
        )
        .returning()
      return updatedVideo
    }),
  generateThumbnail: protectedProcedure
    .input(z.object({ id: z.uuid(), prompt: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/thumbnail`,
        body: { userId, videoId: input.id, prompt: input.prompt }, 
      }) 

      return workflowRunId
    }),
  generateTitle: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      const { workflowRunId } = await workflow.trigger({
        // workflow的地址
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/title`,
        body: { userId, videoId: input.videoId }, 
      }) 

      return workflowRunId
    }),
  generateDescription: protectedProcedure
    .input(z.object({ videoId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: userId } = ctx.user

      const { workflowRunId } = await workflow.trigger({
        url: `${process.env.UPSTASH_WORKFLOW_URL}/api/videos/workflows/description`,
        body: { userId, videoId: input.videoId }, 
      }) 

      return workflowRunId
    }),
})