'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAnalytics } from '../hooks/useAnalytics';

export default function AnalyticsProvider({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    // Track page view when the route changes
    trackPageView();
  }, [pathname, searchParams, trackPageView]);

  return <>{children}</>; // Pass through children
}
