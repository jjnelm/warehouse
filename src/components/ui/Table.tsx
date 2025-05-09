import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

const Table = ({ children, className, ...props }: TableProps) => {
  const { currentTheme } = useTheme();
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn(
          'w-full caption-bottom text-sm',
          currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900',
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

const TableHeader = ({ children, className, ...props }: TableHeaderProps) => {
  const { currentTheme } = useTheme();
  return (
    <thead
  className={cn(
    'border-b',
    currentTheme === 'dark' 
      ? 'bg-gray-900 border-gray-700' 
      : 'bg-gray-50 border-gray-200',
    className
  )}
  {...props}
>
  {children}
</thead>
  );
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

const TableBody = ({ children, className, ...props }: TableBodyProps) => {
  const { currentTheme } = useTheme();
  return (
    <tbody 
    className={cn(
      'divide-y',
      currentTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200',
      className
    )} 
    {...props}
  >
    {children}
  </tbody>
  );
};

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

const TableFooter = ({ children, className, ...props }: TableFooterProps) => {
  const { currentTheme } = useTheme();
  return (
    <tfoot
  className={cn(
    'border-t font-medium',
    currentTheme === 'dark'
      ? 'bg-gray-900 border-gray-700 text-gray-200'
      : 'bg-gray-50 border-gray-200 text-gray-700',
    className
  )}
  {...props}
>
  {children}
</tfoot>
  );
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

const TableRow = ({ children, className, ...props }: TableRowProps) => {
  const { currentTheme } = useTheme();
  return (
    <tr
  className={cn(
    'border-b transition-colors',
    currentTheme === 'dark'
      ? 'border-gray-700 hover:bg-gray-800'
      : 'border-gray-200 hover:bg-gray-50',
    className
  )}
  {...props}
>
  {children}
</tr>
  );
};

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

const TableHead = ({ children, className, ...props }: TableHeadProps) => {
  const { currentTheme } = useTheme();
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium',
        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

const TableCell = ({ children, className, ...props }: TableCellProps) => {
  const { currentTheme } = useTheme();
  return (
    <td
      className={cn(
        'px-4 py-3 align-middle',
        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
};

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
};