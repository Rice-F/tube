import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { cn } from "@/lib/utils"

import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react"

import {  VideoGetOneOutput } from "../../types"

import { useClerk } from "@clerk/nextjs"

import { trpc } from "@/trpc/client"

import { toast } from "sonner"

interface VideoReactionsProps {
  videoId: string;
  likes: number;
  dislikes: number;
  viewerReaction: VideoGetOneOutput['viewerReaction'];
}

export const VideoReactions = ({
  videoId, 
  likes,
  dislikes,
  viewerReaction
}: VideoReactionsProps) => {
  const clerk = useClerk()
  const utils = trpc.useUtils()

  const likeMutation = trpc.videoReactions.like.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ videoId })
    },
    onError: error => {
      toast.error('Something went wrong')
      if(error.data?.code === 'UNAUTHORIZED') {
        clerk.openSignIn()
      }
    }
  })
  const dislikeMutation = trpc.videoReactions.dislike.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ videoId })
    },
    onError: error => {
      toast.error('Something went wrong')
      if(error.data?.code === 'UNAUTHORIZED') {
        clerk.openSignIn()
      }
    }
  })

  return (
    <div className="flex items-center flex-none">
      <Button
        variant='secondary' 
        className='rounded-full rounded-r-none gap-2 pr-4'
        onClick={() => likeMutation.mutate({ videoId })}
        disabled={ likeMutation.isPending || dislikeMutation.isPending  }
      >
        <ThumbsUpIcon className={cn('size=5', viewerReaction === 'like' && 'fill-black')} />
        {likes}
      </Button>
      <Separator orientation="vertical" className="!h-6" />
      <Button
        variant='secondary' 
        className='rounded-full rounded-l-none pl-3'
        onClick={() => dislikeMutation.mutate({ videoId })}
        disabled={ likeMutation.isPending || dislikeMutation.isPending  }
      >
        <ThumbsDownIcon className={cn('size=5', viewerReaction === 'dislike' && 'fill-black')} />
        {dislikes}
      </Button>
    </div>
  )
}