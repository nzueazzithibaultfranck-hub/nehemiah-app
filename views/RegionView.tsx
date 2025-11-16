import React from 'react';
import RegionDashboard from '../components/RegionDashboard';

interface RegionViewProps {
    regionIdOverride?: string;
}

const RegionView: React.FC<RegionViewProps> = ({ regionIdOverride }) => {
    return <RegionDashboard regionIdOverride={regionIdOverride} />;
};

export default RegionView;