import { headers } from 'next/headers'  // Next.js 内置获取请求头

import {
  VideoAssetCreatedWebhookEvent,
  VideoAssetErroredWebhookEvent,
  VideoAssetReadyWebhookEvent,
  VideoAssetTrackReadyWebhookEvent,
  VideoAssetDeletedWebhookEvent,
} from '@mux/mux-node/resources/webhooks'  // Mux 提供的事件类型

import { db } from "@/db"
import { videos } from '@/db/schema'
import { eq } from 'drizzle-orm'

import { mux } from '@/lib/mux'

const SIGNING_SECRET = process.env.MUX_WEBHOOK_SECRET!

// 联合类型
type WebhookEvent = 
  | VideoAssetCreatedWebhookEvent
  | VideoAssetErroredWebhookEvent
  | VideoAssetReadyWebhookEvent
  | VideoAssetTrackReadyWebhookEvent
  | VideoAssetDeletedWebhookEvent

export const POST = async (request: Request) => {
  if(!SIGNING_SECRET) throw new Error('MUX_WEBHOOK_SECRET is not set ')

  const headersPayload = await headers()
  const muxSignature = headersPayload.get('mux-signature')

  if(!muxSignature) {
    return new Response('No signature found', { status: 401 })
  }

  const payload = await request.json() // 请求体
  const body = JSON.stringify(payload)

  mux.webhooks.verifySignature(
    body,  // body
    { "mux-signature": muxSignature, },  // header
    SIGNING_SECRET // secret
  )

  // 类型断言
  // WebhookEvent["type"] 索引访问类型
  switch(payload.type as WebhookEvent["type"]) {
    // 已创建
    case "video.asset.created": {
      const payloadData = payload.data as VideoAssetCreatedWebhookEvent["data"]

      if(!payloadData.upload_id) return new Response("Missing upload Id", { status: 400 })

      await db
        .update(videos)
        .set({
          muxAssetId: payloadData.id,
          muxStatus: payloadData.status
        })
        .where(eq(videos.muxUploadId, payloadData.upload_id)) // 与数据库数据做匹配
      break;
    }
  }

  return new Response('Webhook received', { status: 200 })
}