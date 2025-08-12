'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

let clientQueryClientSingleton: QueryClient;

/**
 * 获取 tRPC 客户端实例
 * - Server: 每次请求都创建新的实例
 * - Browser: 使用单例模式，保持同一个实例
 */
function getQueryClient() {
  // Server: always make a new query client
  if (typeof window === 'undefined') {
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client 单例
  return (clientQueryClientSingleton ??= makeQueryClient());
}

/**
 * 获取 tRPC API 的 URL
 * - Server: 返回空字符串
 * - Vercel 部署: 返回完整的 URL
 * - 本地开发: 返回 http://localhost:3000/api/trpc
 */
function getUrl() {
  const base = (() => {
    // Server
    if (typeof window !== 'undefined') return '';
    // Vercel部署
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    // 本地开发
    return 'http://localhost:3000';
  })();

  return `${base}/api/trpc`;
}

export function TRPCProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          transformer: superjson,
          url: getUrl(),
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}