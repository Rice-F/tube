import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

import { z } from "zod";
import { auth } from '@clerk/nextjs/server'
import { db } from "@/db";
import { videos, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const f = createUploadthing();

export const ourFileRouter = {
  thumbnailUploader: 
    f({
      image: {
        maxFileSize: "4MB",
        maxFileCount: 1,
      },
    })
    .input(z.object({ videoId: z.uuid() }))
    // 中间件return的值会传递给onUploadComplete的metadata
    .middleware(async ({ input }) => {
      // 验证clerk用户是否存在
      const { userId: clerkUserId } = await auth();
      if (!clerkUserId) throw new UploadThingError("Unauthorized")

      // 验证数据库用户是否存在
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUserId));
      if (!user) throw new UploadThingError("Unauthorized")

      // 验证视频是否存在
      // 返回值 const [exitingVideo] = {  thumbnailKey: '...' }
      const [exitingVideo] = await db
        .select({ thumbnailKey: videos.thumbnailKey }) // 只查询videos表中的thumbnailKey这一列且返回的字段名为thumbnailKey
        .from(videos)
        .where(and(
          eq(videos.id, input.videoId),
          eq(videos.userId, user.id)
        ))
      if (!exitingVideo) throw new UploadThingError("Video not found") 

      // 如果视频已存在thumbnailKey，删除旧的thumbnail
      if (exitingVideo.thumbnailKey) {
        const utApi = new UTApi();
        await utApi.deleteFiles(exitingVideo.thumbnailKey); // 清除uploadthing旧的thumbnail
        
        await db
          .update(videos)
          .set({ thumbnailKey: null, thumbnailUrl: null }) // 清除数据库中旧的thumbnail
          .where(
            and(
              eq(videos.id, input.videoId),
              eq(videos.userId, user.id)
            )
          );
      }

      return { user, ...input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db
        .update(videos)
        .set({ 
          thumbnailUrl: file.ufsUrl, // 上传后文件的访问地址
          thumbnailKey: file.key, // 上传后文件的唯一标识符
        }) 
        .where(
          and(
            eq(videos.id, metadata.videoId),
            eq(videos.userId, metadata.user.id)
          )
        )

      return { uploadedBy: metadata.user.id };
    })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
