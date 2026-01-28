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
  parentId?: string;
  onCommentAdded?: () => void;
  onCancelReply?: () => void;
  variant?: "reply" | "comment";  
}

export const CommentForm = ({ 
  videoId, 
  parentId,
  onCommentAdded, 
  onCancelReply,
  variant = "comment"
}: CommentFormProps) => {
  const { user } = useUser();
  const clerk = useClerk();
  const utils = trpc.useUtils()

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.getMany.invalidate({ videoId })
      formObject.reset()
      toast.success('Added successfully')
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
      parentCommentId: parentId,
      videoId,
      value: '',
    },
  })

  const onSubmit = (formData: z.infer<typeof commentInsertSchema>) => {
    createComment.mutate(formData)
  }

  const onCancel = () => {
    formObject.reset()
    onCancelReply?.()
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
                    rows={4}
                    placeholder={
                      variant === "reply"
                        ? "Reply to this comment..."
                        : "Add a comment..."
                    }
                    className="resize-none bg-transparent overflow-hidden min-h-16"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}>
          </FormField>
          <div className="justify-end gap-2 mt-2 flex">
            {onCancelReply && (
              <Button 
                variant="ghost" 
                size="sm"
                type='button'
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button 
              disabled={createComment.isPending} 
              type="submit" 
              size="sm"
            >{variant === "reply" ? "Reply" : "Comment"}</Button>
          </div>
        </div>
      </form>
    </Form>
  )
}