import { SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  className?: string;
}

/**
 * Select component - auto-styled by Nillion brand kit CSS
 *
 * The Nillion CSS automatically styles all <select> elements
 */
export function Select({ options, className = '', ...props }: SelectProps) {
  return (
    <select className={className || undefined} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
