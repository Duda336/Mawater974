'use client';

import ShowroomDetailPage from '@/app/showrooms/[id]/page';

export default function CountrySpecificShowroomDetailPage({
  params,
}: {
  params: { countryCode: string; id: string };
}) {
  return <ShowroomDetailPage params={{ id: params.id }} />;
}
