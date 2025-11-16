import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Bars3Icon, ArrowRightOnRectangleIcon, UserCircleIcon, BellIcon, CloudIcon, SignalSlashIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useSystem } from '../hooks/appContext';
import { useUI } from '../hooks/useUI';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Notification } from '../types';
import GlobalSearch from './GlobalSearch';

interface HeaderProps {
    setSidebarOpen: (open: boolean) => void;
}

const OnlineStatusIndicator: React.FC = () => {
    const isOnline = useOnlineStatus();
    const Icon = isOnline ? CloudIcon : SignalSlashIcon;
    const title = isOnline ? 'En ligne' : 'Hors ligne - Les modifications seront synchronisées plus tard';

    return (
        <div className="flex items-center text-gray-500 dark:text-gray-400" title={title}>
            <Icon className="h-6 w-6" />
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
    const { user, logout } = useAuth();
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useSystem();
    const { theme, setTheme } = useUI();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const { setActiveTab } = useUI();

    const unreadCount = notifications.filter(n => !n.read).length;
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNotificationClick = (notification: Notification) => {
        markNotificationAsRead(notification.id);
        setIsNotifOpen(false);
        // This is a simplified navigation. A more robust solution would parse the link.
        setActiveTab('validation'); 
        navigate('/');
    };
    
    const handleMarkAllRead = () => {
        markAllNotificationsAsRead();
    };

    return (
        <header className="relative z-20 flex items-center justify-between px-6 py-3 bg-white border-b dark:bg-gray-800 dark:border-gray-700">
            {/* Left Section */}
            <div className="flex items-center">
                <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden">
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            {/* Center Section - Global Search */}
            <div className="flex-1 flex justify-center px-4">
                <GlobalSearch />
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
                 <OnlineStatusIndicator />
                 {/* Notifications */}
                <div className="relative">
                    <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 hover:text-gray-700">
                        <BellIcon className="h-6 w-6"/>
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{unreadCount}</span>
                        )}
                    </button>
                    {isNotifOpen && (
                         <div 
                            className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-30 dark:bg-gray-700"
                            onMouseLeave={() => setIsNotifOpen(false)}
                        >
                            <div className="p-4 font-bold border-b dark:border-gray-600 dark:text-white">Notifications</div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(notif => (
                                    <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-3 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer ${!notif.read ? 'bg-blue-50 dark:bg-gray-800' : ''}`}>
                                        <div className="ml-2 flex-1">
                                            <p className="text-sm dark:text-gray-200">{notif.message}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(notif.timestamp).toLocaleString('fr-FR')}</p>
                                        </div>
                                    </div>
                                )) : <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Aucune notification.</p>}
                            </div>
                            {unreadCount > 0 && (
                                <div className="p-2 border-t dark:border-gray-600">
                                    <button onClick={handleMarkAllRead} className="w-full text-center text-sm text-blue-600 hover:underline dark:text-blue-400">
                                        Tout marquer comme lu
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)} 
                        className="flex items-center space-x-2 text-sm text-gray-700 bg-gray-100 rounded-full p-1 pr-3 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                       <UserCircleIcon className="w-6 h-6 text-gray-500 dark:text-gray-400"/>
                       <div className="text-left hidden md:block">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{user?.username}</p>
                       </div>
                       <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                    </button>
                     {isMenuOpen && (
                        <div 
                            className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-20 dark:bg-gray-700"
                            onMouseLeave={() => setIsMenuOpen(false)}
                        >
                            <div className="px-4 py-2 border-b dark:border-gray-600">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user?.username}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.level}</p>
                            </div>
                            <Link 
                                to="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                Mon Profil
                            </Link>
                             <div className="border-t my-1 dark:border-gray-600"></div>
                             <div className="px-4 pt-2 pb-1 text-xs text-gray-500 dark:text-gray-400">Thème</div>
                                <div className="flex justify-around p-2">
                                    <button onClick={() => setTheme('light')} className={`p-2 rounded-md ${theme === 'light' ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}><SunIcon className="w-5 h-5 text-gray-700 dark:text-gray-300"/></button>
                                    <button onClick={() => setTheme('dark')} className={`p-2 rounded-md ${theme === 'dark' ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}><MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-300"/></button>
                                    <button onClick={() => setTheme('system')} className={`p-2 rounded-md ${theme === 'system' ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-600'}`}><ComputerDesktopIcon className="w-5 h-5 text-gray-700 dark:text-gray-300"/></button>
                                </div>
                            <div className="border-t my-1 dark:border-gray-600"></div>
                            <button 
                                onClick={handleLogout} 
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                               <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                               Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;