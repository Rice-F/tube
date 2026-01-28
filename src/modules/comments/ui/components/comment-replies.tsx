import { DEFAULT_LIMIT } from "@/constants";
import { trpc } from "@/trpc/client";
import { CornerDownRightIcon, Loader2Icon } from "lucide-react";

import { CommentItem } from "./comment-item";
import { Button } from "@/components/ui/button";

interface CommentRepliesProps {
  videoId: string;
  parentId: string;
}

export const CommentReplies = ({ videoId, parentId }: CommentRepliesProps) => {
  const { 
    data, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetching 
  } = trpc.comments.getMany.useInfiniteQuery({
    limit: DEFAULT_LIMIT,
    videoId,
    parentId
  }, {
    getNextPageParam: lastPage => lastPage.nextCursor
  })
  
  return (
    <div className="pl-14">
      <div className="flex flex-col ga-4 mt-2">
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading &&
          data?.pages
            .flatMap(page => page.commentsData)
            .map(comment => (
              <CommentItem variant="reply" key={comment.id} comment={comment} />
            ))
        }
      </div>
      {hasNextPage && (
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetching}
        >
          <CornerDownRightIcon />
          Show more replies
        </Button>
      )}
    </div>
  )
}