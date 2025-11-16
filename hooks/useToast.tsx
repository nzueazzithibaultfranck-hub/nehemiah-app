import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: ToastMessage | null;
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toast, setToast] = useState<ToastMessage | null>(null);
    // Fix: Use useRef to store timeout ID to prevent issues with closures in callbacks.
    const timeoutIdRef = useRef<number | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }
        const id = Date.now();
        setToast({ id, message, type });
        timeoutIdRef.current = window.setTimeout(() => {
            setToast(currentToast => currentToast?.id === id ? null : currentToast);
        }, 3000);
    }, []);

    // Fix: Add useEffect to clean up timeout on component unmount.
    useEffect(() => {
        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, []);

    return (
        <ToastContext.Provider value={{ toast, showToast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
