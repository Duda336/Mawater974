import React from 'react';

interface YearRangeInputProps {
  minYear: number;
  maxYear: number;
  onYearChange: (min: number, max: number) => void;
}

const YearRangeInput: React.FC<YearRangeInputProps> = ({
  minYear,
  maxYear,
  onYearChange,
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-white mb-2">
            From Year
          </label>
          <select
            value={minYear}
            onChange={(e) => {
              const newMin = parseInt(e.target.value);
              if (newMin <= maxYear) {
                onYearChange(newMin, maxYear);
              }
            }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none"
          >
            {years.map((year) => (
              <option key={year} value={year} disabled={year > maxYear}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-white mb-2">
            To Year
          </label>
          <select
            value={maxYear}
            onChange={(e) => {
              const newMax = parseInt(e.target.value);
              if (newMax >= minYear) {
                onYearChange(minYear, newMax);
              }
            }}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-qatar-maroon focus:border-qatar-maroon appearance-none"
          >
            {years.map((year) => (
              <option key={year} value={year} disabled={year < minYear}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="text-sm text-gray-400 text-center">
        {minYear === maxYear 
          ? `Showing cars from ${minYear}`
          : `Showing cars from ${minYear} to ${maxYear}`
        }
      </div>
    </div>
  );
};

export default YearRangeInput;
