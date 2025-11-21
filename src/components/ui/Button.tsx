// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'lg' | 'sm';
  children: ReactNode;
}

export function Button({ 
  variant = 'default', 
  size = 'default', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-xl transition duration-200 flex items-center justify-center';
  
  const variantStyles = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md',
    outline: 'bg-white border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600',
    secondary: 'bg-white hover:bg-gray-100 text-blue-600 shadow-md'
  };
  
  const sizeStyles = {
    default: 'py-2.5 px-5 text-base',
    lg: 'py-4 px-8 text-lg',
    sm: 'py-2 px-4 text-sm'
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

