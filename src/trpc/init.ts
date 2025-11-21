import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
import { auth } from '@clerk/nextjs/server';

import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';

import { ratelimit } from '@/lib/ratelimit';

// 创建tRPC上下文
// 该函数会在每个请求中被调用
// cache() 会在服务端请求中缓存这个异步函数的结果，避免重复执行
// auth() 获取用户信息
export const createTRPCContext = cache(async () => {
  const { userId } = await auth(); 
  return { clerkUserId: userId };
});

// tRPC类型推导
// typeof createTRPCContext 结果：() => Promise<{ clerkUserId: string | null; }>
// ReturnType<typeof createTRPCContext>  获取函数返回类型，是Promise类型
// Awaited<> ts内置的类型工具，可提取Promise的返回值类型
// 结合起来，最终的类型结果是 { clerkUserId: string | null; }
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// 创建tRPC实例
// 将 Context 类型注入到所有 procedure 的上下文中
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  // 全局错误格式化器
  errorFormatter({shape, error}){
    console.error('tRPC Error:', error);
    return shape;
  }
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

// 中间件式鉴权
// t.procedure.use()  使用中间件的方式
export const protectedProcedure = t.procedure.use(async function isAuthed(opts) {
  const {ctx} = opts;

  if (!ctx.clerkUserId) throw new TRPCError({ code: 'UNAUTHORIZED' }); // 自动返回401

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, ctx.clerkUserId))
    .limit(1);
  
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' }); // 自动返回401

  // const {success} = await ratelimit.limit(user.id);

  // if(!success) throw new TRPCError({code: 'TOO_MANY_REQUESTS'});

  // 请求继续，进入实际的处理函数(resolver)
  return opts.next({
    ctx: {
      ...ctx,
      user
    },
  })
})