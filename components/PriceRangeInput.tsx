import React from 'react';

interface PriceRangeInputProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
}

const PriceRangeInput: React.FC<PriceRangeInputProps> = ({
  minPrice,
  maxPrice,
  onPriceChange,
}) => {
  const priceRanges = [
    0,
    50000,
    100000,
    200000,
    300000,
    500000,
    750000,
    1000000,
    2000000,
    5000000,
    10000000
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Min Price
          </label>
          <select
            value={minPrice}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin <= maxPrice) {
                onPriceChange(newMin, maxPrice);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {priceRanges.map((price) => (
              <option key={price} value={price} disabled={price > maxPrice}>
                {price.toLocaleString()} QAR
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Max Price
          </label>
          <select
            value={maxPrice}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax >= minPrice) {
                onPriceChange(minPrice, newMax);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {priceRanges.map((price) => (
              <option key={price} value={price} disabled={price < minPrice}>
                {price.toLocaleString()} QAR
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
        {minPrice === maxPrice 
          ? `Up to ${maxPrice.toLocaleString()} QAR`
          : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} QAR`
        }
      </div>
    </div>
  );
};

export default PriceRangeInput;
