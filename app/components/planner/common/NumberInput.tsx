import React from 'react';
import { CustomNumberInput } from '~/components/CustomInput';

interface NumberInputProps {
  value: number;
  onChange: (newValue: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}

export const NumberInput = ({ value, onChange, min, max, disabled }: NumberInputProps) => {
  const handleDecrement = () => {
    if (disabled) return;
    onChange(Math.max(min, value - 1));
  };

  const handleIncrement = () => {
    if (disabled) return;
    const nextValue = value + 1;
    onChange(nextValue > max ? max : nextValue);
  };

  const handleChange = (value: number|null) => {
    if (disabled) return;
    const num = value;
    // Treat as min value if the input is empty or not a number
    if (num==null || isNaN(num)) {
      onChange(min);
    } else {
      // Calibrate values within min and max ranges
      onChange(Math.max(min, Math.min(max, num)));
    }
  };


  const handleSetMin = () => {
    if (disabled) return;
    onChange(min);
  };

  const handleSetMax = () => {
    if (disabled || max === Infinity) return; // Disable if max is infinite
    onChange(max);
  };


  return (
    <div className="flex items-center w-full h-5">
      {/* Min btn */}
      <button
        onClick={handleSetMin}
        disabled={disabled || value === min}
        className="w-7 h-full bg-gray-200 dark:bg-neutral-700 rounded-l text-xs font-bold disabled:opacity-5 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
      >
        0
      </button>

      <button
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="hidden sm:block w-5 h-full bg-gray-300 dark:bg-neutral-600 text-sm font-bold disabled:opacity-5 border-l border-r border-gray-400 dark:border-neutral-500 hover:bg-gray-400 dark:hover:bg-neutral-500"
      >
        -
      </button>

      <CustomNumberInput
        // type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max === Infinity ? undefined : max}
        disabled={disabled}
        className="w-full h-full text-center text-xs font-semibold border-y border-gray-400 dark:border-neutral-600 bg-white dark:bg-neutral-700/50 focus:outline-none dark:text-gray-200"
        style={{ appearance: 'textfield' }}
      />

      <button
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="hidden sm:block w-5 h-full bg-gray-300 dark:bg-neutral-600 text-sm font-bold disabled:opacity-5 border-l border-r border-gray-400 dark:border-neutral-500 hover:bg-gray-400 dark:hover:bg-neutral-500"
      >
        +
      </button>

      {/* Max btn */}
      <button
        onClick={handleSetMax}
        disabled={disabled || value === max || max === Infinity}
        className="w-7 h-full bg-gray-200 dark:bg-neutral-700 rounded-r text-xs font-bold disabled:opacity-5 hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
      >
        M
      </button>
    </div>
  );
};