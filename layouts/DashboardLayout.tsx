import React, { useState } from 'react';
// Fix: Correct import path
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { useUI } from '../hooks/useUI';
import Button from '../components/ui/Button';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';


const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { viewOverride, setViewOverride } = useUI();

    return (
        
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header setSidebarOpen={setSidebarOpen} />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
                        <div className="container mx-auto px-6 py-8">
                            {viewOverride && (
                                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 rounded-r-lg dark:bg-gray-800 dark:border-blue-700 dark:text-blue-300" role="alert">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">Vue Détaillée</p>
                                            <p className="text-sm">Vous consultez actuellement un tableau de bord spécifique. Cliquez sur le bouton pour revenir à votre vue principale.</p>
                                        </div>
                                        <Button onClick={() => setViewOverride(null)} variant="secondary" size="sm">
                                            <ArrowUturnLeftIcon className="h-4 w-4 mr-2" />
                                            Retour à mon tableau de bord
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        
    );
};

export default DashboardLayout;