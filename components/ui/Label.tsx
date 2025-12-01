import { LabelHTMLAttributes, ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

/**
 * Label component - auto-styled by Nillion brand kit CSS
 *
 * The Nillion CSS automatically styles all <label> elements
 */
export function Label({ children, className = '', ...props }: LabelProps) {
  return (
    <label className={className || undefined} {...props}>
      {children}
    </label>
  );
}
