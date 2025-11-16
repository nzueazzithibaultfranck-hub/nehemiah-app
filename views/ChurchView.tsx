import React from 'react';
import ChurchDashboard from '../components/ChurchDashboard';

interface ChurchViewProps {
    churchIdOverride?: string;
}

const ChurchView: React.FC<ChurchViewProps> = ({ churchIdOverride }) => {
    return <ChurchDashboard churchIdOverride={churchIdOverride} />;
};

export default ChurchView;