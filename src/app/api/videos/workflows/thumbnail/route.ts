import { serve } from "@upstash/workflow/nextjs"

import { db } from '@/db'
import { videos } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

import { UTApi } from "uploadthing/server";

interface InputType {
  userId: string,
  videoId: string,
  prompt: string
}

export const { POST } = serve(
  async (context) => {
    const utApi = new UTApi(); 
    const input = context.requestPayload as InputType
    const { userId, videoId, prompt } = input

    // video
    const video = await context.run('get-video', async () => {
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(and(
          eq(videos.id, videoId),
          eq(videos.userId, userId)
        ))

      if(!existingVideo) return new Error('Not Found')  
      return existingVideo
    })

    if (video instanceof Error) throw video    

    // 清除uploadthing和数据库中旧的thumbnail
    await context.run("delete-old-thumbnail", async () => {
      if(video.thumbnailKey) await utApi.deleteFiles(video.thumbnailKey)
      await db
        .update(videos)
        .set({
          thumbnailKey: null,
          thumbnailUrl: null
        })
        .where(and(
          eq(videos.id, video.id),
          eq(videos.userId, userId)
        ))
    })

    // generatedThumbnail
    const generatedThumbnail = await context.run('generate-thumbnail', async () => {
      const apiUrl = "https://open.bigmodel.cn/api/paas/v4/images/generations";

      const body = {
        model: 'cogview-4-250304',
        prompt,
        size: '1792x1024'
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`,
        },
        body: JSON.stringify(body),
      })

      if(!response.ok) throw new Error('ZHIPU generatedThumbnail failed')

      const resData = await response.json()
      const data = resData.data[0]?.url || ''

      return data
    })

    if(!generatedThumbnail)  return new Error('Bad Request')

    // AI生成的图片是临时的，需要上传到uploadthing永久存储
    const uploadedThumbnail = await context.run("upload-thumbnail", async () => {
      const { data } = await utApi.uploadFilesFromUrl(generatedThumbnail)

      if( !data) throw new Error('Bad Request')

      return data
    })

    await context.run("update-video", async () => {
      await db
        .update(videos)
        .set({
          thumbnailKey: uploadedThumbnail.key,
          thumbnailUrl: uploadedThumbnail.ufsUrl
        })
        .where(and(
          eq(videos.id, video.id),
          eq(videos.userId, userId)
        ))
    })
  }
)