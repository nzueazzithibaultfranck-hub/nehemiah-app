import React, { useState } from 'react';
import Button from './Button';

interface DateRangeFilterProps {
    onFilter: (startDate: string | null, endDate: string | null) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onFilter }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleFilter = () => {
        onFilter(startDate || null, endDate || null);
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        onFilter(null, null);
    };

    return (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                    Date de début
                </label>
                <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                    Date de fin
                </label>
                <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>
            <div className="flex items-end h-full pt-6 space-x-2">
                <Button onClick={handleFilter} size="md">
                    Filtrer
                </Button>
                 <Button onClick={handleClear} variant="secondary" size="md">
                    Réinitialiser
                </Button>
            </div>
        </div>
    );
};

export default DateRangeFilter;