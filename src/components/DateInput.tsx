import { forwardRef, type ChangeEvent } from 'react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    required?: boolean;
    min?: string;
    max?: string;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
    ({ value, onChange, placeholder, className, required = false, min, max }, ref) => {
        /**
         * Format: DD/MM/YYYY
         * Automatically add slashes as user types
         */
        const formatDateDisplay = (input: string): string => {
            // Remove all non-digit characters
            const digits = input.replace(/\D/g, '');

            if (digits.length === 0) return '';

            // Format as DD/MM/YYYY
            let formatted = '';
            if (digits.length >= 1) {
                formatted = digits.slice(0, 2);
            }
            if (digits.length >= 3) {
                formatted += '/' + digits.slice(2, 4);
            }
            if (digits.length >= 5) {
                formatted += '/' + digits.slice(4, 8);
            }

            return formatted;
        };

        /**
         * Convert DD/MM/YYYY to YYYY-MM-DD for storage
         */
        const parseDate = (displayValue: string): string => {
            const digits = displayValue.replace(/\D/g, '');

            if (digits.length === 8) {
                const day = digits.slice(0, 2);
                const month = digits.slice(2, 4);
                const year = digits.slice(4, 8);

                // Validate date
                const dateObj = new Date(`${year}-${month}-${day}`);
                if (dateObj.toString() !== 'Invalid Date') {
                    return `${year}-${month}-${day}`;
                }
            }

            return '';
        };

        /**
         * Convert YYYY-MM-DD to DD/MM/YYYY for display
         */
        const formatFromStorage = (storedValue: string): string => {
            if (!storedValue) return '';

            // If already in DD/MM/YYYY format
            if (storedValue.includes('/')) return storedValue;

            // Convert from YYYY-MM-DD
            const [year, month, day] = storedValue.split('-');
            if (year && month && day) {
                return `${day}/${month}/${year}`;
            }

            return '';
        };

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const input = e.target.value;
            const formatted = formatDateDisplay(input);
            const parsed = parseDate(formatted);

            // Always update to show formatted display
            e.target.value = formatted;

            // Only send valid date to parent
            if (parsed || formatted === '') {
                onChange(parsed);
            }
        };

        const handleBlur = () => {
            // Validate on blur and convert to storage format if complete
            const displayValue = formatFromStorage(value);
            const parsed = parseDate(displayValue);

            if (parsed) {
                onChange(parsed);
            }
        };

        const displayValue = formatFromStorage(value);

        return (
            <input
                ref={ref}
                type="text"
                value={displayValue}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder || 'DD/MM/YYYY'}
                className={className}
                required={required}
                maxLength={10}
                inputMode="numeric"
            />
        );
    }
);

DateInput.displayName = 'DateInput';

export default DateInput;
