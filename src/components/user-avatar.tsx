import { Avatar, AvatarImage } from '@/components/ui/avatar';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// cva() 创建样式生成器函数
const avatarVariants = cva('', {
  variants: {
    size: {
      default: 'h-9 w-9',
      xs: 'h-4 w-4',
      sm: 'h-6 w-6',
      lg: 'h-10 w-10',
      xl: 'h-[160px] w-[160px]',
    }
  },
  defaultVariants: {
    size: 'default',
  }
})

// 同时也添加了size属性
interface UseAvatarProps extends VariantProps<typeof avatarVariants> {
  imageUrl: string;
  name: string;
  className?: string;
  onClick?: () => void;
}

export const UserAvatar = ({
  imageUrl,
  name,
  size,
  className,
  onClick
}: UseAvatarProps) => {
  return (
    // avatarVariants({size} 根据size的值生成对应的样式类名，再用cn()函数合并其他类名
    <Avatar className={cn(avatarVariants({size}), className)} onClick={onClick}>
      <AvatarImage src={imageUrl} alt={name}></AvatarImage>
    </Avatar>
  )
}