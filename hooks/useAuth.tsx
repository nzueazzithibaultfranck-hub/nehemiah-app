import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { api } from '../api';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isProcessing: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    changePassword: (userId: string, oldPass: string, newPass: string) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const checkSession = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUser = await api.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Failed to check session', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = async (username: string, password: string) => {
        setIsProcessing(true);
        try {
            const loggedInUser = await api.login(username, password);
            setUser(loggedInUser);
            setIsAuthenticated(true);
        } catch (error) {
            setIsProcessing(false);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const logout = async () => {
        await api.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const changePassword = async (userId: string, oldPass: string, newPass: string) => {
        setIsProcessing(true);
        try {
            await api.changePassword(userId, oldPass, newPass);
            // After password change, forcePasswordChange flag might be updated.
            await refreshUser();
        } finally {
            setIsProcessing(false);
        }
    };
    
    const refreshUser = async () => {
        try {
             const currentUser = await api.getCurrentUser();
             setUser(currentUser);
        } catch (error) {
            console.error("Could not refresh user", error);
        }
    }


    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, isProcessing, login, logout, changePassword, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
