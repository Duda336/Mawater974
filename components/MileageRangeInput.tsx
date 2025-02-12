import React from 'react';

interface MileageRangeInputProps {
  minMileage?: number;
  maxMileage?: number;
  onMileageChange: (min: number, max: number) => void;
}

const MileageRangeInput: React.FC<MileageRangeInputProps> = ({
  minMileage = 0,
  maxMileage = 300000,
  onMileageChange,
}) => {
  const formatMileage = (mileage: number) => {
    try {
      return mileage.toLocaleString();
    } catch (error) {
      return '0';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Min Mileage
          </label>
          <input
            type="number"
            min={0}
            max={maxMileage}
            value={minMileage}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (!isNaN(newMin) && newMin >= 0 && newMin <= (maxMileage ?? 300000)) {
                onMileageChange(newMin, maxMileage ?? 300000);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-700"
            placeholder="Enter minimum mileage"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Max Mileage
          </label>
          <input
            type="number"
            min={minMileage}
            max={300000}
            value={maxMileage}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (!isNaN(newMax) && newMax >= (minMileage ?? 0) && newMax <= 300000) {
                onMileageChange(minMileage ?? 0, newMax);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-700"
            placeholder="Enter maximum mileage"
          />
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
        {minMileage === maxMileage 
          ? `Up to ${formatMileage(maxMileage)} km`
          : `${formatMileage(minMileage)} - ${formatMileage(maxMileage)} km`
        }
      </div>
    </div>
  );
};

MileageRangeInput.defaultProps = {
  minMileage: 0,
  maxMileage: 300000,
};

export default MileageRangeInput;
