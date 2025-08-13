import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 需要保护的路由
const isProjectedRoute = createRouteMatcher([
  "/studio(.*)", 
]);

export default  clerkMiddleware(async (auth, req) => {
  if(isProjectedRoute(req)) await auth.protect(); // 基于身份验证保护路由
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};