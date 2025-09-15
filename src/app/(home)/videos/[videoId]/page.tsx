import { HydrateClient, trpc } from '@/trpc/server';

import { VideoView } from '@/modules/videos/ui/views/video-view';

interface VideoIdPageProps {
  params: Promise<{videoId: string}>;
}

const Page = async ({ params }: VideoIdPageProps) => {
  const { videoId } = await params;

  void trpc.videos.getOne.prefetch({ videoId });

  return (
    <HydrateClient>
      <VideoView videoId = {videoId} />
    </HydrateClient>
  )
}

export default Page