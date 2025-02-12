import React from 'react';

interface PriceRangeInputProps {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min: number, max: number) => void;
}

const PriceRangeInput: React.FC<PriceRangeInputProps> = ({
  minPrice = 0,
  maxPrice = 10000000,
  onPriceChange,
}) => {
  const formatPrice = (price: number) => {
    try {
      return price.toLocaleString();
    } catch (error) {
      return '0';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Min Price
          </label>
          <input
            type="number"
            min={0}
            max={maxPrice}
            value={minPrice}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (!isNaN(newMin) && newMin >= 0 && newMin <= (maxPrice ?? 10000000)) {
                onPriceChange(newMin, maxPrice ?? 10000000);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-700"
            placeholder="Enter minimum price"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Max Price
          </label>
          <input
            type="number"
            min={minPrice}
            max={10000000}
            value={maxPrice}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (!isNaN(newMax) && newMax >= (minPrice ?? 0) && newMax <= 10000000) {
                onPriceChange(minPrice ?? 0, newMax);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-700"
            placeholder="Enter maximum price"
          />
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
        {minPrice === maxPrice 
          ? `Up to ${formatPrice(maxPrice)} QAR`
          : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)} QAR`
        }
      </div>
    </div>
  );
};

PriceRangeInput.defaultProps = {
  minPrice: 0,
  maxPrice: 10000000,
};

export default PriceRangeInput;
