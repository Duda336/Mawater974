export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qatar-maroon dark:border-qatar-maroon-light"></div>
      <span className="ml-2 text-qatar-maroon dark:text-qatar-maroon-light">Loading...</span>
    </div>
  );
}
