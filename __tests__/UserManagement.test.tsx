import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';

import UserManagement from '../components/UserManagement';
import { AuthProvider } from '../hooks/useAuth';
import { useUsers, useChurchData } from '../hooks/appContext';
import { UIProvider } from '../hooks/useUI';
import { ToastProvider } from '../hooks/useToast';
import { User } from '../types';
import { ROLES } from '../permissions';

// Mock child components to isolate the test
jest.mock('../components/UserForm', () => ({ initialData, onDone }: { initialData: User | null, onDone: () => void }) => <div data-testid="user-form-mock">{initialData ? 'Edit' : 'Add'} User Form</div>);

// Mock hooks
jest.mock('../hooks/appContext', () => ({
    useUsers: jest.fn(),
    useChurchData: jest.fn(),
}));


const mockUseUsers = useUsers as jest.Mock;
const mockUseChurchData = useChurchData as jest.Mock;

const mockUsers: User[] = [
    { id: 'user1', username: 'test_national', roleId: 'national_admin', level: 'national', permissions: ROLES['national_admin'].permissions, forcePasswordChange: false },
    { id: 'user2', username: 'test_region', roleId: 'region_admin', level: 'region', regionId: 'reg1', permissions: ROLES['region_admin'].permissions, forcePasswordChange: false },
    { id: 'user3', username: 'test_church', roleId: 'church_admin', level: 'church', churchId: 'church1', regionId: 'reg1', permissions: ROLES['church_admin'].permissions, forcePasswordChange: false },
];

const mockData = {
    regions: { 'reg1': { id: 'reg1', name: 'Test Region', churches: ['church1'], bureau: [], activities: [] } },
    churches: { 'church1': { id: 'church1', name: 'Test Church', regionId: 'reg1', worshipServices: [], baptizedMembers: [], activities: [], bureau: [] } },
    bureau: [],
    activities: [],
};

const mockDeleteUser = jest.fn().mockResolvedValue(undefined);

const renderComponent = () => {
    return render(
        <MemoryRouter>
            <ToastProvider>
                <AuthProvider>
                    <UIProvider>
                        <UserManagement />
                    </UIProvider>
                </AuthProvider>
            </ToastProvider>
        </MemoryRouter>
    );
};

describe('UserManagement Component', () => {

    beforeEach(() => {
        mockUseUsers.mockReturnValue({
            users: mockUsers,
            isLoading: false,
            isProcessing: false,
            deleteUser: mockDeleteUser,
        });
        mockUseChurchData.mockReturnValue({
            data: mockData,
            isLoading: false,
            isProcessing: false,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders the list of users', () => {
        renderComponent();
        
        expect(screen.getByText('Gestion des utilisateurs')).toBeInTheDocument();
        
        // Check for users in the table
        expect(screen.getByText('test_national')).toBeInTheDocument();
        expect(screen.getByText('test_region')).toBeInTheDocument();
        expect(screen.getByText('test_church')).toBeInTheDocument();

        // Check for roles and entities
        expect(screen.getByText('Administrateur National')).toBeInTheDocument();
        expect(screen.getByText('Test Region')).toBeInTheDocument();
        expect(screen.getByText('Test Church')).toBeInTheDocument();
    });

    test('opens the "add user" modal when the add button is clicked', async () => {
        renderComponent();
        
        const addButton = screen.getByRole('button', { name: /ajouter un utilisateur/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText("Ajouter un utilisateur")).toBeInTheDocument(); // Modal title
            expect(screen.getByTestId('user-form-mock')).toHaveTextContent('Add User Form');
        });
    });

    test('opens the "edit user" modal when an edit button is clicked', async () => {
        renderComponent();
        
        const userRow = screen.getByText('test_national').closest('tr');
        expect(userRow).not.toBeNull();
        if(!userRow) return;

        const editButton = userRow.querySelector('button.text-blue-600');
        expect(editButton).toBeInTheDocument();
        if (editButton) {
            fireEvent.click(editButton);
        }

        await waitFor(() => {
            expect(screen.getByText("Modifier l'utilisateur")).toBeInTheDocument(); // Modal title
            expect(screen.getByTestId('user-form-mock')).toHaveTextContent('Edit User Form');
        });
    });

    test('opens confirmation modal on delete click and calls deleteUser on confirm', async () => {
        renderComponent();

        const userRow = screen.getByText('test_church').closest('tr');
        expect(userRow).not.toBeNull();
        if(!userRow) return;
        
        const deleteButton = userRow.querySelector('button.text-red-600');

        expect(deleteButton).toBeInTheDocument();
        if (deleteButton) {
            fireEvent.click(deleteButton);
        }

        // Check if confirmation modal appears
        await waitFor(() => {
            expect(screen.getByText('Confirmer la suppression')).toBeInTheDocument();
            expect(screen.getByText(/êtes-vous sûr de vouloir supprimer l'utilisateur "test_church" ?/i)).toBeInTheDocument();
        });

        // Click confirm button
        const confirmButton = screen.getByRole('button', { name: /confirmer/i });
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
            expect(mockDeleteUser).toHaveBeenCalledWith('user3');
        });
    });
});