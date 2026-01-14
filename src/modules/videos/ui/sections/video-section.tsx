'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary';

import { Skeleton } from '@/components/ui/skeleton';
import { VideoPlayer, VideoPlayerSkeleton } from '../components/video-player';
import { VideoBanner } from '../components/video-banner';
import { VideoTopRow, VideoTopRowSkeleton } from '../components/video-top-row';

import { trpc } from '@/trpc/client'

import { cn } from '@/lib/utils'

import { useAuth } from '@clerk/nextjs';

interface VideoSectionProps {
  videoId: string;
}

export const VideoSection = ({ videoId }: VideoSectionProps) => {
  return (
    <Suspense fallback={<VideoSectionSkeleton />}>
      <ErrorBoundary fallback={ <p>Error</p> }>
        <VideoSectionSuspense videoId={ videoId } />
      </ErrorBoundary>
    </Suspense>
  )
}

export const VideoSectionSkeleton = () => {
  return (
    <>
      <VideoPlayerSkeleton />
      <VideoTopRowSkeleton />
    </>
  )
}

export const VideoSectionSuspense = ({ videoId }: VideoSectionProps) => {
  const { isSignedIn } = useAuth();
  const utils = trpc.useUtils()

  const [video] = trpc.videos.getOne.useSuspenseQuery({ videoId });
  const createVideoView = trpc.videoViews.create.useMutation({
    onSuccess: () => {
      utils.videos.getOne.invalidate({ videoId })
    }
  });

  const handlePlay = () => {
    if (!isSignedIn) return
    createVideoView.mutate({ videoId })
  }

  return <>
    {/* aspect-video 保持视频宽高比 */}
    {/* cn() 动态样式 */}
    <div className={cn(
      'aspect-video bg-black rounded-lg overflow-hidden relative',
      video.muxStatus !== 'ready' && 'rounded-b-none'
    )}>
      <VideoPlayer
        playbackId={video.muxPlaybackId}
        thumbnailUrl={video.thumbnailUrl}
        autoPlay={false}
        onPlay={ handlePlay }
      />
    </div>
    <VideoBanner status={ video.muxStatus } />
    <VideoTopRow video={ video } />
  </>
}