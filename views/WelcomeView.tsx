
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useChurchData, useSystem } from '../hooks/appContext';
import { useUI } from '../hooks/useUI';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    UserPlusIcon,
    UsersIcon,
    BuildingLibraryIcon,
    ClockIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { PERMISSIONS } from '../permissions';

interface Action {
    text: string;
    to: string;
    tab?: string;
}

const WelcomeView: React.FC = () => {
    const { user } = useAuth();
    const { data, isLoading: dataLoading } = useChurchData();
    const { auditLogs, isLoading: systemLoading } = useSystem();
    const { setActiveTab } = useUI();
    const navigate = useNavigate();

    const isLoading = dataLoading || systemLoading;

    const statsAndActions = useMemo(() => {
        if (!user || !data) {
            return { kpis: [], actions: [], relevantLogs: [] };
        }

        let kpis: any[] = [];
        let actions: Action[] = [];
        const relevantLogs = auditLogs.slice(0, 5); 

        switch (user.level) {
            case 'national': {
                const allServices = Object.values(data.churches).flatMap(c => c.worshipServices);
                kpis.push({
                    icon: <BuildingLibraryIcon className="w-6 h-6" />,
                    title: "Régions Gérées",
                    value: Object.keys(data.regions).length,
                    color: 'purple' as const,
                });
                kpis.push({
                    icon: <ClockIcon className="w-6 h-6" />,
                    title: "Validations en Attente",
                    value: allServices.filter(s => s.status === 'pending').length,
                    color: 'red' as const,
                });
                if (user.permissions.includes(PERMISSIONS.MANAGE_USERS)) {
                    actions.push({ text: "Gérer les utilisateurs", to: "/users" });
                }
                actions.push({ text: "Traiter les validations", to: "/dashboard", tab: "validation" });
                break;
            }
            case 'region': {
                const region = data.regions[user.regionId!];
                if (region) {
                    const regionChurchServices = region.churches.flatMap(cId => data.churches[cId]?.worshipServices || []);
                    kpis.push({
                        icon: <BuildingOffice2Icon className="w-6 h-6" />,
                        title: "Églises Supervisées",
                        value: region.churches.length,
                        color: 'blue' as const,
                    });
                    kpis.push({
                        icon: <ClockIcon className="w-6 h-6" />,
                        title: "Validations en Attente",
                        value: regionChurchServices.filter(s => s.status === 'pending').length,
                        color: 'red' as const,
                    });
                }
                 if (user.permissions.includes(PERMISSIONS.MANAGE_USERS)) {
                    actions.push({ text: "Gérer les utilisateurs", to: "/users" });
                }
                actions.push({ text: "Traiter les validations", to: "/dashboard", tab: "validation" });
                break;
            }
            case 'church': {
                const church = data.churches[user.churchId!];
                if (church) {
                    const now = new Date();
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

                    kpis.push({
                        icon: <ClockIcon className="w-6 h-6" />,
                        title: "Rapports en Attente",
                        value: church.worshipServices.filter(s => s.status === 'pending').length,
                        color: 'red' as const,
                    });
                    kpis.push({
                        icon: <UserPlusIcon className="w-6 h-6" />,
                        title: "Nouveaux Membres (ce mois)",
                        value: church.baptizedMembers.filter(m => m.dateOfBaptism && m.dateOfBaptism >= firstDayOfMonth).length,
                        color: 'green' as const,
                    });
                }
                if (user.permissions.includes(PERMISSIONS.MANAGE_REPORTS)) {
                    actions.push({ text: "Ajouter un rapport", to: "/dashboard", tab: "reports" });
                }
                if (user.permissions.includes(PERMISSIONS.MANAGE_MEMBERS)) {
                    actions.push({ text: "Ajouter un membre", to: "/dashboard", tab: "members" });
                }
                break;
            }
        }

        return { kpis, actions, relevantLogs };

    }, [user, data, auditLogs]);
    
    const handleActionClick = (action: Action) => {
        if (action.tab) {
            setActiveTab(action.tab);
        }
        navigate(action.to);
    };

    if (isLoading || !user) {
        return <div className="p-8">Chargement du tableau de bord personnel...</div>;
    }

    return (
        <div>
            <PageHeader title={`Bonjour, ${user.username} !`} subtitle="Voici un résumé de votre activité et de vos tâches." />

            <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
                {statsAndActions.kpis.map((kpi, index) => (
                    <StatCard key={index} {...kpi} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Accès Rapides</h3>
                    <div className="space-y-3">
                        {statsAndActions.actions.map((action, index) => (
                             <Button 
                                key={index} 
                                variant="secondary" 
                                className="w-full"
                                onClick={() => handleActionClick(action)}
                            >
                                {action.text}
                            </Button>
                        ))}
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Activité Récente</h3>
                    {statsAndActions.relevantLogs.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {statsAndActions.relevantLogs.map(log => (
                                <li key={log.id} className="py-3">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{log.details}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Par {log.actorUsername} - {new Date(log.timestamp).toLocaleString('fr-FR')}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Aucune activité récente à afficher.</p>
                    )}
                </Card>
            </div>
        </div>
    );
};
export default WelcomeView;
