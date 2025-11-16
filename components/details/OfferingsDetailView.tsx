import React, { useState, useMemo } from 'react';
import { WorshipService } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import Pagination from '../Pagination';
import DateRangeFilter from '../ui/DateRangeFilter';
import { exportToCsv } from '../../utils/csvExporter';
import Button from '../ui/Button';
import { ArrowDownTrayIcon, BanknotesIcon, ChartBarIcon, ScaleIcon } from '@heroicons/react/24/outline';
import StatCard from '../StatCard';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import { commonChartOptions, chartColors } from '../../utils/chartUtils';
import SortableHeader from '../ui/SortableHeader';
import Card from '../ui/Card';

type OfferingRecord = WorshipService & { churchName: string; totalOffering: number; };

interface FinancialAnalyticsViewProps {
    title: string;
    offerings: (WorshipService & { churchName: string; regionId?: string; churchId?: string; })[];
    comparisonData: { id: string; name: string }[];
    comparisonKey: 'regionId' | 'churchId';
}

const OfferingsDetailView: React.FC<FinancialAnalyticsViewProps> = ({ title, offerings, comparisonData, comparisonKey }) => {
    const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });

    const offeringsWithTotals: OfferingRecord[] = useMemo(() => offerings.map(o => ({
        ...o,
        totalOffering: o.offering.tithes + o.offering.regular + o.offering.special
    })), [offerings]);

    const filteredOfferings = useMemo(() => {
        return offeringsWithTotals.filter(o => {
            if (!dateRange.start && !dateRange.end) return true;
            const serviceDate = new Date(o.date);
            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;
            if (startDate) startDate.setHours(0, 0, 0, 0);
            if (endDate) endDate.setHours(23, 59, 59, 999);
            if (startDate && serviceDate < startDate) return false;
            if (endDate && serviceDate > endDate) return false;
            return true;
        });
    }, [offeringsWithTotals, dateRange]);

    const stats = useMemo(() => {
        const total = filteredOfferings.reduce((sum, s) => sum + s.totalOffering, 0);
        const totalTithes = filteredOfferings.reduce((sum, s) => sum + s.offering.tithes, 0);
        const totalRegular = filteredOfferings.reduce((sum, s) => sum + s.offering.regular, 0);
        const totalSpecial = filteredOfferings.reduce((sum, s) => sum + s.offering.special, 0);
        const average = filteredOfferings.length > 0 ? total / filteredOfferings.length : 0;
        return { total, totalTithes, totalRegular, totalSpecial, average };
    }, [filteredOfferings]);

    const trendChartData = useMemo(() => {
        const monthlyData: { [key: string]: { tithes: number, regular: number, special: number } } = {};
        
        const sortedFilteredOfferings = [...filteredOfferings].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        sortedFilteredOfferings.forEach(o => {
            const monthLabel = new Date(o.date).toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
            if (!monthlyData[monthLabel]) {
                monthlyData[monthLabel] = { tithes: 0, regular: 0, special: 0 };
            }
            monthlyData[monthLabel].tithes += o.offering.tithes;
            monthlyData[monthLabel].regular += o.offering.regular;
            monthlyData[monthLabel].special += o.offering.special;
        });

        const labels = Object.keys(monthlyData);
        
        return {
            labels,
            datasets: [
                { label: 'Dîmes', data: labels.map(m => monthlyData[m].tithes), borderColor: chartColors.blue, backgroundColor: 'rgba(54, 162, 235, 0.2)', fill: true, tension: 0.3 },
                { label: 'Régulière', data: labels.map(m => monthlyData[m].regular), borderColor: chartColors.green, backgroundColor: 'rgba(75, 192, 192, 0.2)', fill: true, tension: 0.3 },
                { label: 'Spéciale', data: labels.map(m => monthlyData[m].special), borderColor: chartColors.yellow, backgroundColor: 'rgba(255, 206, 86, 0.2)', fill: true, tension: 0.3 },
            ]
        };
    }, [filteredOfferings]);

    const comparisonChartData = useMemo(() => {
        const dataByEntity: { [id: string]: number } = {};
        filteredOfferings.forEach(o => {
            const entityId = o[comparisonKey];
            if (entityId) {
                if (!dataByEntity[entityId]) dataByEntity[entityId] = 0;
                dataByEntity[entityId] += o.totalOffering;
            }
        });
        
        const sortedEntities = comparisonData
            .map(entity => ({ ...entity, total: dataByEntity[entity.id] || 0 }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        return {
            labels: sortedEntities.map(e => e.name),
            datasets: [{
                label: 'Total Offrandes (FCFA)',
                data: sortedEntities.map(e => e.total),
                backgroundColor: Object.values(chartColors),
            }]
        };
    }, [filteredOfferings, comparisonData, comparisonKey]);

    const { items: sortedItems, requestSort, getSortDirection } = useSort(filteredOfferings, { key: 'date', direction: 'desc' });
    const { currentData, ...paginationProps } = usePagination(sortedItems, 10);

    const handleExport = () => {
        // Fix: Explicitly type the 'o' parameter as OfferingRecord to resolve type inference issue.
        const dataToExport = sortedItems.map((o: OfferingRecord) => ({
            "Date": o.date,
            "Église": o.churchName,
            "Dîmes (FCFA)": o.offering.tithes,
            "Offrande Régulière (FCFA)": o.offering.regular,
            "Offrande Spéciale (FCFA)": o.offering.special,
            "Total (FCFA)": o.totalOffering,
        }));
        const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        exportToCsv(filename, dataToExport);
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{title}</h2>
                <Button onClick={handleExport} variant="secondary">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Exporter (CSV)
                </Button>
            </div>
            
            <DateRangeFilter onFilter={(start, end) => setDateRange({ start, end })} />
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<BanknotesIcon className="w-6 h-6"/>} title="Offrandes Totales" value={`${stats.total.toLocaleString()} FCFA`} color="green" />
                <StatCard icon={<ScaleIcon className="w-6 h-6"/>} title="Offrande Moy./Culte" value={`${stats.average.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`} color="blue" />
                <StatCard icon={<ChartBarIcon className="w-6 h-6"/>} title="Part des Dîmes" value={`${(stats.total > 0 ? (stats.totalTithes / stats.total) * 100 : 0).toFixed(1)}%`} color="yellow" />
                <StatCard icon={<ChartBarIcon className="w-6 h-6"/>} title="Nb. Cultes Validés" value={filteredOfferings.length.toLocaleString()} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="h-96">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Tendances par type d'offrande</h3>
                    <LineChart data={trendChartData} options={commonChartOptions} />
                </Card>
                <Card className="h-96">
                     <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Top 10 des contributeurs</h3>
                    <BarChart data={comparisonChartData} options={{...commonChartOptions, indexAxis: 'y' as const, scales: { y: { beginAtZero: true } }}} />
                </Card>
            </div>
            
            <div>
                 <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Détail des transactions</h3>
                 <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <SortableHeader<OfferingRecord> sortKey="date" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Date" />
                                <SortableHeader<OfferingRecord> sortKey="churchName" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Église" />
                                <SortableHeader<OfferingRecord> sortKey="totalOffering" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Total (FCFA)" />
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {currentData.map(offering => (
                                <tr key={offering.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{offering.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{offering.churchName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{offering.totalOffering.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination {...paginationProps} />
            </div>
        </div>
    );
};

export default OfferingsDetailView;
