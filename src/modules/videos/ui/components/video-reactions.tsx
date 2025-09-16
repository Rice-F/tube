import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { cn } from "@/lib/utils"

import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react"

export const VideoReactions = () => {
  const viewReaction: 'like' | 'dislike' = 'like';

  return (
    <div className="flex items-center flex-none">
      <Button variant='secondary' className='rounded-full rounded-r-none gap-2 pr-4'>
        <ThumbsUpIcon className={cn('size=5', viewReaction === 'like' && 'fill-black')} />
        {1}
      </Button>
      <Separator orientation="vertical" className="!h-6" />
      <Button variant='secondary' className='rounded-full rounded-l-none pl-3'>
        <ThumbsDownIcon className={cn('size=5', viewReaction !== 'like' && 'fill-black')} />
        {1}
      </Button>
    </div>
  )
}