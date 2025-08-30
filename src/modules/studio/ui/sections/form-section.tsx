'use client'

import { trpc } from '@/trpc/client'

import {Suspense, useState} from 'react'
import { ErrorBoundary } from 'react-error-boundary';

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { videosUpdateSchema } from '@/db/schema';

import {
  CopyCheckIcon, 
  CopyIcon, 
  Globe2Icon,
  ImagePlusIcon,
  Loader2Icon,
  LockIcon,
  MoreVerticalIcon, 
  RotateCcwIcon,
  SparklesIcon,
  TrashIcon 
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Form, 
  FormControl,
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage 
} from '@/components/ui/form'

import { toast } from 'sonner'

interface FormSectionProps {
  videoId: string;
}

export const FormSection = ({ videoId }: FormSectionProps) => {
  return (
    <Suspense fallback={<FormSectionSkeleton />} >
      <ErrorBoundary fallback={<p>error</p>} >
        <FormSectionSuspense videoId={ videoId } />
      </ErrorBoundary>
    </Suspense>
  ) 
}

const FormSectionSkeleton = () => {
  return (
    <div>skeleton</div>
  )
}

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const utils = trpc.useUtils()

  const [video] = trpc.studio.getOne.useSuspenseQuery({ videoId })
  const [categories] = trpc.categories.getAll.useSuspenseQuery()

  const formObject = useForm<z.infer<typeof videosUpdateSchema>>({
    resolver: zodResolver(videosUpdateSchema), // 使用videosUpdateSchema验证模式作为表单验证规则
    defaultValues: video // 表单默认值
  })

  const updateForm = trpc.videos.update.useMutation({
    onSuccess: () => {
      utils.studio.getAll.invalidate() // 更新成功后，重新获取视频列表
      utils.studio.getOne.invalidate({ videoId }) // 更新成功后，重新获取当前视频详情
      toast.success('Video updated successfully')
    },
    onError: () => {
      toast.error('Something went wrong')
    }
  })

  const onSubmit = (formData: z.infer<typeof videosUpdateSchema>) => {
    updateForm.mutateAsync(formData)  // 异步触发函数，返回promise
  }

  return (
    <>
      <Form {...formObject}>
        <form onSubmit={ formObject.handleSubmit(onSubmit) }>
          {/* header */}
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold'>Video details</h1>
              <p className='text-xs text-muted-foreground'>Manage your video details</p>
            </div>
            <div className='flex items-center gap-x-2'>
              <Button type="submit" disabled={updateForm.isPending}>Save</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size="icon">
                    <MoreVerticalIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {}}>
                    <TrashIcon className='size-4 mr-2' /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* form */}
          <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'>
            {/* left */}
            <div className='space-y-8 lg:col-span-3'>
              <FormField
                control={ formObject.control }
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className='flex items-center gap-x-2'>
                        Title
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Add a title to your video' 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField 
                control={ formObject.control }
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <div className='flex items-center gap-x-2'>
                        Description
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value ?? ''}
                        rows={10}
                        className='resize-none pr-10 h-60' 
                        placeholder='Add a description to your video' 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                )}
              />
              <FormField 
                control={ formObject.control }
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={ field.onChange } defaultValue={ field.value || undefined }>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select a category' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>{ category.name }</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* right */}
            <div className='flex flex-col gap-y-8 lg:col-span-2'>
              <div className='flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden h-fit'>right</div>
            </div>
          </div>
        </form>
      </Form>
    </>
  )
}