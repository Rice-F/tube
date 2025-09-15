import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

// 类型推导
export type VideoGetOneOutput = inferRouterOutputs<AppRouter>['videos']['getOne'];