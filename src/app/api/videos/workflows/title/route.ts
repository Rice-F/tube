import { serve } from "@upstash/workflow/nextjs"

import { db } from '@/db'
import { videos } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

interface InputType {
  userId: string,
  videoId: string
}

const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;

export const { POST } = serve(
  async (context) => {
    const input = context.requestPayload as InputType
    const { userId, videoId } = input

    // 获取视频
    const video = await context.run('get-video', async () => {
      const [exitingVideo] = await db
        .select()
        .from(videos)
        .where(
          and(
            eq(videos.id, videoId),
            eq(videos.userId, userId)
          )
        )
      if (!exitingVideo) return new Error('Not Found')  
      return exitingVideo
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

    // generate title
    const generatedTitle = await context.run('generate-title', async () => {
      const apiUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

      const body = {
        model: 'GLM-4.1V-Thinking-FlashX',
        messages: [
          { role: 'system', content:  TITLE_SYSTEM_PROMPT},
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

    if(!generatedTitle)  return new Error('Bad Request')

    // 更新视频标题
    await context.run("update-video", async () => {
      await db
        .update(videos)
        .set({
          title: generatedTitle || video.title
        })
        .where(and(
          eq(videos.id, video.id),
          eq(videos.userId, video.userId)
        ))
    })
  }
)