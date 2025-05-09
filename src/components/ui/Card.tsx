import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext'; // Import the theme context

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ children, className, ...props }: CardProps) => {
  const { currentTheme } = useTheme(); // Get the current theme

  return (
    <div
      className={cn(
        'rounded-lg border p-6 shadow-card',
        currentTheme === 'dark'
          ? 'bg-gray-900 border-gray-700 text-gray-100'
          : 'bg-white border-gray-200 text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = ({ children, className, ...props }: CardHeaderProps) => {
  return (
    <div
      className={cn('mb-4 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = ({ children, className, ...props }: CardTitleProps) => {
  const { currentTheme } = useTheme(); // Get the current theme

  return (
    <h3
      className={cn(
        'text-lg font-medium',
        currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const CardDescription = ({
  children,
  className,
  ...props
}: CardDescriptionProps) => {
  const { currentTheme } = useTheme(); // Get the current theme

  return (
    <p
      className={cn(
        'text-sm',
        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500',
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = ({ children, className, ...props }: CardContentProps) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = ({ children, className, ...props }: CardFooterProps) => {
  const { currentTheme } = useTheme(); // Get the current theme

  return (
    <div
      className={cn(
        'mt-4 flex items-center pt-4',
        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;