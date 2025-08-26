"use client";

import { trpc } from "@/trpc/client";

import { Button } from '@/components/ui/button';

import { Loader2Icon, PlusIcon } from 'lucide-react';

import { toast } from 'sonner'

export const StudioUploadModal = () => {
  const utils = trpc.useUtils()

  const createVideo = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success('Video created')
      utils.studio.getAll.invalidate() // 使查询缓存失效，强制获取最新数据
    },
    onError: (err) => {
      toast.error(err.message)
    }
  })
  return (
    <>
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