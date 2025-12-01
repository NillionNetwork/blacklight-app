'use client';

import { InputHTMLAttributes, useState } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: string; // Custom error message
  validateEmail?: boolean; // Enable email validation
}

/**
 * Input component - auto-styled by Nillion brand kit CSS
 *
 * Features:
 * - Automatic validation for required fields
 * - Email validation when validateEmail={true}
 * - Custom error messages via error prop
 * - Shows errors only after field is touched (onBlur)
 */
export function Input({
  className = '',
  type = 'text',
  required,
  error,
  validateEmail,
  onBlur,
  onChange,
  ...props
}: InputProps) {
  const [touched, setTouched] = useState(false);
  const [value, setValue] = useState(props.value || props.defaultValue || '');

  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
  };

  const getValidationError = (): string | null => {
    if (!touched) return null;

    const currentValue = String(value || '');

    // Check if field is invalid
    if (required && currentValue.trim() === '') {
      // Use custom error message if provided, otherwise use default
      return error || 'This field is required';
    }

    if (validateEmail && currentValue.length > 0 && !isEmailValid(currentValue)) {
      return error || 'Please enter a valid email address';
    }

    return null;
  };

  const validationError = getValidationError();
  const hasError = validationError !== null;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  const inputClassName = [
    hasError ? 'input-error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <input
        type={type}
        required={required}
        className={inputClassName || undefined}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />
      {validationError && (
        <span className="input-error-message">{validationError}</span>
      )}
    </>
  );
}
