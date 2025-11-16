import React, { useMemo } from 'react';
import { Region, Church } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { useUI } from '../../hooks/useUI';
import Pagination from '../Pagination';
import { useSort } from '../../hooks/useSort';
import SortableHeader from '../ui/SortableHeader';

interface RegionsDetailViewProps {
    regions: Region[];
    churches: { [id: string]: Church };
}

type RegionWithStats = Region & {
    churchCount: number;
    memberCount: number;
}

const RegionsDetailView: React.FC<RegionsDetailViewProps> = ({ regions, churches }) => {
    const { setViewOverride } = useUI();

    const regionData = useMemo<RegionWithStats[]>(() => regions.map(region => {
        const regionChurches = region.churches.map(id => churches[id]).filter(Boolean);
        const members = regionChurches.reduce((sum, c) => sum + c.baptizedMembers.length, 0);
        return {
            ...region,
            churchCount: regionChurches.length,
            memberCount: members,
        };
    }), [regions, churches]);

    const { items: sortedItems, requestSort, getSortDirection } = useSort(regionData, { key: 'memberCount', direction: 'desc' });
    const { currentData, ...paginationProps } = usePagination(sortedItems, 10);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {/* FIX: Explicitly passing children prop to resolve type error. */}
                            <SortableHeader<RegionWithStats> sortKey="name" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" children="Région" />
                            {/* FIX: Explicitly passing children prop to resolve type error. */}
                            <SortableHeader<RegionWithStats> sortKey="churchCount" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" children="Nombre d'Églises" />
                            {/* FIX: Explicitly passing children prop to resolve type error. */}
                            <SortableHeader<RegionWithStats> sortKey="memberCount" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" children="Nombre de Membres" />
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.map(region => (
                            <tr key={region.id} onClick={() => setViewOverride({ level: 'region', entityId: region.id })} className="hover:bg-gray-50 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{region.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.churchCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{region.memberCount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination {...paginationProps} />
        </div>
    );
};

export default RegionsDetailView;