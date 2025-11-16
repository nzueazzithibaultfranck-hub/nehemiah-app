// components/Dashboard.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import NationalView from '../views/NationalView';
import RegionView from '../views/RegionView';
import ChurchView from '../views/ChurchView';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { viewOverride } = useUI();

    if (viewOverride) {
        switch (viewOverride.level) {
            case 'region':
                return <RegionView regionIdOverride={viewOverride.entityId} />;
            case 'church':
                return <ChurchView churchIdOverride={viewOverride.entityId} />;
            default:
                 // Fallback to user's dashboard if override is invalid
                break;
        }
    }

    if (!user) {
        return <div>Utilisateur non trouvé.</div>;
    }

    switch (user.level) {
        case 'national':
            return <NationalView />;
        case 'region':
            return <RegionView />;
        case 'church':
            return <ChurchView />;
        default:
            return <div>Niveau d'utilisateur inconnu.</div>;
    }
};

export default Dashboard;