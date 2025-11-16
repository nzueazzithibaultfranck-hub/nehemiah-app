

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
// Fix: Corrected import path for DataProvider.
import { AppDataProvider } from './hooks/appContext';
import { ToastProvider } from './hooks/useToast';
import { UIProvider } from './hooks/useUI';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import ProfileView from './views/ProfileView';
import UserManagement from './components/UserManagement';
import CalendarView from './views/CalendarView';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomeView from './views/WelcomeView'; // Import the new welcome view

import { PERMISSIONS } from './permissions';

// This component handles the routing logic based on the auth state.
const AppRoutes: React.FC = () => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p>Chargement de la session...</p>
            </div>
        );
    }
    
    // If the user is authenticated
    if (isAuthenticated && user) {
        // If they are forced to change their password, only allow the profile route.
        if (user.forcePasswordChange) {
            return (
                <DashboardLayout>
                    <Routes>
                        <Route path="/profile" element={<ProfileView />} />
                        <Route path="*" element={<Navigate to="/profile" replace />} />
                    </Routes>
                </DashboardLayout>
            );
        }
        
        // Otherwise, render all the protected routes.
        return (
            <DashboardLayout>
                <Routes>
                    <Route path="/" element={<WelcomeView />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<ProfileView />} />
                    <Route path="/calendar" element={<CalendarView />} />
                    {/* Permission-based route for user management */}
                    {user.permissions.includes(PERMISSIONS.MANAGE_USERS) && (
                        <Route path="/users" element={<UserManagement />} />
                    )}
                    {/* Fallback for any other authenticated route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </DashboardLayout>
        );
    }

    // If the user is not authenticated, only render public routes.
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};


const App: React.FC = () => {
    return (
        // FIX: The ErrorBoundary component requires children to be passed to it.
        <ErrorBoundary>
            <ToastProvider>
                <AuthProvider>
                    <AppDataProvider>
                        <UIProvider>
                            <Router>
                                <AppRoutes />
                            </Router>
                            {/* A Toast is an overlay and not part of the routing content. */}
                            <Toast />
                        </UIProvider>
                    </AppDataProvider>
                </AuthProvider>
            </ToastProvider>
        </ErrorBoundary>
    );
};

export default App;
