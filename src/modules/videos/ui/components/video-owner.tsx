import { VideoGetOneOutput } from '../../types'
import { useAuth } from '@clerk/nextjs'

import Link from 'next/link'

import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { SubscriptionButton } from '@/modules/subscriptions/ui/components/subscription-button'
import { UserInfo } from '@/modules/users/ui/components/user-info'
import { useSubscription } from '@/modules/subscriptions/hooks/use-subscription'

interface VideoOwnerProps {
  user: VideoGetOneOutput['user'],
  videoId: string,
}

export const VideoOwner = ({ user, videoId }: VideoOwnerProps) => {
  const { userId: clerkUserId, isLoaded } = useAuth()
  const { isSubscribePending, handleSubscribeClick } = useSubscription({
    userId: user.clerkId,
    isSubscribed: user.viewerIsSubscribed,
    fromVideoId: videoId,
  })

  return (
    <div className='flex items-center sm:items-start justify-between sm:justify-start gap-3 min-w-0'>
      <Link href={`/users/${user.id}`}>
        <div className='flex items-center gap-3 min-w-0'>
          <UserAvatar size="lg" imageUrl={user.imageUrl} name={user.name} />
          <div className='flex flex-col gap-1 min-w-0'>
            <UserInfo name={user.name} />
            <span className='text-sm text-muted-foreground line-clamp-1'>
              {user.subscriberCount} subscribers
            </span>
          </div>
        </div>
      </Link>
      {clerkUserId === user.clerkId ? (
        <Button
          variant="secondary"
          asChild
          className='rounded-full'
        >
          <Link href={`/studio/videos/${videoId}`}>
            Edit Video
          </Link>
        </Button>
      ) : (
        <SubscriptionButton 
          onClick={handleSubscribeClick}
          disabled={isSubscribePending || !isLoaded}
          isSubscribed={user.viewerIsSubscribed}
          className='flex-none'
        />
      )}
    </div>
  )
}