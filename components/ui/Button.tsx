import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/**
 * Button component using Nillion brand kit styles
 *
 * Variants:
 * - default: Primary purple button (default <button>)
 * - primary: Same as default (.nillion-button-primary)
 * - secondary: Secondary style (.nillion-button-secondary)
 * - outline: Outlined button (.nillion-button-outline)
 * - ghost: Ghost button (.nillion-button-ghost)
 *
 * Sizes:
 * - small: Compact button (.nillion-small)
 * - medium: Default size
 * - large: Larger button (.nillion-large)
 */
export function Button({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  type = 'submit',
  ...props
}: ButtonProps) {
  // Map variants to Nillion CSS classes
  const getButtonClass = () => {
    switch (variant) {
      case 'primary':
        return 'nillion-button-primary';
      case 'secondary':
        return 'nillion-button-secondary';
      case 'outline':
        return 'nillion-button-outline';
      case 'ghost':
        return 'nillion-button-ghost';
      case 'default':
      default:
        return ''; // Default button styling
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'nillion-small';
      case 'large':
        return 'nillion-large';
      case 'medium':
      default:
        return '';
    }
  };

  const buttonClass = getButtonClass();
  const sizeClass = getSizeClass();
  const finalClassName = [buttonClass, sizeClass, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={finalClassName || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
