import Image from 'next/image';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        <Image
          src="/TireSpinnerLoading.svg"
          alt="Loading spinner"
          width={64}
          height={64}
          className="animate-spin dark:invert"
        />
      </div>
      <span className="ml-2 text-qatar-maroon dark:text-qatar-maroon-light">Loading...</span>
    </div>
  );
}
