import 
  MuxUploader,
  {
    MuxUploaderDrop, // 拖拽上传的区域
    MuxUploaderFileSelect, // 文件选择按钮
    MuxUploaderProgress, // 上传进度条
    MuxUploaderStatus, // 上传状态
  } from "@mux/mux-uploader-react";

import { UploadIcon } from "lucide-react";

import { Button } from '@/components/ui/button'

interface StudioUploaderProps {
  endpoint?: string|null; // 可选的上传端点，默认为null
  onSuccess: () => void;
}

const UPLOADER_ID = 'video-uploader'

export const StudioUploader = ({
  endpoint,
  onSuccess
}: StudioUploaderProps ) => {
  return (
    <div>
      <MuxUploader
        endpoint={endpoint}
        onSuccess={onSuccess}
        id={UPLOADER_ID}
        className="hidden group/uploader"
      />
      {/* 拖拽区域 */}
      <MuxUploaderDrop
        muxUploader={UPLOADER_ID}
        className="group/drop"
      >
        <div slot="heading" className="flex flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-2 rounded-full bg-muted w-32 h-32">
            <UploadIcon className="size-10 text-muted-foreground group/drop-[&[active]]:animate-bounce transition-all duration-300" />
          </div>
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm">Drag and drop video files to upload</p>
            <p className="text-xs text-muted-foreground">
              Your videos will be private until you publish them
            </p>
          </div>
          <MuxUploaderFileSelect muxUploader={UPLOADER_ID}>
            <Button type="button" className="rounded-full cursor-pointer">Select files</Button>
          </MuxUploaderFileSelect>
        </div>
        <span slot="separator" className="hidden" />
        <MuxUploaderStatus
          muxUploader={UPLOADER_ID}
          className="text-sm"
        />
        <MuxUploaderProgress
          muxUploader={UPLOADER_ID}
          className="text-sm"
          type="percentage"
        />
        <MuxUploaderProgress
          muxUploader={UPLOADER_ID}
          type="bar"
        />
      </MuxUploaderDrop>
    </div>
  )
}