import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChurchData } from '../hooks/appContext';
import { useUI } from '../hooks/useUI';
import { usePermissions } from '../hooks/usePermissions';
import RegionDashboardSkeleton from './skeletons/RegionDashboardSkeleton';
import PageHeader from './PageHeader';
import StatCard from './StatCard.tsx';
import Card from './ui/Card';
import BarChart from './charts/BarChart';
import DoughnutChart from './charts/DoughnutChart';
import Button from './ui/Button';
import { ChartOptions } from 'chart.js';
import { chartColors, commonChartOptions, getPast12MonthsLabels } from '../utils/chartUtils';
import { UsersIcon, BuildingOffice2Icon, BanknotesIcon, ClockIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { PERMISSIONS } from '../permissions';
import { exportRegionMonthlyReportPDF } from '../utils/pdfExporter';
import { Church } from '../types';
import ChurchesDetailView from './details/ChurchesDetailView';
import OfferingsDetailView from './details/OfferingsDetailView';
import BureauManagement from './BureauManagement';
import Modal from './Modal';
import MembersDetailView from './details/MembersDetailView';
import PendingReportsDetailView from './details/PendingReportsDetailView';
import ReportGenerationModal from './ReportGenerationModal.tsx';
import ConfirmationReportsDetailView from './details/ConfirmationReportsDetailView.tsx';


interface RegionDashboardProps {
    regionIdOverride?: string;
}

const RegionDashboard: React.FC<RegionDashboardProps> = ({ regionIdOverride }) => {
    const { user } = useAuth();
    const { data, isLoading, isProcessing, validateWorshipService, rejectWorshipService } = useChurchData();
    const { activeTab, setActiveTab } = useUI();
    const { can } = usePermissions();

    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const regionId = regionIdOverride || user?.regionId;

    const regionData = useMemo(() => {
        if (!data || !regionId) return null;
        const region = data.regions[regionId];
        if (!region) return null;
        
        const churchesData = region.churches.map(id => data.churches[id]).filter((c): c is Church => !!c);
        
        return {
            ...region,
            churchesData
        };
    }, [data, regionId]);
    
    const stats = useMemo(() => {
        if (!regionData) return null;

        const allServices = regionData.churchesData.flatMap(c => 
            c.worshipServices.map(s => ({ 
                ...s, 
                churchName: c.name, 
                churchId: c.id,
                regionId: c.regionId
            }))
        );
        const validatedServices = allServices.filter(s => s.status === 'validated');
        
        const allRegionMembers = regionData.churchesData.flatMap(c => c.baptizedMembers.map(m => ({ ...m, churchName: c.name })));

        const totalChurches = regionData.churchesData.length;
        const totalMembers = allRegionMembers.length;
        const totalOffering = validatedServices.reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
        const pendingReports = allServices.filter(s => s.status === 'pending').length;

        const churchesSortedByMembers = [...regionData.churchesData]
            .sort((a, b) => b.baptizedMembers.length - a.baptizedMembers.length)
            .slice(0, 10);

        const monthlyOfferingData = getPast12MonthsLabels().map(monthLabel => {
            return validatedServices
                .filter(s => new Date(s.date).toLocaleString('fr-FR', { month: 'short', year: '2-digit' }) === monthLabel)
                .reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
        });

        return {
            totalChurches,
            totalMembers,
            totalOffering,
            pendingReports,
            churchesSortedByMembers,
            monthlyOfferingData,
            allValidatedReports: validatedServices,
            allRegionMembers,
            allPendingReports: allServices.filter(s => s.status === 'pending'),
        };
    }, [regionData]);

    if (isLoading) {
        return <RegionDashboardSkeleton />;
    }

    if (!regionData || !stats) {
        return <div>Données de la région non trouvées.</div>;
    }
    
    const canManageBureau = can(PERMISSIONS.MANAGE_BUREAU);
    const canViewFinances = can(PERMISSIONS.VIEW_FINANCES);
    const canValidate = can(PERMISSIONS.VALIDATE_REPORTS);

    const tabs = [
        { id: 'overview', label: "Vue d'ensemble" },
        { id: 'churches', label: 'Églises' },
        ...(canViewFinances ? [{ id: 'offerings', label: 'Finances' }] : []),
        ...(canManageBureau ? [{ id: 'bureau', label: 'Bureau' }] : []),
        ...(canValidate ? [
            { id: 'validation', label: 'Validation', count: stats.pendingReports },
            { id: 'confirmed_reports', label: 'Rapports Confirmés' }
        ] : [])
    ];

    const doughnutOptions: ChartOptions<'doughnut'> = { ...commonChartOptions, plugins: { ...commonChartOptions.plugins, legend: { position: 'right' } } };
    const barOptions: ChartOptions<'bar'> = { ...commonChartOptions, scales: { y: { beginAtZero: true } } };

    const handleExportPDF = (year: number, month: number) => {
        if (!regionData) return;
        exportRegionMonthlyReportPDF(regionData, year, month);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'churches':
                return <Card><ChurchesDetailView churches={regionData.churchesData} regions={data!.regions} /></Card>;
            case 'offerings':
                 return (
                    <Card>
                        <OfferingsDetailView 
                            title={`Analyse Financière - ${regionData.name}`}
                            offerings={stats.allValidatedReports}
                            comparisonData={regionData.churchesData}
                            comparisonKey="churchId"
                        />
                    </Card>
                 );
            case 'bureau':
                return (
                    <Card>
                        <BureauManagement entityType="region" entityId={regionId as string} entityName={regionData.name} />
                    </Card>
                );
            case 'validation':
                return canValidate ? <Card><PendingReportsDetailView reports={stats.allPendingReports} onValidate={validateWorshipService} onReject={rejectWorshipService} isProcessing={isProcessing}/></Card> : null;
            case 'confirmed_reports':
                return canValidate ? <Card><ConfirmationReportsDetailView reports={stats.allValidatedReports} /></Card> : null;
            case 'overview':
            default:
                return (
                    <>
                        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard icon={<BuildingOffice2Icon className="w-6 h-6" />} title="Églises" value={stats.totalChurches} color="purple" onClick={() => setActiveTab('churches')} />
                            <StatCard icon={<UsersIcon className="w-6 h-6" />} title="Membres" value={stats.totalMembers.toLocaleString()} color="green" onClick={() => setIsMembersModalOpen(true)} />
                            {canViewFinances && <StatCard icon={<BanknotesIcon className="w-6 h-6" />} title="Offrandes (Total)" value={`${stats.totalOffering.toLocaleString()} FCFA`} color="yellow" onClick={() => setActiveTab('offerings')} />}
                            <StatCard icon={<ClockIcon className="w-6 h-6" />} title="Rapports en Attente" value={stats.pendingReports} color="red" onClick={() => canValidate && setActiveTab('validation')} />
                        </div>
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                            <Card className="lg:col-span-3 h-96">
                                <h3 className="text-lg font-medium text-gray-800 mb-4">Offrandes des 12 derniers mois</h3>
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
                                <h3 className="text-lg font-medium text-gray-800 mb-4">Top 10 Églises par Membres</h3>
                                <DoughnutChart options={doughnutOptions} data={{
                                    labels: stats.churchesSortedByMembers.map(c => c.name),
                                    datasets: [{
                                        data: stats.churchesSortedByMembers.map(c => c.baptizedMembers.length),
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
            <PageHeader title={`Région: ${regionData.name}`} subtitle="Vue d'ensemble des églises de votre région.">
                <Button onClick={() => setIsReportModalOpen(true)} variant="secondary">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Rapport Mensuel (PDF)
                </Button>
            </PageHeader>
            
            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

            <Modal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} title="Détail des Membres de la Région">
                <MembersDetailView members={stats.allRegionMembers} totalMembers={stats.totalMembers} />
            </Modal>

            <ReportGenerationModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleExportPDF}
                title={`Générer le Rapport Mensuel pour ${regionData.name}`}
            />
        </div>
    );
};

export default RegionDashboard;