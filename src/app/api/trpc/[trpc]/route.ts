import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',  // tRPC API 的统一入口
    req,  // HTTP 请求对象
    router: appRouter,  // tRPC 总路由
    createContext: createTRPCContext,  // 上下文，调用每个 procedure 时注入
  });

// 分别导出 GET 和 POST 的处理函数
export { handler as GET, handler as POST };