import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, fullWidth = false, ...props }, ref) => {
    const { currentTheme } = useTheme(); // Get the current theme

    return (
      <div className={cn(fullWidth ? 'w-full' : '')}>
        {label && (
          <label 
            htmlFor={props.id} 
            className={cn(
              'mb-1.5 block text-sm font-medium',
              currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            )}
          >
            {label}
          </label>
        )}
        <input
          className={cn(
            'block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1',
            currentTheme === 'dark'
              ? 'border-gray-600 bg-gray-800 text-white placeholder:text-gray-500 focus:border-primary-500 focus:ring-primary-500'
              : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className={cn(
            'mt-1 text-xs',
            currentTheme === 'dark' ? 'text-red-400' : 'text-red-600'
          )}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;