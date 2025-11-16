import React from 'react';
import { AuditLog } from '../../types';
import { useFilter } from '../../hooks/useFilter';
import { usePagination } from '../../hooks/usePagination';
import SearchInput from '../ui/SearchInput';
import Pagination from '../Pagination';

interface AuditLogViewProps {
    auditLogs: AuditLog[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
    
    const filterFn = (log: AuditLog, searchTerm: string) => {
        return (
            log.actorUsername.toLowerCase().includes(searchTerm) ||
            log.action.toLowerCase().includes(searchTerm) ||
            log.details.toLowerCase().includes(searchTerm)
        );
    };

    const { searchTerm, setSearchTerm, filteredItems } = useFilter(auditLogs, filterFn);
    const { currentData, ...paginationProps } = usePagination(filteredItems, 15);

    return (
        <div className="space-y-4">
             <div className="flex justify-between items-center">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Rechercher dans le journal..."
                    className="w-full max-w-sm"
                />
            </div>
            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Utilisateur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Détails</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.map(log => (
                            <tr key={log.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{log.actorUsername}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{log.action}</td>
                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 dark:text-gray-300">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <Pagination {...paginationProps} />
        </div>
    );
};

export default AuditLogView;