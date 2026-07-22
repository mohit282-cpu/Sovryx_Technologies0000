'use client';

import CEOLayout from '@/components/layout/CEOLayout';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <CEOLayout />
    </ErrorBoundary>
  );
}

