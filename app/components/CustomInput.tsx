import React, { useState, useEffect, type KeyboardEventHandler } from 'react';
interface CustomNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max' | 'type'> {
    value: number | null;
    onChange: (newValue: number | null) => void;
    min?: number;
    max?: number;
}

export const CustomNumberInput: React.FC<CustomNumberInputProps> = ({
    value,
    onChange,
    min = 0,
    max = Infinity,
    placeholder = '',
    disabled = false,
    ...rest
}) => {
    const [displayValue, setDisplayValue] = useState<string>(value !== null ? String(value) : '');

    useEffect(() => {
        setDisplayValue(value !== null ? String(value) : '');
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;


        if (inputValue === '') {
            setDisplayValue('');
            onChange(null);
            return;
        }

        if (!/^-?\d*$/.test(inputValue)) {
            return;
        }

        const num = parseInt(inputValue, 10);

        if (isNaN(num)) {
            setDisplayValue(inputValue);
            return;
        }

        setDisplayValue(String(num));
    };

    const handleBlur = () => {

        const value = Number(displayValue)
        if (value === null || isNaN(value)) {
            return;
        }
        const clampedValue = Math.max(min, Math.min(max === Infinity ? value : max, value));

        onChange(clampedValue);
        setDisplayValue(String(value));
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
            handleBlur()
        }
    };


    return (
        <input
            type="number"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyUp={handleKeyUp}
            min={min}
            max={max === Infinity ? undefined : max}
            placeholder={placeholder}
            disabled={disabled}

            {...rest}

            style={{
                MozAppearance: 'textfield', // Remove Firefox Spinner
                appearance: 'textfield', // Remove common spinners
            }}
        />
    );
};