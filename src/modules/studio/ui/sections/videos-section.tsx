'use client'

import { trpc } from '@/trpc/client'

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary';

import { Skeleton } from '@/components/ui/skeleton';

import { DEFAULT_LIMIT } from '@/constants';

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
    <Skeleton></Skeleton>
  )
}

export const VideosSectionSuspense = () => {
  const [videos, query] = trpc.studio.getAll.useSuspenseInfiniteQuery(
    { limit: DEFAULT_LIMIT },
    { getNextPageParam: lastPage => lastPage.nextCursor }
  )

  return (
    <div>{JSON.stringify(videos)}</div>
  )
}
