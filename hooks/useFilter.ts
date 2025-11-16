import { useState, useMemo } from 'react';

type FilterFunction<T> = (item: T, searchTerm: string) => boolean;

/**
 * A hook to filter an array of items based on a search term.
 * @param items The array of items to filter.
 * @param filterFn A function that returns true if an item should be included.
 * @param initialSearchTerm The initial search term.
 * @returns An object containing the search term, a function to set it, and the filtered items.
 */
export const useFilter = <T,>(
    items: T[],
    filterFn: FilterFunction<T>,
    initialSearchTerm: string = ''
) => {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return items;
        }
        return items.filter(item => filterFn(item, searchTerm.toLowerCase()));
    }, [items, searchTerm, filterFn]);

    return { searchTerm, setSearchTerm, filteredItems };
};
