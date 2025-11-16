import React from 'react';
import { WorshipService } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Pagination';
import EmptyState from '../ui/EmptyState';
import { CheckBadgeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DateRangeFilter from '../ui/DateRangeFilter';
import { useMemo, useState } from 'react';
import { exportToCsv } from '../../utils/csvExporter';
import Button from '../ui/Button';

interface ConfirmationReportsDetailViewProps {
    reports: (WorshipService & { churchName: string })[];
}

const ConfirmationReportsDetailView: React.FC<ConfirmationReportsDetailViewProps> = ({ reports }) => {
    
    const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            if (!dateRange.start && !dateRange.end) return true;
            const serviceDate = new Date(r.date);
            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;

            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);

            if (startDate && serviceDate < startDate) return false;
            if (endDate && serviceDate > endDate) return false;
            return true;
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports, dateRange]);

    const { currentData, ...paginationProps } = usePagination(filteredReports, 10);

    const handleExport = () => {
        const dataToExport = filteredReports.map(r => ({
            "Date": r.date,
            "Église": r.churchName,
            "Présence Hommes": r.attendance.men,
            "Présence Femmes": r.attendance.women,
            "Présence Enfants": r.attendance.children,
            "Total Présence": r.attendance.men + r.attendance.women + r.attendance.children,
            "Offrandes Dîmes (FCFA)": r.offering.tithes,
            "Offrandes Régulières (FCFA)": r.offering.regular,
            "Offrandes Spéciales (FCFA)": r.offering.special,
            "Total Offrandes (FCFA)": r.offering.tithes + r.offering.regular + r.offering.special,
            "Statut": r.status,
        }));
        const startDate = dateRange.start ? dateRange.start.split('-').reverse().join('-') : 'debut';
        const endDate = dateRange.end ? dateRange.end.split('-').reverse().join('-') : 'fin';
        exportToCsv(`rapports_confirmes_${startDate}_au_${endDate}.csv`, dataToExport);
    };

    if (reports.length === 0) {
        return (
            <EmptyState
                icon={<CheckBadgeIcon className="h-12 w-12 text-gray-400" />}
                title="Aucun rapport confirmé"
                message="Il n'y a pas encore de rapports avec le statut 'validé'."
            />
        );
    }

    return (
        <div className="space-y-4">
             <div className="md:flex md:items-center md:justify-between">
                <DateRangeFilter onFilter={(start, end) => setDateRange({ start, end })} />
                <div className="mt-4 md:mt-0">
                    <Button onClick={handleExport} variant="secondary">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Exporter (CSV)
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Église</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Présence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Offrandes (FCFA)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.map(report => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{report.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{report.churchName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{(report.attendance.men + report.attendance.women + report.attendance.children).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{(report.offering.tithes + report.offering.regular + report.offering.special).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination {...paginationProps} />
        </div>
    );
};

export default ConfirmationReportsDetailView;