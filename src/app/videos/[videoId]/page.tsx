// 将params声明为一个Promise类型
interface VideoIdPageProps{
  params: Promise<{ videoId: string }>;
}

const Page = async ({ params }: VideoIdPageProps) => {
  // 通过await获取异步参数
  const { videoId } = await params; 
  
  return (
    <div>
      video ID: { videoId }
    </div>
  )
}

export default Page;