import { useState, useRef, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  children: ReactNode;
}

export function SelectTrigger({ children }: SelectTriggerProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used inside Select');

  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground flex items-center justify-between hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
    >
      {children}
      <ChevronDown className="w-4 h-4" />
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
  children?: ReactNode;
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used inside Select');

  // If children are provided, use them (for custom display)
  // Otherwise, show the selected value or placeholder
  if (children) {
    return <span>{children}</span>;
  }
  
  // Find the label for the current value
  // This will be set by SelectItem when rendering
  return <span>{context.value || placeholder || 'Chọn...'}</span>;
}

interface SelectContentProps {
  children: ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used inside Select');

  if (!context.isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => context.setIsOpen(false)}
      />
      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-auto">
        {children}
      </div>
    </>
  );
}

interface SelectItemProps {
  value: string;
  children: ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const context = useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used inside Select');

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      onClick={() => {
        context.onValueChange(value);
        context.setIsOpen(false);
      }}
      className={`w-full px-4 py-2 text-left text-foreground dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${
        isSelected ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/30 dark:text-blue-200' : ''
      }`}
    >
      {children}
    </button>
  );
}
