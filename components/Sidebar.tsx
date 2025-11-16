
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { HomeIcon, CalendarIcon, CogIcon, XMarkIcon, UserGroupIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import { PERMISSIONS } from '../permissions';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
    const { user } = useAuth();

    const navigation = [
        { name: 'Accueil', href: '/', icon: HomeIcon },
        { name: 'Mon Tableau de Bord', href: '/dashboard', icon: Squares2X2Icon },
        { name: 'Calendrier', href: '/calendar', icon: CalendarIcon },
    ];
    
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
        }`;

    const sidebarContent = (
        <>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
                    App Eglise
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-500 dark:text-gray-400 lg:hidden">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        end={item.href === '/'}
                        className={navLinkClasses}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                    </NavLink>
                ))}
                 {user?.permissions.includes(PERMISSIONS.MANAGE_USERS) && (
                    <NavLink
                        to="/users"
                        className={navLinkClasses}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <UserGroupIcon className="w-5 h-5 mr-3" />
                        Gestion Utilisateurs
                    </NavLink>
                )}
            </nav>

            <div className="px-4 py-4 border-t dark:border-gray-700">
                <NavLink
                    to="/profile"
                    className={navLinkClasses}
                    onClick={() => setSidebarOpen(false)}
                >
                    <CogIcon className="w-5 h-5 mr-3" />
                    Mon Profil
                </NavLink>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile sidebar overlay */}
            <div 
                className={`fixed inset-0 z-30 bg-gray-900 bg-opacity-50 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
            ></div>
            
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white border-r transform lg:static lg:inset-auto lg:translate-x-0 transition-transform duration-300 ease-in-out dark:bg-gray-800 dark:border-gray-700 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </div>
        </>
    );
};

export default Sidebar;
