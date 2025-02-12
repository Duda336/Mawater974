import React from 'react';

interface YearRangeInputProps {
  minYear?: number;
  maxYear?: number;
  onYearChange: (min: number, max: number) => void;
}

const YearRangeInput: React.FC<YearRangeInputProps> = ({
  minYear = 1990,
  maxYear = new Date().getFullYear(),
  onYearChange,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Min Year
          </label>
          <input
            type="number"
            min={1990}
            max={maxYear}
            value={minYear}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (!isNaN(newMin) && newMin >= 1990 && newMin <= (maxYear ?? currentYear)) {
                onYearChange(newMin, maxYear ?? currentYear);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-700"
            placeholder="Enter minimum year"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Max Year
          </label>
          <input
            type="number"
            min={minYear}
            max={currentYear}
            value={maxYear}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (!isNaN(newMax) && newMax >= (minYear ?? 1990) && newMax <= currentYear) {
                onYearChange(minYear ?? 1990, newMax);
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-qatar-maroon focus:border-qatar-maroon hover:bg-gray-50 dark:hover:bg-gray-700"
            placeholder="Enter maximum year"
          />
        </div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
        {minYear === maxYear 
          ? `Year ${maxYear}`
          : `${minYear} - ${maxYear}`
        }
      </div>
    </div>
  );
};

YearRangeInput.defaultProps = {
  minYear: 1990,
  maxYear: new Date().getFullYear(),
};

export default YearRangeInput;
