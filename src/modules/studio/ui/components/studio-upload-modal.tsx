"use client";

import { trpc } from "@/trpc/client";

import { Button } from '@/components/ui/button';
import { ResponsiveModal } from "@/components/responsive-modal";
import { StudioUploader } from "./studio-uploader";

import { Loader2Icon, PlusIcon } from 'lucide-react';

import { toast } from 'sonner'

import { useRouter } from "next/navigation";

export const StudioUploadModal = () => {
  const utils = trpc.useUtils()
  const router = useRouter()

  const createVideo = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success('Video created')
      utils.studio.getAll.invalidate() // 使查询缓存失效，强制获取最新数据
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })

  // 上传视频成功后的回调
  const onSuccess = () => {
    if(!createVideo.data?.video.id)  return

    createVideo.reset() // 重置mutation状态
    router.push(`/studio/videos/${createVideo.data.video.id}`) // 跳转到新创建的视频详情页
  }
  return (
    <>
      <ResponsiveModal
        title="Upload a video"
        open={!!createVideo.data?.uploadUrl}
        onOpenChange={() => createVideo.reset()}
      >
        {createVideo.data?.uploadUrl
          ? <StudioUploader
              endpoint={createVideo.data.uploadUrl}
              onSuccess={onSuccess}
            />
          : <Loader2Icon />
        }
      </ResponsiveModal>

      {/* create.isPending 是否请求中，是否正在mutation */}
      <Button
        variant="secondary"
        onClick={() => createVideo.mutate()} // 触发mutation，提交请求
        disabled={createVideo.isPending}
        className="cursor-pointer"
      >
        {createVideo.isPending ? <Loader2Icon className='animate-spin' /> : <PlusIcon />}
        Create
      </Button>
    </>
  )
}