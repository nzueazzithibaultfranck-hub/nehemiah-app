import React, { useMemo } from 'react';
import { Church, Region } from '../../types';
import { useFilter } from '../../hooks/useFilter';
import { usePagination } from '../../hooks/usePagination';
import { useUI } from '../../hooks/useUI';
import SearchInput from '../ui/SearchInput';
import Pagination from '../Pagination';
import { exportToCsv } from '../../utils/csvExporter';
import Button from '../ui/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useSort } from '../../hooks/useSort';
import SortableHeader from '../ui/SortableHeader';

interface ChurchesDetailViewProps {
    churches: Church[];
    regions: { [id: string]: Region };
}

type ChurchWithStats = Church & {
    regionName: string;
    memberCount: number;
    pendingReportsCount: number;
}

const ChurchesDetailView: React.FC<ChurchesDetailViewProps> = ({ churches, regions }) => {
    const { setViewOverride } = useUI();

    const churchesWithStats = useMemo<ChurchWithStats[]>(() => churches.map(church => ({
        ...church,
        regionName: regions[church.regionId]?.name || 'N/A',
        memberCount: church.baptizedMembers.length,
        pendingReportsCount: church.worshipServices.filter(s => s.status === 'pending').length
    })), [churches, regions]);

    const filterFn = (church: ChurchWithStats, searchTerm: string) => {
        return (
            church.name.toLowerCase().includes(searchTerm) ||
            church.regionName.toLowerCase().includes(searchTerm)
        );
    };

    const { searchTerm, setSearchTerm, filteredItems } = useFilter(churchesWithStats, filterFn);
    const { items: sortedItems, requestSort, getSortDirection } = useSort(filteredItems, { key: 'name', direction: 'asc' });
    const { currentData, ...paginationProps } = usePagination(sortedItems, 10);

    const handleExport = () => {
        // Fix: Explicitly type the 'c' parameter to prevent type inference issues.
        const dataToExport = sortedItems.map((c: ChurchWithStats) => ({
            "Nom Eglise": c.name,
            "Region": c.regionName,
            "Membres": c.memberCount,
            "Rapports Total": c.worshipServices.length,
            "Rapports en Attente": c.pendingReportsCount
        }));
        exportToCsv('liste_eglises.csv', dataToExport);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Rechercher par nom ou région..."
                    className="w-full max-w-sm"
                />
                <Button onClick={handleExport} variant="secondary">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Exporter
                </Button>
            </div>
            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {/* FIX: Explicitly passing children prop to resolve type error. */}
                            <SortableHeader<ChurchWithStats> sortKey="name" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Église" />
                            {/* FIX: Explicitly passing children prop to resolve type error. */}
                            <SortableHeader<ChurchWithStats> sortKey="regionName" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Région" />
                            {/* FIX: Explicitly passing children prop to resolve type error. */}
                            <SortableHeader<ChurchWithStats> sortKey="memberCount" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Membres" />
                            {/* FIX: Explicitly passing children prop to resolve type error. */}
                            <SortableHeader<ChurchWithStats> sortKey="pendingReportsCount" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Rapports en attente" />
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.map(church => (
                            <tr key={church.id} onClick={() => setViewOverride({ level: 'church', entityId: church.id })} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{church.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{church.regionName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{church.memberCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{church.pendingReportsCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination {...paginationProps} />
        </div>
    );
};

export default ChurchesDetailView;