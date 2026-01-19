'use client';

import { trpc } from '@/trpc/client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { CommentForm } from '@/modules/comments/ui/components/comment-form';

import { CommentItem } from '@/modules/comments/ui/components/comment-item';
import { DEFAULT_LIMIT } from '@/constants';

import { InfiniteScroll } from '@/components/infinite-scroll';

interface CommentsSectionProps {
  videoId: string;
}

export const CommentsSection = ({ videoId }: CommentsSectionProps) => {
  return (
    <Suspense fallback={<div>Loading comments...</div>}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <CommentsSectionSuspense videoId={videoId} />
      </ErrorBoundary>
    </Suspense>
  )
}

const CommentsSectionSuspense = ({ videoId }: CommentsSectionProps) => {
  const [comments, query] = trpc.comments.getMany.useSuspenseInfiniteQuery({ 
    videoId, 
    limit: DEFAULT_LIMIT 
  }, { getNextPageParam: (lastPage) => lastPage.nextCursor });

  return (
    <div className='mt-6'>
      <div className='flex flex-col gap-6'>
        <h1 className="text-xl font-bold">
          { comments.pages[0]?.total } Comments
        </h1>
        <CommentForm videoId={ videoId } />
        <div className='flex flex-col gap-4 mt-2'>
          {comments.pages.flatMap(page => page.commentsData).map(comment => (
            <CommentItem
              key={ comment.id }
              comment={ comment }
            />
          ))}
          <InfiniteScroll
            isManual
            isFetchingNextPage={ query.isFetchingNextPage }
            hasNextPage={ query.hasNextPage }
            fetchNextPage={ () => query.fetchNextPage() }
          />
        </div>
      </div>
    </div>
  )
} 