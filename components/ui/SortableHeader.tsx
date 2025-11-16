import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/solid';

type SortDirection = 'asc' | 'desc';

// Use a simplified, explicit interface instead of extending React.ThHTMLAttributes
// to reduce type complexity, which can be a source of transpiler errors.
// Fix: Re-introduced generics to ensure type safety between the useSort hook and this component.
// The previous implementation with `string` for key types caused type inference to fail.
interface SortableHeaderProps<T> {
    sortKey: keyof T;
    requestSort: (key: keyof T) => void;
    getSortDirection: (key: keyof T) => SortDirection | undefined;
    children: React.ReactNode;
    className?: string;
}

// Fix: Made the component generic to correctly handle typed sort keys from the useSort hook.
function SortableHeader<T extends object>({
    children,
    sortKey,
    requestSort,
    getSortDirection,
    className = '',
}: SortableHeaderProps<T>) {

    const sortDirection = getSortDirection(sortKey);
    const icon =
        sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4 ml-1" /> :
        sortDirection === 'desc' ? <ChevronDownIcon className="w-4 h-4 ml-1" /> :
        <ChevronUpDownIcon className="w-4 h-4 ml-1 text-gray-400 opacity-0 group-hover:opacity-100" />;

    return (
        <th
            // Removed ...restProps for simplicity to avoid potential transpilation issues.
            // Only className is passed through from props.
            onClick={() => requestSort(sortKey)}
            className={`cursor-pointer group ${className}`}
            aria-sort={sortDirection ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
            <div className="flex items-center">
                <span>{children}</span>
                {icon}
            </div>
        </th>
    );
}

export default SortableHeader;