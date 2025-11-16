// hooks/useUI.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UIContextType {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    viewOverride: { level: 'region' | 'church', entityId: string } | null;
    setViewOverride: (override: { level: 'region' | 'church', entityId: string } | null) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [viewOverride, setViewOverride] = useState<{ level: 'region' | 'church', entityId: string } | null>(null);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
          theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', theme);
    }, [theme]);


    return (
        <UIContext.Provider value={{ activeTab, setActiveTab, viewOverride, setViewOverride, theme, setTheme }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};