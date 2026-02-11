import { z } from "zod";
import { eq, and, or, lt, desc, getTableColumns} from "drizzle-orm";

import { db } from "@/db";
import { videos, videoViews, videoReactions, users } from '@/db/schema'

import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const suggestionsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        videoId: z.uuid(),
        cursor: z.object({
          id: z.uuid(),
          updatedAt: z.date(),
        }).nullish(),
        limit: z.number().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const { videoId, cursor, limit } = input

      const [exitingVideo] = await db
        .select({
          ...getTableColumns(videos),
          user: users,
          viewCount: db.$count(videoViews, eq(videoViews.videoId, videos.id)),
          likeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, 'like')
          )),
          dislikeCount: db.$count(videoReactions, and(
            eq(videoReactions.videoId, videos.id),
            eq(videoReactions.type, 'dislike')
          ))
        })
        .from(videos)
        .innerJoin(users, eq(videos.userId, users.id))
        .where(eq(videos.id, videoId))

      if (!exitingVideo) throw new TRPCError({code: 'NOT_FOUND'})

      const data = await db
        .select()
        .from(videos)
        .where(and(
          exitingVideo.categoryId 
            ? eq(videos.categoryId, exitingVideo.categoryId)
            : undefined,
          cursor 
            ? or(
                lt(videos.updatedAt, cursor.updatedAt),
                and(
                  eq(videos.updatedAt, cursor.updatedAt),
                  lt(videos.id, cursor.id)
                )
            )
            : undefined,
        ))
        .orderBy(desc(videos.updatedAt), desc(videos.id))
        .limit(limit + 1)

      const hasMore = data.length > limit
      const videosData = hasMore ? data.slice(0, -1) : data
      const lastVideo = videosData[videosData.length - 1]
      const nextCursor = hasMore ? {
        id: lastVideo.id,
        updatedAt: lastVideo.updatedAt,
      } : null

      return {
        videosData,
        nextCursor,
      }
    })
})