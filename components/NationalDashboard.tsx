

import React, { useMemo, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { useChurchData, useSystem } from '../hooks/appContext';
import { useUI } from '../hooks/useUI';
import NationalDashboardSkeleton from './skeletons/NationalDashboardSkeleton';
import PageHeader from './PageHeader';
import StatCard from './StatCard.tsx';
import Card from './ui/Card';
import BarChart from './charts/BarChart';
import DoughnutChart from './charts/DoughnutChart';
import RegionsDetailView from './details/RegionsDetailView';
import ChurchesDetailView from './details/ChurchesDetailView';
import MembersDetailView from './details/MembersDetailView';
import OfferingsDetailView from './details/OfferingsDetailView';
import PendingReportsDetailView from './details/PendingReportsDetailView';
import AuditLogView from './details/AuditLogView';
import ConfirmationReportsDetailView from './details/ConfirmationReportsDetailView';
import { ChartOptions } from 'chart.js';
import { chartColors, commonChartOptions, getPast12MonthsLabels } from '../utils/chartUtils';
import { UsersIcon, BuildingLibraryIcon, BuildingOffice2Icon, BanknotesIcon, ClockIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { PERMISSIONS } from '../permissions';
import { Church, Region } from '../types';
import Button from './ui/Button.tsx';
import ReportGenerationModal from './ReportGenerationModal.tsx';
import { exportNationalMonthlyReportPDF } from '../utils/pdfExporter.ts';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const NationalDashboard: React.FC = () => {
    const { data, isLoading, validateWorshipService, rejectWorshipService, isProcessing } = useChurchData();
    const { auditLogs } = useSystem();
    const { user } = useAuth();
    const { activeTab, setActiveTab } = useUI();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const stats = useMemo(() => {
        if (!data) return null;
        // Fix: Added type assertion to resolve 'unknown' type errors.
        const allChurches = Object.values(data.churches) as Church[];
        // Fix: Added type assertion to resolve 'unknown' type errors.
        const allRegions = Object.values(data.regions) as Region[];

        // Add churchId, churchName, and regionId to each service for easier lookup later
        const allServices = allChurches.flatMap(c => c.worshipServices.map(s => ({
            ...s,
            churchId: c.id,
            churchName: c.name,
            regionId: c.regionId,
        })));
        
        const validatedServices = allServices.filter(s => s.status === 'validated');

        const totalRegions = allRegions.length;
        const totalChurches = allChurches.length;
        const totalMembers = allChurches.reduce((sum, church) => sum + church.baptizedMembers.length, 0);
        const totalOffering = validatedServices.reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
        const pendingReports = allServices.filter(s => s.status === 'pending').length;

        const regionsSortedByMembers = allRegions
            .map(r => ({
                name: r.name,
                memberCount: r.churches.reduce((sum, cId) => sum + (data.churches[cId]?.baptizedMembers.length || 0), 0)
            }))
            .sort((a, b) => b.memberCount - a.memberCount)
            .slice(0, 10);

        const monthlyOfferingData = getPast12MonthsLabels().map(monthLabel => {
            return validatedServices
                .filter(s => new Date(s.date).toLocaleString('fr-FR', { month: 'short', year: '2-digit' }) === monthLabel)
                .reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
        });
        
        const allMembers = allChurches.flatMap(c => 
            c.baptizedMembers.map(member => ({
                ...member,
                churchName: c.name,
            }))
        );

        return {
            totalRegions,
            totalChurches,
            totalMembers,
            totalOffering,
            pendingReports,
            regionsSortedByMembers,
            monthlyOfferingData,
            allValidatedOfferings: validatedServices,
            allPendingReports: allServices.filter(s => s.status === 'pending'),
            allValidatedReports: validatedServices,
            allMembers,
        };
    }, [data]);
    
    const handleExportPDF = (year: number, month: number) => {
        if (!data) return;
        exportNationalMonthlyReportPDF(data, year, month);
    };

    if (isLoading || !data || !stats) {
        return <NationalDashboardSkeleton />;
    }
    
    const canValidate = user?.permissions.includes(PERMISSIONS.VALIDATE_REPORTS);
    const canViewFinances = user?.permissions.includes(PERMISSIONS.VIEW_FINANCES);

    const tabs = [
        { id: 'overview', label: "Vue d'ensemble" },
        { id: 'regions', label: 'Régions' },
        { id: 'churches', label: 'Églises' },
        { id: 'members', label: 'Membres' },
        ...(canViewFinances ? [{ id: 'offerings', label: 'Finances' }] : []),
        ...(canValidate ? [
            { id: 'validation', label: 'Validation', count: stats.pendingReports },
            { id: 'confirmed_reports', label: 'Rapports Confirmés' },
        ] : []),
        { id: 'audit', label: "Journal d'audit" },
    ];

    const doughnutOptions: ChartOptions<'doughnut'> = { ...commonChartOptions, plugins: { ...commonChartOptions.plugins, legend: { position: 'right' } } };
    const barOptions: ChartOptions<'bar'> = { ...commonChartOptions, scales: { y: { beginAtZero: true } } };

    const renderContent = () => {
        switch (activeTab) {
            case 'regions':
                return <Card><RegionsDetailView regions={Object.values(data.regions)} churches={data.churches} /></Card>;
            case 'churches':
                 return <Card><ChurchesDetailView churches={Object.values(data.churches)} regions={data.regions} /></Card>;
            case 'members':
                 return <Card><MembersDetailView members={stats.allMembers} totalMembers={stats.totalMembers} /></Card>;
            case 'offerings':
                return (
                    <Card>
                        <OfferingsDetailView 
                            title="Analyse Financière Nationale"
                            offerings={stats.allValidatedOfferings}
                            comparisonData={Object.values(data.regions)}
                            comparisonKey="regionId"
                        />
                    </Card>
                );
            case 'validation':
                return <Card><PendingReportsDetailView reports={stats.allPendingReports} onValidate={validateWorshipService} onReject={rejectWorshipService} isProcessing={isProcessing}/></Card>;
            case 'confirmed_reports':
                return <Card><ConfirmationReportsDetailView reports={stats.allValidatedReports} /></Card>;
            case 'audit':
                return <Card><AuditLogView auditLogs={auditLogs} /></Card>;
            case 'overview':
            default:
                return (
                    <>
                        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-5">
                            <StatCard icon={<BuildingLibraryIcon className="w-6 h-6" />} title="Régions" value={stats.totalRegions} color="blue" onClick={() => setActiveTab('regions')} />
                            <StatCard icon={<BuildingOffice2Icon className="w-6 h-6" />} title="Églises" value={stats.totalChurches} color="purple" onClick={() => setActiveTab('churches')} />
                            <StatCard icon={<UsersIcon className="w-6 h-6" />} title="Membres" value={stats.totalMembers.toLocaleString()} color="green" onClick={() => setActiveTab('members')} />
                            <StatCard icon={<BanknotesIcon className="w-6 h-6" />} title="Offrandes (FCFA)" value={stats.totalOffering.toLocaleString()} color="yellow" onClick={() => canViewFinances && setActiveTab('offerings')} />
                            <StatCard icon={<ClockIcon className="w-6 h-6" />} title="Rapports en attente" value={stats.pendingReports} color="red" onClick={() => canValidate && setActiveTab('validation')} />
                        </div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            <Card className="lg:col-span-3 h-96">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Offrandes des 12 derniers mois</h3>
                                <BarChart options={barOptions} data={{
                                    labels: getPast12MonthsLabels(),
                                    datasets: [{
                                        label: 'Offrandes (FCFA)',
                                        data: stats.monthlyOfferingData,
                                        backgroundColor: chartColors.blue,
                                    }]
                                }} />
                            </Card>
                            <Card className="lg:col-span-2 h-96">
                                 <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Top 10 Régions par Membres</h3>
                                <DoughnutChart options={doughnutOptions} data={{
                                    labels: stats.regionsSortedByMembers.map(r => r.name),
                                    datasets: [{
                                        data: stats.regionsSortedByMembers.map(r => r.memberCount),
                                        backgroundColor: Object.values(chartColors),
                                    }]
                                }} />
                            </Card>
                        </div>
                    </>
                );
        }
    };

    return (
        <div>
            <PageHeader title="Tableau de Bord National" subtitle="Vue d'ensemble de toutes les régions et églises.">
                 <Button onClick={() => setIsReportModalOpen(true)} variant="secondary">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Rapport Mensuel (PDF)
                </Button>
            </PageHeader>
            
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                        >
                            {tab.label}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="ml-2 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-bold">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            {renderContent()}

             <ReportGenerationModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleExportPDF}
                title="Générer le Rapport National Mensuel"
            />
        </div>
    );
};

export default NationalDashboard;