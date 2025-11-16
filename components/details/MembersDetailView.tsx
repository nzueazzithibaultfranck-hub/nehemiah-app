import React, { useMemo } from 'react';
import { BaptizedMember } from '../../types';
import { exportToCsv } from '../../utils/csvExporter';
import Button from '../ui/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useFilter } from '../../hooks/useFilter';
import { useSort } from '../../hooks/useSort';
import { usePagination } from '../../hooks/usePagination';
import SearchInput from '../ui/SearchInput';
import Pagination from '../Pagination';
import SortableHeader from '../ui/SortableHeader';

interface MembersDetailViewProps {
    members: (BaptizedMember & { churchName?: string })[];
    totalMembers: number;
}

const MembersDetailView: React.FC<MembersDetailViewProps> = ({ members }) => {
    
    const filterFn = (member: BaptizedMember & { churchName?: string }, searchTerm: string) => {
        return (
            member.fullName.toLowerCase().includes(searchTerm) ||
            (member.churchName && member.churchName.toLowerCase().includes(searchTerm)) ||
            member.email.toLowerCase().includes(searchTerm) ||
            member.phone.toLowerCase().includes(searchTerm)
        );
    };

    const { searchTerm, setSearchTerm, filteredItems } = useFilter(members, filterFn);
    const { items: sortedItems, requestSort, getSortDirection } = useSort(filteredItems, { key: 'fullName', direction: 'asc' });
    const { currentData, ...paginationProps } = usePagination(sortedItems, 10);

    const handleExport = () => {
        // Fix: Explicitly type the 'm' parameter to resolve a type inference issue.
        const dataToExport = sortedItems.map((m: BaptizedMember & { churchName?: string }) => ({
            "Nom Complet": m.fullName,
            "Genre": m.gender === 'male' ? 'Homme' : m.gender === 'female' ? 'Femme' : 'N/A',
            "Date de Naissance": m.dateOfBirth,
            "Date de Baptême": m.dateOfBaptism,
            "Téléphone": m.phone,
            "Email": m.email,
            "Adresse": m.address,
            ...(m.churchName && { "Église": m.churchName }),
        }));
        exportToCsv('liste_complete_membres.csv', dataToExport);
    };
    
    if (members.length === 0) {
        return <p className="text-center text-gray-500 py-8">Aucun membre à afficher.</p>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Rechercher un membre..."
                    className="w-full max-w-sm"
                />
                <Button onClick={handleExport} variant="secondary">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Exporter la liste (CSV)
                </Button>
            </div>
            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <SortableHeader<BaptizedMember> sortKey="fullName" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Nom Complet" />
                            <SortableHeader<BaptizedMember> sortKey="gender" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Genre" />
                            <SortableHeader<BaptizedMember> sortKey="dateOfBaptism" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Date de Baptême" />
                            <SortableHeader<BaptizedMember> sortKey="phone" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Téléphone" />
                            {currentData[0]?.churchName && (
                                <SortableHeader<(BaptizedMember & { churchName?: string })> sortKey="churchName" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Église" />
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                        {currentData.map((member) => (
                            <tr key={member.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{member.fullName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300 capitalize">{member.gender === 'male' ? 'Homme' : member.gender === 'female' ? 'Femme' : 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{member.dateOfBaptism}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{member.phone}</td>
                                {member.churchName && (
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{member.churchName}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination {...paginationProps} />
        </div>
    );
};

export default MembersDetailView;