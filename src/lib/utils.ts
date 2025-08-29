import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 将以毫秒为单位的duration格式化为"mm:ss"的字符串格式
// padStart() 补0
export const formatDuration = (duration: number) => {
  const seconds = Math.floor((duration % 60000) / 1000)
  const minutes = Math.floor(duration / 60000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export const snakeCaseToTitle = (str: string) => {
  return str.replace(/_/g, '').replace(/\b\w/g, char => char.toUpperCase())
}
