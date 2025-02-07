import React, { useEffect, useRef, useState } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
  formatValue?: (value: number) => string;
  unit?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  minValue,
  maxValue,
  onChange,
  formatValue = (value) => value.toLocaleString(),
  unit = '',
}) => {
  const minThumbRef = useRef<HTMLDivElement>(null);
  const maxThumbRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  const calculatePosition = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const handleMouseDown = (event: React.MouseEvent, thumb: 'min' | 'max') => {
    setIsDragging(thumb);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width;
    const value = Math.round((position * (max - min) + min) / step) * step;

    if (isDragging === 'min') {
      if (value >= min && value <= maxValue - step) {
        onChange(value, maxValue);
      }
    } else {
      if (value <= max && value >= minValue + step) {
        onChange(minValue, value);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minValue, maxValue]);

  return (
    <div className="px-2 relative pt-6">
      <div className="relative h-2" ref={trackRef}>
        <div className="absolute w-full h-full bg-gray-900 rounded-lg"></div>
        <div
          className="absolute h-full bg-qatar-maroon rounded-lg"
          style={{
            left: `${calculatePosition(minValue)}%`,
            right: `${100 - calculatePosition(maxValue)}%`,
          }}
        ></div>
        <div
          ref={minThumbRef}
          className="absolute w-4 h-4 bg-qatar-maroon rounded-full -mt-1 cursor-pointer transform -translate-x-1/2 hover:ring-2 hover:ring-qatar-maroon hover:ring-opacity-50"
          style={{ left: `${calculatePosition(minValue)}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'min')}
        ></div>
        <div
          ref={maxThumbRef}
          className="absolute w-4 h-4 bg-qatar-maroon rounded-full -mt-1 cursor-pointer transform -translate-x-1/2 hover:ring-2 hover:ring-qatar-maroon hover:ring-opacity-50"
          style={{ left: `${calculatePosition(maxValue)}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'max')}
        ></div>
      </div>
      <div className="flex justify-between text-sm text-gray-400 mt-6">
        <span>{formatValue(minValue)} {unit}</span>
        <span>{formatValue(maxValue)} {unit}</span>
      </div>
    </div>
  );
};

export default RangeSlider;
