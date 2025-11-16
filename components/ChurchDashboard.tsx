import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useChurchData } from '../hooks/appContext';
import { useUI } from '../hooks/useUI';
import { usePermissions } from '../hooks/usePermissions';
import PageHeader from './PageHeader';
import ChurchDashboardSkeleton from './skeletons/ChurchDashboardSkeleton';
import StatCard from './StatCard.tsx';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import WorshipServiceForm from './WorshipServiceForm';
import BaptizedMemberForm from './BaptizedMemberForm';
import ChurchActivityForm from './ChurchActivityForm';
import AnnouncementForm from './AnnouncementForm';
import { WorshipService, BaptizedMember, ChurchActivity, Announcement } from '../types';
import { usePagination } from '../hooks/usePagination';
import Pagination from './Pagination';
import Badge from './ui/Badge';
import { UsersIcon, BanknotesIcon, CalendarDaysIcon, ClockIcon, PlusIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LineChart from './charts/LineChart';
import { commonChartOptions, getPast12MonthsLabels, chartColors } from '../utils/chartUtils';
import { exportToCsv } from '../utils/csvExporter';
import { exportChurchMonthlyReportPDF } from '../utils/pdfExporter';
import { PERMISSIONS } from '../permissions';
import BureauManagement from './BureauManagement';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSort } from '../hooks/useSort';
import SortableHeader from './ui/SortableHeader';
import RapidWorshipServiceEntry from './RapidWorshipServiceEntry';

interface ChurchDashboardProps {
    churchIdOverride?: string;
}

type WorshipServiceWithStats = WorshipService & {
    totalAttendance: number;
    totalOffering: number;
};

