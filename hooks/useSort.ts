

import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

interface SortConfig<K> {
    key: K;
    direction: SortDirection;
}

// Fix: Added an explicit return type to the hook. This prevents TypeScript from
// incorrectly inferring a very narrow type for `requestSort` based on the
// initial sort configuration, which was causing cascading type errors in
// components using this hook like `SortableHeader`.
export const useSort = <T extends object>(
    items: T[],
    initialConfig: SortConfig<keyof T> | null = null
): {
    items: T[];
    requestSort: (key: keyof T) => void;
    getSortDirection: (key: keyof T) => SortDirection | undefined;
} => {
    const [sortConfig, setSortConfig] = useState<SortConfig<keyof T> | null>(initialConfig);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortDirection = (key: keyof T): SortDirection | undefined => {
        if (!sortConfig || sortConfig.key !== key) {
            return undefined;
        }
        return sortConfig.direction;
    }

    return { items: sortedItems, requestSort, getSortDirection };
};