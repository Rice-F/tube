import { serve } from "@upstash/workflow/nextjs"

import { db } from '@/db'
import { videos } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

interface InputType {
  userId: string,
  videoId: string
}

const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`;

export const { POST } = serve(
  async (context) => {
    const input = context.requestPayload as InputType
    const { userId, videoId } = input

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

    // subtitle
    const transcript = await context.run('get-transcript', async () => {
      // 拼接字幕远程地址
      const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`

      // 异步获取字幕纯文本
      const response = await fetch(trackUrl)
      const text = await response.text()

      if(!text) throw new Error('Bad request')

      return text
    })

    // generatedDescription
    const generatedDescription = await context.run('generate-description', async () => {
      const apiUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

      const body = {
        model: 'GLM-4.1V-Thinking-FlashX',
        messages: [
          { role: 'system', content:  DESCRIPTION_SYSTEM_PROMPT},
          { role: 'user', content:  transcript}
        ],
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.ZHIPU_API_KEY}`,
        },
        body: JSON.stringify(body),
      })

      if(!response.ok) throw new Error('ZHIPU failed')

      const resData = await response.json()
      const data = resData.choices?.[0].message?.content || ''

      return data
    })

    if(!generatedDescription)  return new Error('Bad Request')

    await context.run("update-video", async () => {
      await db
        .update(videos)
        .set({
          description: generatedDescription || video.title
        })
        .where(and(
          eq(videos.id, video.id),
          eq(videos.userId, video.userId)
        ))
    })
  }
)