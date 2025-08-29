import Image from 'next/image'

import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants'

import { formatDuration } from '@/lib/utils'

interface VideoThumbnailProps {
  thumbnailUrl?: string | null,
  previewGifUrl?: string | null,
  title: string,
  duration: number,
}

export const VideoThumbnail = ({
  thumbnailUrl,
  previewGifUrl,
  title,
  duration
}: VideoThumbnailProps) => {
  return (
    <div className="relative group">
      {/* wrapper */}
      <div className="relative w-full overflow-hidden rounded-xl aspect-video">
        {/* 缩略图 */}
        <Image
          src={thumbnailUrl ?? THUMBNAIL_FALLBACK}
          alt={title}
          fill
          sizes='(max-width: 768px) 100vw'
          className='h-full w-full object-cover group-hover:opacity-0'
        />
        {/* 预览gif */}
        <Image
          src={previewGifUrl ?? THUMBNAIL_FALLBACK}
          alt={title}
          unoptimized={!!previewGifUrl} // gif
          fill 
          sizes='(max-width: 768px) 100vw'
          className='h-full w-full object-cover opacity-0 group-hover:opacity-100'
        />
      </div>

      {/* video duration */}
      <div className="absolute bottom-2 right-2 px-1 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {formatDuration(duration)}
      </div>
    </div>
  )
}