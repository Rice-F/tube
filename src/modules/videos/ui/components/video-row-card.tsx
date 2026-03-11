import { useMemo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

import Link from 'next/link'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserAvatar } from '@/components/user-avatar'
import { UserInfo } from '@/modules/users/ui/components/user-info'
import { VideoMenu } from './video-menu'
import { VideoThumbnail, VideoThumbnailSkeleton } from './video-thumbnail'

import { SuggestionsGetManyOutput } from '../../types'

const videoRowCardVariants = cva('group flex min-w-0', {
  variants: {
    size: {
      default: 'gap-4',
      compact: 'gap-2'
    },
  },
  defaultVariants: {
    size: 'default',
  }
})

const thumbnailVariants = cva('relative flex-one', {
  variants: {
    size: {
      default: 'w-[38%]',
      compact: 'w-[168px]'
    }
  },
  defaultVariants: {
    size: 'default',
  }
})

interface VideoRowCardProps extends VariantProps<typeof videoRowCardVariants> {
  data: SuggestionsGetManyOutput['videosData'][number], 
  onRemove?: () => void,
}

export const VideoRowCardSkeleton = ({ size }: VariantProps<typeof videoRowCardVariants>) => {
  return (
    <div className={videoRowCardVariants({size})}>
      {/* video */}
      <div className={thumbnailVariants({size})}>
        <VideoThumbnailSkeleton />
      </div>

      {/* video info */}
      <div className='flex-1 min-w-0'>
        <div className='flex justify-between gap-x-2'>
          <div className='flex-1 min-w-0'>
            <Skeleton className={cn('h-5 w-[40%]', size ==='compact' && 'h-4 w-[40%]')} />
            {size === 'default' && (
              <>
                <Skeleton className='h-4 w-[20%] mt-1' />
                <div className='flex items-center gap-2 my-3'>
                  <Skeleton className='size-8 rounded-full' />
                  <Skeleton className='h-4 w-24' />
                </div>
              </>
            )}
            {size === 'compact' && (
              <>
                <Skeleton className='h-4 w-[50%] mt-1' />
              </>
            )}
          </div>
          {/* menu */} 
        </div>
      </div>
    </div> 
  )
}

export const VideoRowCard = ({ data, size, onRemove }: VideoRowCardProps) => {
  const compactViews = useMemo(() => {
    return Intl.NumberFormat('en', {
      notation: 'compact',
    }).format(data.viewCount)
  }, [data.viewCount])

  const compactLikeCount = useMemo(() => {
    return Intl.NumberFormat('en', {
      notation: 'compact',
    }).format(data.likeCount)
  }, [data.likeCount])

  return (
    <div className={videoRowCardVariants({size})}>
      {/* video */}
      <Link href={`/videos/${data.id}`} className={thumbnailVariants({size})}>
        <VideoThumbnail 
          thumbnailUrl={data.thumbnailUrl}
          title={data.title}
          duration={data.duration}
          previewGifUrl={data.previewUrl}
        />
      </Link>

      {/* video info */}
      <div className='flex-1 min-w-0'>
        <div className='flex justify-between gap-x-2'>
          <Link href={`/videos/${data.id}`} className='flex-1 min-w-0'>
            {/* title */}
            <h3
              className={cn('font-medium line-clamp-2', size === 'compact' ? 'text-sm' : 'text-base')}
            >{data.title}</h3>
            {/* like count */}
            {size === 'default' && (
              <p className='text-xs text-muted-foreground mt-1'>{compactViews} views · {compactLikeCount} likes</p>
            )}
            {/* user */}
            {size === 'default' && (
              <>
                <div className='flex items-center gap-2 my-3'>
                  <UserAvatar
                    size="sm"
                    imageUrl={data.user.imageUrl}
                    name={data.user.name}
                  />
                  <UserInfo size="sm" name={data.user.name} />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className='text-xs text-muted-foreground w-fit line-clamp-2'>
                      {data.description ?? 'No description'}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="center"
                    className='bg-black/70'
                  >
                    <p>From the video description</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {size === 'compact' && (
              <UserInfo size="sm" name={data.user.name} />
            )}
            {size === 'compact' && (
              <p className='text-xs text-muted-foreground mt-1'>{compactViews} views · {compactLikeCount} likes</p>
            )}
          </Link>
          <div className='flex-one'>
            <VideoMenu videoId={data.id} onRemove={onRemove} />
          </div>
        </div>
      </div> 
    </div>
  )
}