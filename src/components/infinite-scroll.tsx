import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { useEffect } from "react"
import { Button } from "./ui/button"

interface InfiniteScrollProps {
  isManual?: boolean, // 是否手动加载更多
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
}

export const InfiniteScroll = ({
  isManual = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage
}: InfiniteScrollProps) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    // 观察区域的边距，把视口向四周扩大100px
    // 元素还没真正进入视口只是进入扩大后的区域，也会触发回调
    // 用于懒加载时可以提前加载内容
    rootMargin: '100px',
    // 被观察元素有至少50%出现在视口时，IntersectionObserver的回调被触发
    // 取值范围在0-1之间，也可以是个数组[0, 0.5, 1]表示在多个可见比例时触发回调
    threshold: 0.5
  }) 

  useEffect(() => {
    if (!isManual && isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isManual, isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="flex flex-col items-center p-4 pb-5">
      <div ref={targetRef} className="h-1" />
      {hasNextPage ? (
        <Button 
          variant="secondary"
          disabled={!hasNextPage || isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          You have reached the end of the List
        </p>
      )}
    </div>
  )
}