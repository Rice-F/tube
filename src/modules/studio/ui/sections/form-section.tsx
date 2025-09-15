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
import { snakeCaseToTitle } from '@/lib/utils';

import { VideoPlayer } from '@/modules/videos/ui/components/video-player';
import { ThumbnailUploadModal } from '@/modules/studio/ui/components/thumbnail-upload-modal';
import { ThumbnailGenerateModal } from '@/modules/studio/ui/components/thumbnail-generate-modal';

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { THUMBNAIL_FALLBACK } from '@/modules/videos/constants'

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
    <div>
      <div className='flex items-center justify-between mb-6'>
        <div className='space-y-2'>
          <Skeleton className='h-7 w-32' />
          <Skeleton className='h-4 w-40' />
        </div>
        <Skeleton className='h-9 w-24' />
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-6'> 
        {/* left */}
        <div className='space-y-8 lg:col-span-3'>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-16' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-[220px] w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-[84px] w-[153px]' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
        {/* right */}
        <div className='flex flex-col gap-y-8 lg:col-span-2'>
          <div className='flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden'>
            <Skeleton className='aspect-video' />
            <div className='px-4 py-4 space-y-6'>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-5 w-32' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-5 w-32' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-5 w-32' />
              </div>
            </div>
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-5 w-20' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
      </div>
    </div>
  )
}

const FormSectionSuspense = ({ videoId }: FormSectionProps) => {
  const utils = trpc.useUtils()
  const router = useRouter()

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

  const deleteVideo = trpc.videos.delete.useMutation({
    onSuccess: () => {
      utils.studio.getAll.invalidate() // 更新成功后，重新获取视频列表
      toast.success('Video removed')
      router.push('/studio') // 删除成功后，跳转到视频列表页
    },
    onError: () => {
      toast.error('Something went wrong')
    }
  })

  // link & copy
  const [isCopied, setIsCopied] = useState(false)
  const linkUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/videos/${video.id}`
  const onCopy = async () => {
    await navigator.clipboard.writeText(linkUrl)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }
    , 2000)
  }

  // thumbnail
  const [thumbnailUploadModalOpen, setThumbnailUploadModalOpen] = useState(false)
  const [thumbnailGenerateModalOpen, setThumbnailGenerateModalOpen] = useState(false)

  // restore thumbnail
  const restoreThumbnail = trpc.videos.restoreThumbnail.useMutation({
    onSuccess: () => {
      utils.studio.getAll.invalidate() 
      utils.studio.getOne.invalidate({ videoId }) 
      toast.success('Thumbnail restored')
    },
    onError: () => {
      toast.error('Something went wrong')
    }
  })

  // generate title
  const generateTitle = trpc.videos.generateTitle.useMutation({
    onSuccess: () => {
      toast.success('Title generation started', { description: 'This may take a while.' })
    },
    onError: () => {
      toast.error('Something went wrong')
    }
  })

  // generate description
  const generateDescription = trpc.videos.generateDescription.useMutation({
    onSuccess: () => {
      toast.success('Description generation started', { description: 'This may take a while.' })
    },
    onError: () => {
      toast.error('Something went wrong')
    }
  })

  return (
    <>
      <ThumbnailUploadModal 
        open={thumbnailUploadModalOpen}
        videoId={video.id}
        onOpenChange={setThumbnailUploadModalOpen}
      />
      <ThumbnailGenerateModal 
        open={thumbnailGenerateModalOpen}
        videoId={video.id}
        onOpenChange={setThumbnailGenerateModalOpen}
      />

      {/* Form */}
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
                  <DropdownMenuItem onClick={() => deleteVideo.mutate({ videoId })}>
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
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          className='rounded-full size-6 [&_svg]:size-3'
                          onClick={ () => generateTitle.mutate({ videoId}) }
                          disabled={ generateTitle.isPending || !video.muxTrackId }
                        >
                          { generateTitle.isPending
                              ? <Loader2Icon className='animate-spin'/>
                              : <SparklesIcon />
                          }
                        </Button>
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
                        <Button
                          size="icon"
                          variant="outline"
                          type="button"
                          className='rounded-full size-6 [&_svg]:size-3'
                          onClick={ () => generateDescription.mutate({ videoId}) }
                          disabled={ generateDescription.isPending || !video.muxTrackId}
                        >
                          { generateDescription.isPending
                              ? <Loader2Icon className='animate-spin'/>
                              : <SparklesIcon />
                          }
                        </Button>
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
                name="thumbnailUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>Thumbnail</FormLabel>
                    <FormControl>
                      <div className='p-0.5 border border-dashed border-neutral-400 relative h-[84px] w-[153px] group'>
                        <Image 
                          src={video.thumbnailUrl ?? THUMBNAIL_FALLBACK}
                          fill
                          sizes='153px'
                          alt='Thumbnail'
                          className='object-cover'
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              className='bg-black/50 hover:bg-black/50 absolute top-1 right-1 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 duration-300 size-7'
                            >
                              <MoreVerticalIcon className='text-white' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" side='right'>
                            <DropdownMenuItem onClick={() => setThumbnailUploadModalOpen(true)}>
                              <ImagePlusIcon className='size-4 mr-1' />
                              Change
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setThumbnailGenerateModalOpen(true)}>
                              <SparklesIcon className='size-4 mr-1' />
                              AI-generated
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => restoreThumbnail.mutate({ videoId: video.id })}>
                              <RotateCcwIcon className='size-4 mr-1' />
                              Restore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </FormControl>
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
              <div className='flex flex-col gap-4 bg-[#F9F9F9] rounded-xl overflow-hidden h-fit'>
                <div className='aspect-video overflow-hidden relative'>
                  <VideoPlayer
                    playbackId={video.muxPlaybackId}
                    thumbnailUrl={video.thumbnailUrl}
                  />
                </div>
                <div className='flex flex-col p-4 gap-y-6'>
                  {/* link */}
                  <div className='flex flex-col gap-y-1'>
                    <p className='text-muted-foreground text-xs'>Video link</p>
                    <div className='flex items-center gap-x-2'>
                      <Link href={`/videos/${video.id}`}>
                        <p className='line-clamp-1 text-sm text-blue-500'>{ linkUrl }</p>
                      </Link>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='shrink-0 cursor-pointer'
                        onClick={onCopy}
                        disabled={isCopied}
                      >
                        {isCopied ? <CopyCheckIcon /> : <CopyIcon />}
                      </Button>
                    </div>
                  </div>
                  <div className='flex flex-col gap-y-1'>
                    <p className='text-muted-foreground text-xs'>Video status</p>
                    <p className='text-sm'>{snakeCaseToTitle(video.muxStatus || 'preparing')}</p>
                  </div>
                  <div className='flex flex-col gap-y-1'>
                    <p className='text-muted-foreground text-xs'>Subtitles status</p>
                    <p className='text-sm'>{snakeCaseToTitle(video.muxTrackStatus || 'no_ subtitles')}</p>
                  </div>
                </div>
              </div>
              <FormField
                control={formObject.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>visibility</FormLabel>
                    <Select onValueChange={ field.onChange } defaultValue={ field.value || undefined }>
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select visibility' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center">
                            <Globe2Icon className='size-4 mr-2' />
                            Public
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center">
                            <LockIcon className='size-4 mr-2' />
                            Private
                          </div>
                        </SelectItem> 
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </>
  )
}