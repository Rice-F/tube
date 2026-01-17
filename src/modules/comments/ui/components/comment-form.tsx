'use client'

import { trpc } from '@/trpc/client'

import { UserAvatar } from "@/components/user-avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

import { useUser, useClerk } from "@clerk/nextjs";

import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { commentInsertSchema } from '@/db/schema';

interface CommentFormProps {
  videoId: string;
  onCommentAdded?: () => void;
}

export const CommentForm = ({ videoId, onCommentAdded }: CommentFormProps) => {
  const { user } = useUser();
  const clerk = useClerk();
  const utils = trpc.useUtils()

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId })
      formObject.reset()
      toast.success('Comment added successfully')
      onCommentAdded?.()
    },
    onError: error => {
      if(error.data?.code === 'UNAUTHORIZED') {
        clerk.openSignIn()
        return
      }
      toast.error('Failed to add comment')
    }
  })

  const formObject = useForm<z.infer<typeof commentInsertSchema>>({
    resolver: zodResolver(commentInsertSchema),
    defaultValues: {
      videoId,
      value: '',
    },
  })

  const onSubmit = (formData: z.infer<typeof commentInsertSchema>) => {
    createComment.mutate(formData)
  }
  
  return (
    <Form {...formObject}>
      <form 
        className="flex gap-4 group" 
        onSubmit={ formObject.handleSubmit(onSubmit) }
      >
        <UserAvatar
          size="lg"
          imageUrl={user?.imageUrl || "/user-placeholder.svg"}
          name={user?.username || "User"}
        />
        <div className="flex-1">
          <FormField
            name="value"
            control={formObject.control}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field} 
                    rows={5}
                    placeholder="Add a public comment..."
                    className="resize-none bg-transparent overflow-hidden min-h-20"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}>
          </FormField>
          <div className="justify-end gap-2 mt-2 flex">
            <Button 
              disabled={createComment.isPending} 
              type="submit" 
              size="sm"
            >Comment</Button>
          </div>
        </div>
      </form>
    </Form>
  )
}