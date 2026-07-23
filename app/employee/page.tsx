export const dynamic = 'force-dynamic';

import EmployeePortalApp from '@/components/employee-portal/EmployeePortalApp';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function EmployeePage() {
  return (
    <ErrorBoundary>
      <EmployeePortalApp />
    </ErrorBoundary>
  );
}
