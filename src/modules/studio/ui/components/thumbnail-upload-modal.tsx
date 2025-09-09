import { ResponsiveModal } from '@/components/responsive-modal'
import { UploadDropzone } from '@/lib/uploadthing';
import { trpc } from '@/trpc/client';

interface ThumbnailUploadModalProps {
  open: boolean;
  videoId: string;
  onOpenChange: (open: boolean) => void;
}

export const ThumbnailUploadModal = ({
  open,
  videoId,
  onOpenChange
}: ThumbnailUploadModalProps) => {
  const utils = trpc.useUtils()

  const onUploadComplete = () => {
    utils.studio.getAll.invalidate();
    utils.studio.getOne.invalidate({ videoId });
    onOpenChange(false);
  }

  return (
    <ResponsiveModal
      title="Upload a thumbnail"
      open={open}
      onOpenChange={onOpenChange}
    >
      <UploadDropzone 
        endpoint="thumbnailUploader"
        input={{ videoId }}
        onClientUploadComplete={onUploadComplete}
      />
    </ResponsiveModal>
  )
}