'use client';

import { trpc } from '@/trpc/client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { CommentForm } from '@/modules/comments/ui/components/comment-form';

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
  const [comments] = trpc.comments.getAll.useSuspenseQuery({ videoId });

  return (
    <div className='mt-6'>
      <div className='flex flex-col gap-6'>
        <h1>0 Comments</h1>
        <CommentForm videoId={ videoId } />
      </div>
      {JSON.stringify(comments)}
    </div>
  )
} 