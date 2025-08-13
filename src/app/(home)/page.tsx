import { HydrateClient, trpc } from '@/trpc/server';

import { HomeView } from '@/modules/home/ui/views/home-view';

// 动态渲染 dynamic rendering
// 强制每次都获取实时数据
export const dynamic = 'force-dynamic'; 

// 从url中自动解析查询参数
interface PageProps {
  searchParams: Promise<{
    categoryId?: string;
  }>
}

const Page = async ({ searchParams }: PageProps) => {
  const { categoryId } = await searchParams;

  void trpc.categories.getAll.prefetch(); 

  return (
    <div>
      <HydrateClient>
        <HomeView categoryId={categoryId} />
      </HydrateClient>
    </div>
  );
}

export default Page
