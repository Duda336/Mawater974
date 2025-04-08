"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useCountry } from '@/contexts/CountryContext';



export default function MobileCategoryBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentCountry } = useCountry();

  const categories = [
    { label: "Home", href: `/${currentCountry?.code.toLowerCase()}` },
    { label: "Cars", href: `/${currentCountry?.code.toLowerCase()}/cars` },
    { label: "Sell", href: `/${currentCountry?.code.toLowerCase()}/sell` },
    { label: "Rentals", href: `/${currentCountry?.code.toLowerCase()}/rentals` },
    { label: "Showrooms", href: `/${currentCountry?.code.toLowerCase()}/showrooms` },
    { label: "Spare Parts", href: `/${currentCountry?.code.toLowerCase()}/spare-parts` },
    { label: "Photography", href: `/${currentCountry?.code.toLowerCase()}/car-photography` },
  ];
  return (
    <div className="w-full overflow-x-auto border-b bg-white dark:bg-gray-900 shadow-sm block sm:hidden">
      <div className="flex space-x-4 px-4 py-2 whitespace-nowrap">
        {categories.map((cat) => (
          <button
            key={cat.href}
            onClick={() => router.push(cat.href)}
            className={clsx(
              "px-3 py-1 rounded-full border text-sm transition whitespace-nowrap",
              pathname === cat.href
                ? "bg-white text-qatar-maroon border-qatar-maroon"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
