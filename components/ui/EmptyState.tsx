import React from 'react';
import Button from './Button';
import { PlusIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
    actionText?: string;
    onActionClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionText, onActionClick }) => {
    return (
        <div className="text-center py-12 px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                {icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
            {actionText && onActionClick && (
                <div className="mt-6">
                    <Button onClick={onActionClick}>
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        {actionText}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