const ChurchDashboard: React.FC<ChurchDashboardProps> = ({ churchIdOverride }) => {
    const { user } = useAuth();
    const { 
        data, isLoading, isProcessing, 
        deleteWorshipService, deleteBaptizedMember, deleteChurchActivity, deleteAnnouncement,
        getOfflineQueue, syncOfflineQueueForChurch, 
        deleteWorshipServiceOffline, deleteBaptizedMemberOffline, deleteChurchActivityOffline, deleteAnnouncementOffline
    } = useChurchData();
    const { activeTab, setActiveTab } = useUI();
    const { can } = usePermissions();
    const isOnline = useOnlineStatus();
    
    const [modal, setModal] = useState<{ type: string, data: any | null } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ type: string, data: any } | null>(null);

    const churchId = churchIdOverride || user?.churchId;
    
    const churchData = useMemo(() => {
        if (!data || !churchId) return null;
        return data.churches[churchId];
    }, [data, churchId]);

    // Derived data for tables with sorting and pagination
    const servicesWithStats = useMemo<WorshipServiceWithStats[]>(() => churchData?.worshipServices.map(s => ({
        ...s,
        totalAttendance: s.attendance.men + s.attendance.women + s.attendance.children,
        totalOffering: s.offering.tithes + s.offering.regular + s.offering.special,
    })) || [], [churchData]);

    const { items: sortedServices, requestSort: requestSortServices, getSortDirection: getSortDirectionServices } = useSort(servicesWithStats, { key: 'date', direction: 'desc' });
    const { currentData: paginatedServices, ...servicesPagination } = usePagination(sortedServices, 5);

    const { items: sortedMembers, requestSort: requestSortMembers, getSortDirection: getSortDirectionMembers } = useSort(churchData?.baptizedMembers || [], { key: 'fullName', direction: 'asc' });
    const { currentData: paginatedMembers, ...membersPagination } = usePagination(sortedMembers, 10);
    
    const { items: sortedActivities, requestSort: requestSortActivities, getSortDirection: getSortDirectionActivities } = useSort(churchData?.activities || [], { key: 'date', direction: 'desc' });
    const { currentData: paginatedActivities, ...activitiesPagination } = usePagination(sortedActivities, 5);


    const stats = useMemo(() => {
        if (!churchData) return null;
        const validatedServices = churchData.worshipServices.filter(s => s.status === 'validated');
        const totalOffering = validatedServices.reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
        const totalAttendance = validatedServices.reduce((sum, s) => sum + s.attendance.men + s.attendance.women + s.attendance.children, 0);
        const avgAttendance = validatedServices.length > 0 ? Math.round(totalAttendance / validatedServices.length) : 0;
        const pendingReports = churchData.worshipServices.filter(s => s.status === 'pending').length;

        const monthlyOfferingData = getPast12MonthsLabels().map(monthLabel => {
            return validatedServices
                .filter(s => new Date(s.date).toLocaleString('fr-FR', { month: 'short', year: '2-digit' }) === monthLabel)
                .reduce((sum, s) => sum + s.offering.tithes + s.offering.regular + s.offering.special, 0);
        });

        return {
            memberCount: churchData.baptizedMembers.length,
            totalOffering,
            avgAttendance,
            pendingReports,
            monthlyOfferingData,
        };
    }, [churchData]);

    const offlineQueueCount = getOfflineQueue().filter(item => item.payload.churchId === churchId).length;

    if (isLoading) return <ChurchDashboardSkeleton />;
    if (!churchData || !stats) return <div>Données de l'église non trouvées.</div>;

    const handleDelete = async () => {
        if (!confirmModal || !churchId) return;
        const { type, data } = confirmModal;
        
        const actions = {
            report: { online: deleteWorshipService, offline: deleteWorshipServiceOffline, id: data.id },
            member: { online: deleteBaptizedMember, offline: deleteBaptizedMemberOffline, id: data.id },
            activity: { online: deleteChurchActivity, offline: deleteChurchActivityOffline, id: data.id },
            announcement: { online: deleteAnnouncement, offline: deleteAnnouncementOffline, id: data.id },
        };

        const action = actions[type as keyof typeof actions];

        try {
            if (isOnline) {
                await action.online(churchId, action.id);
            } else {
                await action.offline(churchId, action.id);
            }
        } finally {
            setConfirmModal(null);
        }
    };

    const handleExport = (type: string) => {
        const date = new Date().toISOString().split('T')[0];
        if (type === 'services') exportToCsv(`rapports_culte_${churchData.name}_${date}.csv`, sortedServices);
        if (type === 'members') exportToCsv(`membres_${churchData.name}_${date}.csv`, sortedMembers);
        if (type === 'activities') exportToCsv(`activites_${churchData.name}_${date}.csv`, sortedActivities);
    };

    const handleExportPDF = () => {
        const d = new Date();
        exportChurchMonthlyReportPDF(churchData, d.getFullYear(), d.getMonth() + 1);
    };

    const canManageReports = can(PERMISSIONS.MANAGE_REPORTS);
    const canManageMembers = can(PERMISSIONS.MANAGE_MEMBERS);
    const canManageActivities = can(PERMISSIONS.MANAGE_ACTIVITIES);
    const canManageBureau = can(PERMISSIONS.MANAGE_BUREAU);
    const canManageAnnouncements = can(PERMISSIONS.MANAGE_ANNOUNCEMENTS);
    const canViewFinances = can(PERMISSIONS.VIEW_FINANCES);

    const tabs = [
        { id: 'overview', label: "Vue d'ensemble" },
        ...(canManageReports ? [{ id: 'reports', label: "Rapports de Culte" }] : []),
        ...(canManageMembers ? [{ id: 'members', label: "Membres Baptisés" }] : []),
        ...(canManageActivities ? [{ id: 'activities', label: "Activités" }] : []),
        ...(canManageAnnouncements ? [{ id: 'communications', label: "Communications" }] : []),
        ...(canManageBureau ? [{ id: 'bureau', label: "Bureau" }] : []),
    ];

    const getStatusBadge = (report: WorshipService) => {
        const baseBadge = {
            validated: <Badge color="green">Validé</Badge>,
            pending: <Badge color="yellow">En attente</Badge>,
            rejected: <Badge color="red">Rejeté</Badge>,
            offline: <Badge color="gray">Hors ligne</Badge>,
            'offline-modified': <Badge color="gray">Hors ligne (Modifié)</Badge>,
        }[report.status];

        return (
             <div className="flex items-center space-x-1">
                {baseBadge}
                {report.status === 'rejected' && report.rejectionReason && (
                    <div className="group relative">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-pointer" />
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 transform rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            {report.rejectionReason}
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    const getGenericStatusBadge = (status?: 'offline' | 'offline-modified') => {
        switch(status) {
            case 'offline': return <Badge color="gray">Hors ligne</Badge>;
            case 'offline-modified': return <Badge color="gray">Hors ligne (Modifié)</Badge>;
            default: return null;
        }
    }
    
    const renderContent = () => {
        switch (activeTab) {
            case 'reports':
                return (
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium dark:text-gray-200">Rapports de Culte</h3>
                            <div className="space-x-2">
                                <Button onClick={() => handleExport('services')} variant="secondary" size="sm"><ArrowDownTrayIcon className="h-4 w-4 mr-1" />Exporter (CSV)</Button>
                                <Button onClick={() => setModal({ type: 'rapid-entry', data: null })} variant="secondary" size="sm">Saisie Rapide</Button>
                                <Button onClick={() => setModal({ type: 'report', data: null })} size="sm"><PlusIcon className="h-4 w-4 mr-1" />Ajouter</Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<WorshipServiceWithStats> sortKey="date" requestSort={requestSortServices} getSortDirection={getSortDirectionServices} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Date" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<WorshipServiceWithStats> sortKey="speaker" requestSort={requestSortServices} getSortDirection={getSortDirectionServices} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Orateur" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<WorshipServiceWithStats> sortKey="totalAttendance" requestSort={requestSortServices} getSortDirection={getSortDirectionServices} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Présence" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<WorshipServiceWithStats> sortKey="totalOffering" requestSort={requestSortServices} getSortDirection={getSortDirectionServices} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Offrandes" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<WorshipServiceWithStats> sortKey="status" requestSort={requestSortServices} getSortDirection={getSortDirectionServices} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Statut" />
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    {paginatedServices.map((s: WorshipServiceWithStats) => (
                                        <tr key={s.id}>
                                            <td className="px-4 py-2 dark:text-gray-300">{s.date}</td>
                                            <td className="px-4 py-2 dark:text-gray-300">{s.speaker}</td>
                                            <td className="px-4 py-2 dark:text-gray-300">{s.totalAttendance}</td>
                                            <td className="px-4 py-2 dark:text-gray-300">{s.totalOffering.toLocaleString()}</td>
                                            <td className="px-4 py-2">{getStatusBadge(s)}</td>
                                            <td className="px-4 py-2 space-x-1">
                                                <Button size="sm" variant="secondary" onClick={() => setModal({type: 'report', data: s})} disabled={s.status === 'validated'}><PencilIcon className="h-4 w-4"/></Button>
                                                <Button size="sm" variant="danger" onClick={() => setConfirmModal({type: 'report', data: s})} disabled={s.status === 'validated'}><TrashIcon className="h-4 w-4"/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination {...servicesPagination} />
                    </Card>
                );
             case 'members':
                return (
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium dark:text-gray-200">Membres Baptisés</h3>
                             <div className="space-x-2">
                                <Button onClick={() => handleExport('members')} variant="secondary" size="sm"><ArrowDownTrayIcon className="h-4 w-4 mr-1" />Exporter (CSV)</Button>
                                <Button onClick={() => setModal({ type: 'member', data: null })} size="sm"><PlusIcon className="h-4 w-4 mr-1" />Ajouter</Button>
                            </div>
                        </div>
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                 <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<BaptizedMember> sortKey="fullName" requestSort={requestSortMembers} getSortDirection={getSortDirectionMembers} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Nom Complet" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<BaptizedMember> sortKey="gender" requestSort={requestSortMembers} getSortDirection={getSortDirectionMembers} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Genre" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<BaptizedMember> sortKey="dateOfBaptism" requestSort={requestSortMembers} getSortDirection={getSortDirectionMembers} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Date de Baptême" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<BaptizedMember> sortKey="status" requestSort={requestSortMembers} getSortDirection={getSortDirectionMembers} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Statut" />
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    {paginatedMembers.map((m: BaptizedMember) => (
                                        <tr key={m.id}>
                                            <td className="px-4 py-2 dark:text-gray-300">{m.fullName}</td>
                                            <td className="px-4 py-2 dark:text-gray-300 capitalize">{m.gender === 'male' ? 'Homme' : m.gender === 'female' ? 'Femme' : 'N/A'}</td>
                                            <td className="px-4 py-2 dark:text-gray-300">{m.dateOfBaptism}</td>
                                            <td className="px-4 py-2">
                                                {getGenericStatusBadge(m.status)}
                                            </td>
                                            <td className="px-4 py-2 space-x-1">
                                                <Button size="sm" variant="secondary" onClick={() => setModal({type: 'member', data: m})}><PencilIcon className="h-4 w-4"/></Button>
                                                <Button size="sm" variant="danger" onClick={() => setConfirmModal({type: 'member', data: m})}><TrashIcon className="h-4 w-4"/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination {...membersPagination} />
                    </Card>
                );
            case 'activities':
                return (
                     <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium dark:text-gray-200">Activités de l'Église</h3>
                             <div className="space-x-2">
                                <Button onClick={() => handleExport('activities')} variant="secondary" size="sm"><ArrowDownTrayIcon className="h-4 w-4 mr-1" />Exporter (CSV)</Button>
                                <Button onClick={() => setModal({ type: 'activity', data: null })} size="sm"><PlusIcon className="h-4 w-4 mr-1" />Ajouter</Button>
                            </div>
                        </div>
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<ChurchActivity> sortKey="date" requestSort={requestSortActivities} getSortDirection={getSortDirectionActivities} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Date" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<ChurchActivity> sortKey="title" requestSort={requestSortActivities} getSortDirection={getSortDirectionActivities} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Titre" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<ChurchActivity> sortKey="type" requestSort={requestSortActivities} getSortDirection={getSortDirectionActivities} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Type" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<ChurchActivity> sortKey="status" requestSort={requestSortActivities} getSortDirection={getSortDirectionActivities} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase" children="Statut" />
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    {paginatedActivities.map((a: ChurchActivity) => (
                                        <tr key={a.id}>
                                            <td className="px-4 py-2 dark:text-gray-300">{a.date}</td>
                                            <td className="px-4 py-2 dark:text-gray-300">{a.title}</td>
                                            <td className="px-4 py-2 dark:text-gray-300">{a.type}</td>
                                            <td className="px-4 py-2">
                                                {getGenericStatusBadge(a.status)}
                                            </td>
                                            <td className="px-4 py-2 space-x-1">
                                                <Button size="sm" variant="secondary" onClick={() => setModal({type: 'activity', data: a})}><PencilIcon className="h-4 w-4"/></Button>
                                                <Button size="sm" variant="danger" onClick={() => setConfirmModal({type: 'activity', data: a})}><TrashIcon className="h-4 w-4"/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination {...activitiesPagination} />
                    </Card>
                );
            case 'communications':
                return (
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium dark:text-gray-200">Communications</h3>
                            {canManageAnnouncements && (
                                <Button onClick={() => setModal({ type: 'announcement', data: null })} size="sm">
                                    <PlusIcon className="h-4 w-4 mr-1" />
                                    Ajouter une annonce
                                </Button>
                            )}
                        </div>
                        {churchData.announcements.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Aucune annonce pour le moment.</p>
                        ) : (
                            <div className="space-y-4">
                                {[...churchData.announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(announcement => (
                                    <div key={announcement.id} className="p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{announcement.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Par {announcement.authorName} le {new Date(announcement.createdAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                            {canManageAnnouncements && (
                                                <div className="flex items-center space-x-2 flex-shrink-0">
                                                    {getGenericStatusBadge(announcement.status)}
                                                    <Button size="sm" variant="secondary" onClick={() => setModal({ type: 'announcement', data: announcement })}>
                                                        <PencilIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="danger" onClick={() => setConfirmModal({ type: 'announcement', data: announcement })}>
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{announcement.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                );
            case 'bureau':
                return (
                    <Card>
                        <BureauManagement entityType="church" entityId={churchId as string} entityName={churchData.name} />
                    </Card>
                );
            case 'overview':
            default:
                 return (
                    <>
                        <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard icon={<UsersIcon className="w-6 h-6" />} title="Membres Baptisés" value={stats.memberCount.toLocaleString()} color="green" onClick={() => canManageMembers && setActiveTab('members')} />
                            {canViewFinances && <StatCard icon={<BanknotesIcon className="w-6 h-6" />} title="Offrandes (Validées)" value={`${stats.totalOffering.toLocaleString()} FCFA`} color="yellow" />}
                            {canViewFinances && <StatCard icon={<CalendarDaysIcon className="w-6 h-6" />} title="Présence Moy." value={stats.avgAttendance.toLocaleString()} color="blue" />}
                            <StatCard icon={<ClockIcon className="w-6 h-6" />} title="Rapports en attente" value={stats.pendingReports} color="red" onClick={() => canManageReports && setActiveTab('reports')} />
                        </div>
                        {canViewFinances && (
                            <Card className="h-96">
                                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Offrandes des 12 derniers mois</h3>
                                <LineChart options={commonChartOptions} data={{
                                     labels: getPast12MonthsLabels(),
                                     datasets: [{
                                        label: 'Offrandes Validées (FCFA)',
                                        data: stats.monthlyOfferingData,
                                        borderColor: chartColors.blue,
                                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                        fill: true,
                                        tension: 0.3
                                    }]
                                }}/>
                            </Card>
                        )}
                    </>
                );
        }
    };


    return (
        <div>
            <PageHeader title={churchData.name} subtitle={`Bienvenue sur le tableau de bord de votre église.`}>
                 <Button onClick={handleExportPDF} variant="secondary">
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Rapport Mensuel (PDF)
                </Button>
            </PageHeader>
            {offlineQueueCount > 0 && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-r-lg flex justify-between items-center dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-600">
                    <p>Vous avez {offlineQueueCount} action(s) en attente de synchronisation.</p>
                    <Button onClick={() => syncOfflineQueueForChurch(churchId as string)} disabled={!isOnline || isProcessing} loading={isProcessing}>
                        <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                        Synchroniser
                    </Button>
                </div>
            )}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {renderContent()}

            <Modal isOpen={!!modal} onClose={() => setModal(null)} title={`${modal?.data ? 'Modifier' : 'Ajouter'} ${
                modal?.type === 'report' ? 'Rapport' : 
                modal?.type === 'member' ? 'Membre' : 
                modal?.type === 'activity' ? 'Activité' : 
                modal?.type === 'announcement' ? 'Annonce' :
                modal?.type === 'rapid-entry' ? 'Saisie Rapide de Rapports' : ''
            }`}>
                {modal?.type === 'report' && <WorshipServiceForm churchId={churchId as string} initialData={modal.data} onDone={() => setModal(null)} />}
                {modal?.type === 'member' && <BaptizedMemberForm churchId={churchId as string} initialData={modal.data} onDone={() => setModal(null)} />}
                {modal?.type === 'activity' && <ChurchActivityForm churchId={churchId as string} initialData={modal.data} onDone={() => setModal(null)} />}
                {modal?.type === 'announcement' && <AnnouncementForm churchId={churchId as string} initialData={modal.data} onDone={() => setModal(null)} />}
                {modal?.type === 'rapid-entry' && <RapidWorshipServiceEntry churchId={churchId as string} onDone={() => setModal(null)} />}
            </Modal>
            
            <ConfirmationModal 
                isOpen={!!confirmModal}
                onClose={() => setConfirmModal(null)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
                message="Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
                isProcessing={isProcessing}
            />
        </div>
    );
};

export default ChurchDashboard;