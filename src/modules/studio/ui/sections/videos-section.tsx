'use client'

import { trpc } from '@/trpc/client'

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary';
import { LockIcon, Globe2Icon } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton';
import { InfiniteScroll } from '@/components/infinite-scroll';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

import { DEFAULT_LIMIT } from '@/constants';

import {  useRouter } from 'next/navigation'

import { VideoThumbnail } from '@/modules/videos/ui/components/video-thumbnail';

import { snakeCaseToTitle } from '@/lib/utils';
import { format } from 'date-fns'

export const VideosSection = () => {
  return (
    <Suspense fallback={<VideosSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <VideosSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  )
}

export const VideosSkeleton = () => {
  return (
    <div>
      <Table className="border-y">
        <TableHeader>
          <TableRow>
            <TableHead className='pl-6 w-[510px]'>Video</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className='text-right'>Views</TableHead>
            <TableHead className='text-right'>Comments</TableHead>
            <TableHead className='text-right pr-6'>Likes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              <TableCell className='pl-6'>
                <div className='flex items-center gap-4'>
                  <Skeleton className='h-20 w-36' />
                  <div className='flex flex-col gap-2'>
                    <Skeleton className='h-4 w-[100px]' />
                    <Skeleton className='h-3 w-[150px]' />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-20' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-16' />
              </TableCell>
              <TableCell>
                <Skeleton className='h-4 w-24' />
              </TableCell>
              <TableCell className='text-right'>
                <Skeleton className='h-4 w-12 ml-auto' />
              </TableCell>
              <TableCell className='text-right'>
                <Skeleton className='h-4 w-12 ml-auto' />
              </TableCell>
              <TableCell className='text-right pr-6'>
                <Skeleton className='h-4 w-12 ml-auto' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export const VideosSectionSuspense = () => {
  const router = useRouter()

  const [videos, query] = trpc.studio.getAll.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    { getNextPageParam: lastPage => lastPage.nextCursor }
  )

  return (
    <div>
      {/* border-y: 同时给元素的 上边框 (border-top) 和 下边框 (border-bottom) 加上样式 */}
      <Table className="border-y">
        <TableHeader>
          <TableRow>
            <TableHead className='pl-6 w-[510px]'>Video</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className='text-right'>Views</TableHead>
            <TableHead className='text-right'>Comments</TableHead>
            <TableHead className='text-right pr-6'>Likes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.pages.flatMap(page => page.videosData).map(video => (
            <TableRow
              className='cursor-pointer' 
              key={ video.id }
              onClick={ () => router.push(`/studio/videos/${video.id}`) }
            >
              <TableCell className='pl-6'>
                <div className='flex items-center gap-4'>
                  <div className='relative aspect-video w-36 shrink-0'>
                    <VideoThumbnail
                      thumbnailUrl={video.thumbnailUrl} 
                      previewGifUrl={video.previewUrl}
                      title={video.title}
                      duration={video.duration || 0}
                    />
                  </div>
                  <div className='flex flex-col overflow-hidden gap-y-1'>
                    <span className='text-sm line-clamp-1'>{ video.title }</span>
                    <span className='text-xs text-muted-foreground line-clamp-1'>{ video.description || 'No description' }</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center'>
                  {video.visibility === 'private' ? (
                    <LockIcon className="size-4 mr-2" />
                  ) : (
                    <Globe2Icon className="size-4 mr-2" />
                  )}
                  {snakeCaseToTitle(video.visibility)}
                </div>
              </TableCell>
              <TableCell className='text-sm truncate'>
                <div className='flex items-center'>{snakeCaseToTitle(video.muxStatus || 'error')}</div>
              </TableCell>
              <TableCell>{format(new Date(video.createdAt), 'd MMM yyyy')}</TableCell>
              <TableCell className='text-right'>views</TableCell>
              <TableCell className='text-right'>Comments</TableCell>
              <TableCell className='text-right pr-6'>Like</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InfiniteScroll
        hasNextPage={ query.hasNextPage }
        isFetchingNextPage={ query.isFetchingNextPage }
        fetchNextPage={ query.fetchNextPage }
      />
    </div>
  )
}
