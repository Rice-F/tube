'use client'

import { trpc } from '@/trpc/client'

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface CategoriesSectionProps {
  categoryId?: string;
}

export const CategoriesSection = ({ categoryId }: CategoriesSectionProps) => {
  return (
    // fallback 是加载时的占位符，类似loading
    // ErrorBoundary 是错误边界，捕获子组件的错误，防止整个应用崩溃
    <Suspense fallback={<CategoriesSkeleton />}>
      <ErrorBoundary fallback={<p>Error...</p>}>
        <CategoriesSectionSuspense categoryId={categoryId}/>
      </ErrorBoundary>
    </Suspense>
  )
}

const CategoriesSkeleton = () => {
  return (
    <div>skeleton</div>
  )
}

const CategoriesSectionSuspense = ({ categoryId }: CategoriesSectionProps) => {
  const [categories] = trpc.categories.getAll.useSuspenseQuery()

  return (
    <div>{JSON.stringify(categories)}</div>
  )
}