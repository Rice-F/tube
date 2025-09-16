import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from "@/components/ui/button"

import { 
  MoreHorizontalIcon, 
  ShareIcon, 
  ListPlusIcon, 
  Trash2Icon 
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoMenuProps {
  videoId: string;
  variant?: 'ghost' | 'secondary';
  onRemove?: () => void
}

export const VideoMenu = ({
  videoId,
  variant,
  onRemove
}: VideoMenuProps) => {
  const onShare = () => {
    const shareUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/videos/${videoId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size='icon' className='rounded-full'>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' onClick={e => e.stopPropagation}>
        <DropdownMenuItem onClick={ onShare }>
          <ShareIcon className='mr-2 size-4' />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          <ListPlusIcon className='mr-2 size-4' />
          Add to playlist
        </DropdownMenuItem>
        {onRemove && (
          <DropdownMenuItem onClick={() => {}}>
            <Trash2Icon className='mr-2 size-4' />
            Remove
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}