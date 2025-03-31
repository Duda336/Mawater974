'use client';

import React from 'react';

interface FuelTypeIconProps {
  className?: string;
}

export const FuelTypeIcon: React.FC<FuelTypeIconProps> = ({ className = '' }) => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 256 256"
      className={`h-5 w-5 ${className}`}
    >
      <g>
        <path
          fill="#8B1538"
          d="M227.8,100.8v99.8c0,5-4.1,9.1-9.1,9.1s-9.1-4.1-9.1-9.1v-36.3c0-15-12.2-27.2-27.2-27.2h-27.2V28.2 c0-10-8.1-18.2-18.2-18.2H28.2C18.1,10,10,18.1,10,28.2v199.7c0,10,8.1,18.2,18.2,18.2h108.9c10,0,18.2-8.1,18.2-18.2v-72.6h27.2 c5,0,9.1,4.1,9.1,9.1v36.3c0,15,12.2,27.2,27.2,27.2c15,0,27.2-12.2,27.2-27.2v-118c0-10-8.1-18.2-18.2-18.2V37 c-0.1-4.9-4.1-8.9-9.1-8.9c-5.1,0.1-9.2,4.3-9.1,9.4c0,0.2,0,0.4,0,0.6v44.5C209.7,92.6,217.8,100.8,227.8,100.8 c10,0,18.2-8.1,18.2-18.2s-8.1-18.2-18.2-18.2l0,0 M137.1,109.8c0,5-4.1,9.1-9.1,9.1l0,0H37.2c-5,0-9.1-4.1-9.1-9.1l0,0V55.4 c0-5,4.1-9.1,9.1-9.1l0,0H128c5,0,9.1,4.1,9.1,9.1V109.8L137.1,109.8z"
        />
      </g>
    </svg>
  );
};
