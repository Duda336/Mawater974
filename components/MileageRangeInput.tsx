import React from 'react';

interface MileageRangeInputProps {
  minMileage: number;
  maxMileage: number;
  onMileageChange: (min: number, max: number) => void;
}

const MileageRangeInput: React.FC<MileageRangeInputProps> = ({
  minMileage,
  maxMileage,
  onMileageChange,
}) => {
  const mileageRanges = [
    0,
    5000,
    10000,
    20000,
    30000,
    50000,
    75000,
    100000,
    150000,
    200000,
    300000
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Min Mileage
          </label>
          <select
            value={minMileage}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin <= maxMileage) {
                onMileageChange(newMin, maxMileage);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {mileageRanges.map((mileage) => (
              <option key={mileage} value={mileage} disabled={mileage > maxMileage}>
                {mileage.toLocaleString()} km
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Max Mileage
          </label>
          <select
            value={maxMileage}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax >= minMileage) {
                onMileageChange(minMileage, newMax);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {mileageRanges.map((mileage) => (
              <option key={mileage} value={mileage} disabled={mileage < minMileage}>
                {mileage.toLocaleString()} km
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
        {minMileage === maxMileage 
          ? `Up to ${maxMileage.toLocaleString()} km`
          : `${minMileage.toLocaleString()} - ${maxMileage.toLocaleString()} km`
        }
      </div>
    </div>
  );
};

export default MileageRangeInput;
