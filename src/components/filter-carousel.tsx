'use client'

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

import { Skeleton } from '@/components/ui/skeleton'; // 骨架屏
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';

interface FilterCarouselProps {
  value?: string | null; // 选中的值
  isLoading?: boolean;
  onSelect: (value: string | null) => void;
  data?: {
    value: string;
    label: string;
  }[];
}

export const FilterCarousel = ({
  value,
  isLoading,
  onSelect,
  data = []
}: FilterCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>(); 
  const [current, setCurrent] = useState(0); // 轮播图当前索引
  const [count, setCount] = useState(0); // 轮播图总数

  // 依赖数组为监听项，监听api变化，若依赖数组为空，相当于mounted()
  useEffect(() => {
    if(!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    })
  }, [api]);

  return (
    <div className='relative w-full'>
      {/* Left Fade 最顶头时不展示 */}
      <div
        className={cn(
          'absolute left-12 top-0 bottom-0 z-1 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none',
          current === 1 && 'hidden'
        )}
      ></div>
      {/* Carousel */}
      <Carousel
        setApi={setApi} // 把 setApi 传进去，这样 Carousel 内部会在初始化时把它的 API 对象传出来，赋值给上面的 api
        opts={{
          align: 'start',
          dragFree: true,
        }}
        className='w-full px-12'
      >
        <CarouselPrevious className='left-0 z-20'/>
        <CarouselContent className='-ml-3'>
          {/* all */}
          {!isLoading && (
            <CarouselItem
              className='pl-3 basis-auto'
              onClick={() => onSelect?.(null)}
            >
              <Badge
                variant={!value ? "default" : "secondary"}
                className="rounded-lg px-3 py-1 cursor-pointer whitespace-nowrap text-sm"
              >All</Badge>
            </CarouselItem>
          )}
          {/* skeleton */}
          {isLoading && Array.from({length: 14}).map((_, index) => (
            <CarouselItem key={index} className='pl-3 basis-auto'>
              <Skeleton className="rounded-lg px-3 h-full text-sm w-[100px] font-semibold">
                &nbsp;
              </Skeleton>
            </CarouselItem>
          ))}
          {/* other */}
          {!isLoading && data.map(item => (
            <CarouselItem
              key={item.value}
              className='pl-3 basis-auto'
              onClick={() => onSelect?.(item.value)}
            >
              <Badge
                variant={value === item.value ? "default" : "secondary"}
                className="rounded-lg px-3 py-1 cursor-pointer whitespace-nowrap text-sm"
              >
                {item.label}
              </Badge>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselNext className='right-0 z-20'/>        
      </Carousel>
      {/* Right Fade 最顶头时不展示 */}
      <div
        className={cn(
          'absolute right-12 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none',
          current === count && 'hidden'
        )}
      ></div>
    </div>
  )
}