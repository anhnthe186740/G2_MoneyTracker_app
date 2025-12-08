import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  );
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function DialogTrigger({ asChild, children, onClick }: DialogTriggerProps) {
  const handleClick = (event: React.MouseEvent) => {
    if (React.isValidElement(children)) {
      children.props.onClick?.(event);
    }
    onClick?.();
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick } as any);
  }
  return <div onClick={handleClick}>{children}</div>;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

export function DialogContent({ children, className = '', onClose }: DialogContentProps) {
  // Check if custom width class is provided to override default max-w-md
  const hasCustomWidth = className.includes('w-[') || className.includes('max-w-');
  const defaultWidthClass = hasCustomWidth ? '' : 'max-w-md w-full';
  
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl mx-4 max-h-[90vh] overflow-y-auto relative border border-border dark:border-slate-800 ${defaultWidthClass} ${className}`}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      {children}
    </div>
  );
}

interface DialogHeaderProps {
  children: ReactNode;
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="p-6 pb-4">{children}</div>;
}

interface DialogTitleProps {
  children: ReactNode;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <h2 className="text-2xl font-semibold text-foreground">{children}</h2>;
}

interface DialogDescriptionProps {
  children: ReactNode;
}

export function DialogDescription({ children }: DialogDescriptionProps) {
  return <p className="text-sm text-muted-foreground mt-2">{children}</p>;
}

