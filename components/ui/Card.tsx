import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Card component using Nillion brand kit .nillion-card class
 *
 * Provides a styled container with padding, border, and shadow
 */
export function Card({ children, className = '', ...props }: CardProps) {
  const finalClassName = ['nillion-card', className].filter(Boolean).join(' ');

  return (
    <div className={finalClassName} {...props}>
      {children}
    </div>
  );
}
