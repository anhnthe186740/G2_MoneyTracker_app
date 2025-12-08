import { forwardRef, type ChangeEvent } from 'react';

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  required?: boolean;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, placeholder, className, min = 0, required = false }, ref) => {
    const formatNumber = (num: string): string => {
      // Remove all non-digit characters
      const digits = num.replace(/\D/g, '');
      
      // Format with thousand separators
      if (digits === '') return '';
      
      return parseInt(digits, 10).toLocaleString('en-US');
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Remove all non-digit characters to get raw number
      const rawValue = input.replace(/\D/g, '');
      
      // Pass raw number back to parent
      onChange(rawValue);
    };

    const displayValue = value ? formatNumber(value.toString()) : '';

    return (
      <input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        min={min}
        required={required}
        inputMode="numeric"
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
