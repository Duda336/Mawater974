'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CarDetailPage from '@/app/cars/[id]/page';

export default function CountrySpecificCarDetailPage({
  params,
}: {
  params: { countryCode: string; id: string };
}) {
  return <CarDetailPage params={{ id: params.id }} />;
}
