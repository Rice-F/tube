import { VideoGetOneOutput } from '../../types'
import { useAuth } from '@clerk/nextjs'

import Link from 'next/link'

import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'

interface VideoOwnerProps {
  user: VideoGetOneOutput['user'],
  videoId: string,
}

export const VideoOwner = ({ user, videoId }: VideoOwnerProps) => {
  const { userId: clerkUserId } = useAuth()

  return (
    <div className='flex items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0'>
      <Link href={`/users/${user.id}`}>
        <div className='flex items-center gap-3 min-w-0'>
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />
          <span className='text-sm text-muted-foreground line-clamp-1'>
            {0} subscribers
          </span>
        </div>
      </Link>
      {clerkUserId === user.id ? (
        <Button
          variant="secondary"
          asChild
          className='rounded-full'
        >
          <Link href={`/studio/videos/${videoId}`}>
            Edit Video
          </Link>
        </Button>
      ) : (1)}
    </div>
  )
}