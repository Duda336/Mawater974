// This is a server component
export async function generateStaticParams() {
  // Return an array of objects with countryCode params
  return [
    { countryCode: 'qa' },
    { countryCode: 'kw' },
    { countryCode: 'bh' },
    { countryCode: 'om' },
    { countryCode: 'sa' },
    { countryCode: 'ae' }
  ];
}

export default function ShowroomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
