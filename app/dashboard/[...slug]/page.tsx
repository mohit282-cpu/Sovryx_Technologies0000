export const dynamic = 'force-dynamic';

import CEOLayout from '@/components/layout/CEOLayout';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function DashboardSlugPage() {
  return (
    <ErrorBoundary>
      <CEOLayout />
    </ErrorBoundary>
  );
}
