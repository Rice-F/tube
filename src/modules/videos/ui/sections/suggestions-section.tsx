'use client'

import { trpc } from '@/trpc/client'
import { DEFAULT_LIMIT } from '@/constants'

import { VideoRowCard } from '../components/video-row-card'
import { VideoGridCard } from '../components/video-grid-card'
import { InfiniteScroll } from '@/components/infinite-scroll'
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

interface SuggestionsSectionProps {
  videoId: string;
  isManual?: boolean;
}

export const SuggestionsSection = ({ videoId, isManual }: SuggestionsSectionProps) => {
  return (
    <Suspense fallback={<SuggestionsSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <SuggestionsSectionSuspense videoId={videoId} isManual={isManual} />
      </ErrorBoundary>
    </Suspense>
  )
}

export const SuggestionsSkeleton = () => {
  return (
    <div>skeleton</div>
  )
}

export const SuggestionsSectionSuspense = ({ videoId, isManual }: SuggestionsSectionProps) => {
  const [suggestions, query] = trpc.suggestions.getMany.useSuspenseInfiniteQuery({
    videoId,
    limit: DEFAULT_LIMIT,
  }, { getNextPageParam: lastPage => lastPage.nextCursor })

  return (
    <>
      <div className='hidden md:block space-y-3'>
        {suggestions.pages.flatMap(suggestion => suggestion.videosData.map(video => (
          <VideoRowCard 
            key={video.id}
            data={video}
            size='compact'
          />
        )))}
      </div>
      <div className='block md:hidden space-y-10'>
        {suggestions.pages.flatMap(suggestion => suggestion.videosData.map(video => (
          <VideoGridCard 
            key={video.id}
            data={video}
          />
        )))}
      </div>
      <InfiniteScroll 
        isManual={isManual}
        hasNextPage = { query.hasNextPage }
        isFetchingNextPage = { query.isFetchingNextPage }
        fetchNextPage={ query.fetchNextPage }
      />
    </>
  )
}