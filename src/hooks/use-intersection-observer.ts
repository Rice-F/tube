import { useEffect, useRef, useState } from 'react'

// options 是IntersectionObserver的初始化配置
export const useIntersectionObserver = ( options?: IntersectionObserverInit ) => {
  const targetRef = useRef<HTMLDivElement>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    // 被观察者默认是个数组，我们这里只观察一个元素，所以[entry]解构取第一个
    const observer = new IntersectionObserver(( [entry] ) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    if (targetRef.current) observer.observe(targetRef.current)

    // 组件卸载时，取消观察
    return () => observer.disconnect()
  }, [options])

  return {  targetRef, isIntersecting}
}