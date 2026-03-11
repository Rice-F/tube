import { SuggestionsGetManyOutput } from '../../types'

import Link from 'next/link'

import { VideoThumbnail, VideoThumbnailSkeleton } from './video-thumbnail'
import { VideoInfo, VideoInfoSkeleton } from './video-info'

interface VideoGridCardProps {
  data: SuggestionsGetManyOutput['videosData'][number],
  onRemove?: () => void,
}

export const VideoGridCardSkeleton = () => {
  return (
    <div className='flex flex-col gap-2 w-full'>
      <VideoThumbnailSkeleton />
      <VideoInfoSkeleton />
    </div>
  )
}

export const VideoGridCard = ({ data, onRemove }: VideoGridCardProps) => {
  return (
    <div className='flex flex-col gap-2 w-full group'>
      <Link href={`/videos/${data.id}`}>
        <VideoThumbnail 
          thumbnailUrl={data.thumbnailUrl}
          title={data.title}
          duration={data.duration}
          previewGifUrl={data.previewUrl}
        />
      </Link>
      <VideoInfo data={data} onRemove={onRemove} />
    </div>
  )
}