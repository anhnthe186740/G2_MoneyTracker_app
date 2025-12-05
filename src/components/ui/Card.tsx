import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-card rounded-lg border border-border shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

