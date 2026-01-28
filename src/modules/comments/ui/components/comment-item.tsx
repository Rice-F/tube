import { CommentsGetManyOutput } from "../../types";

import { UserAvatar } from "@/components/user-avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
 } from "@/components/ui/dropdown-menu";
 import { Button } from "@/components/ui/button";
 import { CommentForm } from "./comment-form";
import { CommentReplies } from "./comment-replies";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { trpc } from '@/trpc/client'
import { 
  MessageSquareIcon, 
  MoreVerticalIcon, 
  Trash2Icon, 
  ThumbsUpIcon, 
  ThumbsDownIcon,
  ChevronUpIcon, 
  ChevronDownIcon
} from "lucide-react";

import { useAuth, useClerk } from "@clerk/nextjs";

import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useState } from "react";
interface CommentItemProps {
  comment: CommentsGetManyOutput["commentsData"][number];
  variant?: "reply" | "comment";
} 

export const CommentItem = ({ comment, variant = "comment" }: CommentItemProps) => {
  const { userId } = useAuth()
  const clerk = useClerk()
  const utils = trpc.useUtils()

  const [isReplyOpen, setIsReplyOpen] = useState(false)  // reply框
  const [isRepliesOpen, setIsRepliesOpen] = useState(false)  // reply列表
   
  const remove = trpc.comments.remove.useMutation({
    onSuccess: () => {
      toast.success("Comment deleted")
      utils.comments.getMany.invalidate({  videoId: comment.videoId })
    },
    onError: (error) => {
      toast.error('Something went wrong')
      if ( error.data?.code === 'UNAUTHORIZED' ) clerk.openSignIn()
    }
  })

  const like = trpc.commentReactions.like.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({  videoId: comment.videoId })
    },
    onError: (error) => {
      toast.error('Something went wrong')
      if ( error.data?.code === 'UNAUTHORIZED' ) clerk.openSignIn()
    }
  })

  const dislike = trpc.commentReactions.dislike.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({  videoId: comment.videoId })
    },
    onError: (error) => {
      toast.error('Something went wrong')
      if ( error.data?.code === 'UNAUTHORIZED' ) clerk.openSignIn()
    }
  })  
  
  return (
    <div>
      <div className="flex gap-4">
        <Link href={ `/user/${ comment.userId }` }>
          <UserAvatar
            size={variant === "comment" ? "lg" : "sm"}
            imageUrl={comment.user?.imageUrl || "/user-placeholder.svg"}
            name={comment.user?.name || "User"}
          />
        </Link>
        <div className="flex-1 min-w-0">
          {/* comment author */}
          <Link href={ `/user/${ comment.userId }` }>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-medium text-sm pb-0.5">{comment.user?.name || "User"}</span>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
            </div>
          </Link>
          {/* comment content */}
          <p className="text-sm">{comment.value}</p>
          {/* reaction */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              {/* like */}
              <Button
                disabled={like.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => { like.mutate({ commentId: comment.id }) }}
              >
                <ThumbsUpIcon className={cn(comment.viewerReaction === 'like' && 'fill-black')} />
              </Button>
              <span className="text-xs text-muted-foreground">{comment.likeCount}</span>
              {/* dislike */}
              <Button
                disabled={dislike.isPending}
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => { dislike.mutate({ commentId: comment.id }) }}
              >
                <ThumbsDownIcon className={cn(comment.viewerReaction === 'dislike' && 'fill-black')} />
              </Button>
              <span className="text-xs text-muted-foreground">{comment.dislikeCount}</span>
            </div>
            {/* reply按钮 */}
            {variant === "comment" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {setIsReplyOpen(true)}}
              >
                Reply
              </Button>
            )}
          </div>
        </div>
        {/* comment actions */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size="icon" className="size-8">
              <MoreVerticalIcon />
            </Button> 
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {variant === "comment" && (
              <DropdownMenuItem onClick={() => {setIsReplyOpen(true)}}>
                <MessageSquareIcon className="size-4" />
                Reply
              </DropdownMenuItem>
            )}
            {comment.user.clerkId === userId && (
              <DropdownMenuItem onClick={() => remove.mutate({ id: comment.id })}>
                <Trash2Icon className="size-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* reply框 */}
      {isReplyOpen && variant === "comment" && (
        <div className="mt-4 pl-14">
          <CommentForm
            variant="reply"
            parentId={comment.id}
            videoId={comment.videoId}
            onCommentAdded={() => { 
              setIsReplyOpen(false) 
              setIsRepliesOpen(true)
            }}
            onCancelReply={() => setIsReplyOpen(false)}
          />
        </div>
      )}
      {/* reply总数 */}
      {comment.replyCount > 0 && variant === 'comment' && (
        <div className="pl-14">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setIsRepliesOpen(current => !current)}
          >
            {isRepliesOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            {comment.replyCount} replies
          </Button>
        </div>
      )}
      {/* reply列表 */}
      {comment.replyCount > 0 && variant === 'comment' && isRepliesOpen && (
        <CommentReplies 
          parentId={comment.id}
          videoId={comment.videoId}
        />
      )}
    </div>
  )
}