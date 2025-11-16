import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, onClick }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600',
    };
    
    const bgColorClass = colorClasses[color] || colorClasses.blue;
    const clickableClass = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-300' : '';

    return (
        <div className={`bg-white p-4 rounded-lg shadow flex items-center ${clickableClass}`} onClick={onClick}>
            <div className={`p-3 rounded-full ${bgColorClass}`}>
                {icon}
            </div>
            <div className="ml-4 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
                <p className="text-2xl font-semibold text-gray-900 truncate">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;