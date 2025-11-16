import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';

import ChurchDashboard from '../components/ChurchDashboard';
import { useAuth } from '../hooks/useAuth';
import { useChurchData } from '../hooks/appContext';
import { UIProvider } from '../hooks/useUI';
import { ToastProvider } from '../hooks/useToast';
import { User, Church } from '../types';
import { PERMISSIONS } from '../permissions';

// Mock child components to isolate the test
jest.mock('../components/WorshipServiceForm', () => ({ onDone }: { onDone: () => void }) => <div data-testid="worship-service-form-mock">Worship Service Form</div>);
jest.mock('../components/BaptizedMemberForm', () => ({ onDone }: { onDone: () => void }) => <div data-testid="baptized-member-form-mock">Baptized Member Form</div>);
jest.mock('../components/ChurchActivityForm', () => ({ onDone }: { onDone: () => void }) => <div data-testid="church-activity-form-mock">Church Activity Form</div>);
jest.mock('../components/BureauMemberForm', () => ({ onDone }: { onDone: () => void }) => <div data-testid="bureau-member-form-mock">Bureau Member Form</div>);
jest.mock('../components/skeletons/ChurchDashboardSkeleton', () => () => <div data-testid="skeleton-mock">Loading...</div>);

// Mock hooks
jest.mock('../hooks/useAuth');
jest.mock('../hooks/appContext', () => ({
    useChurchData: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseChurchData = useChurchData as jest.Mock;

const mockUser: User = {
    id: 'user_church_1',
    username: 'church_admin_1',
    roleId: 'church_admin',
    level: 'church',
    churchId: 'church1',
    permissions: [
        PERMISSIONS.MANAGE_REPORTS,
        PERMISSIONS.MANAGE_MEMBERS,
        PERMISSIONS.MANAGE_ACTIVITIES,
        PERMISSIONS.MANAGE_BUREAU,
        PERMISSIONS.VIEW_FINANCES,
    ],
    forcePasswordChange: false,
};

const mockChurchData: Church = {
    id: 'church1',
    name: 'Grace Church',
    regionId: 'reg1',
    worshipServices: [
        { id: 'ws1', date: '2023-10-01', speaker: 'Pastor John', president: 'Elder Smith', attendance: { men: 10, women: 15, children: 5 }, offering: { tithes: 100, regular: 50, special: 20 }, status: 'validated' },
        { id: 'ws2', date: '2023-10-08', speaker: 'Guest Speaker', president: 'Deacon Joe', attendance: { men: 12, women: 18, children: 7 }, offering: { tithes: 120, regular: 60, special: 25 }, status: 'pending' }
    ],
    baptizedMembers: [
        // Fix: Added missing 'gender' property to satisfy the BaptizedMember type.
        { id: 'bm1', fullName: 'Alice', gender: 'female', phone: '123', email: 'a@b.c' },
    ],
    activities: [],
    bureau: [],
    // Fix: Added missing 'announcements' property to satisfy the Church type.
    announcements: [],
};

const mockNationalData = {
    churches: { 'church1': mockChurchData }
};

const renderComponent = (user: User | null, data: any, isLoading: boolean) => {
    mockUseAuth.mockReturnValue({ user });
    mockUseChurchData.mockReturnValue({ 
        data, 
        isLoading, 
        isProcessing: false, 
        deleteWorshipService: jest.fn().mockResolvedValue(undefined),
        getOfflineQueue: jest.fn().mockReturnValue([]),
        clearOfflineQueueForChurch: jest.fn(),
        syncOfflineQueueForChurch: jest.fn(),
    });

    return render(
        <MemoryRouter>
            <ToastProvider>
                <UIProvider>
                    <ChurchDashboard />
                </UIProvider>
            </ToastProvider>
        </MemoryRouter>
    );
};


describe('ChurchDashboard Component', () => {

    beforeEach(() => {
        // Reset mocks before each test
        mockUseAuth.mockClear();
        mockUseChurchData.mockClear();
    });

    test('shows skeleton when loading', () => {
        renderComponent(mockUser, null, true);
        expect(screen.getByTestId('skeleton-mock')).toBeInTheDocument();
    });

    test('renders dashboard with overview stats when data is loaded', () => {
        renderComponent(mockUser, mockNationalData, false);
        
        expect(screen.getByText('Grace Church')).toBeInTheDocument();
        // Check for stat cards
        expect(screen.getByText('Membres Baptisés')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // 1 baptized member
        
        expect(screen.getByText('Offrandes (Validées)')).toBeInTheDocument();
        expect(screen.getByText('170 FCFA')).toBeInTheDocument(); // 100+50+20

        expect(screen.getByText('Présence Moy.')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument(); // 10+15+5

        expect(screen.getByText('Rapports en attente')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // 1 pending report
    });

    test('navigates between tabs and shows correct content', async () => {
        renderComponent(mockUser, mockNationalData, false);

        // Starts on overview
        expect(screen.getByText('Membres Baptisés')).toBeInTheDocument();

        // Click reports tab
        const reportsTabButton = screen.getByRole('button', { name: /rapports de culte/i });
        fireEvent.click(reportsTabButton);
        
        // Wait for content of reports tab to appear
        await waitFor(() => {
            expect(screen.getByRole('heading', {name: 'Rapports de Culte'})).toBeInTheDocument();
            expect(screen.getByText('Pastor John')).toBeInTheDocument(); // From a worship service
        });
        
        // Click members tab
        const membersTabButton = screen.getByRole('button', { name: /membres baptisés/i });
        fireEvent.click(membersTabButton);

        await waitFor(() => {
            expect(screen.getByRole('heading', {name: 'Membres Baptisés'})).toBeInTheDocument();
            expect(screen.getByText('Alice')).toBeInTheDocument(); // Baptized member name
        });
    });

    test('hides tabs if user lacks permissions', () => {
        const userWithoutPermissions: User = { ...mockUser, permissions: [] };
        renderComponent(userWithoutPermissions, mockNationalData, false);

        expect(screen.getByRole('button', { name: "Vue d'ensemble" })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /rapports de culte/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /membres baptisés/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /activités/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /bureau/i })).not.toBeInTheDocument();
    });

    test('opens "Add Report" modal from Reports tab', async () => {
        renderComponent(mockUser, mockNationalData, false);

        fireEvent.click(screen.getByRole('button', { name: /rapports de culte/i }));
        
        await waitFor(() => {
            const addButton = screen.getByRole('button', { name: /ajouter/i });
            fireEvent.click(addButton);
        });

        await waitFor(() => {
            // Check modal title and mock form
            expect(screen.getByText('Ajouter Rapport')).toBeInTheDocument();
            expect(screen.getByTestId('worship-service-form-mock')).toBeInTheDocument();
        });
    });

    test('opens "Edit Report" modal from Reports tab', async () => {
        renderComponent(mockUser, mockNationalData, false);

        fireEvent.click(screen.getByRole('button', { name: /rapports de culte/i }));
        
        let editButton: HTMLElement | null = null;
        await waitFor(() => {
            // Find the pending report row, which should have an enabled edit button
            const pendingReportRow = screen.getByText('Guest Speaker').closest('tr');
            expect(pendingReportRow).not.toBeNull();
            if(!pendingReportRow) return;

            editButton = pendingReportRow.querySelector('button:not([disabled])'); // Find first enabled button, which is edit
            expect(editButton).toBeInTheDocument();
        });
        
        if (editButton) {
            fireEvent.click(editButton);
        }

        await waitFor(() => {
            expect(screen.getByText('Modifier Rapport')).toBeInTheDocument();
            expect(screen.getByTestId('worship-service-form-mock')).toBeInTheDocument();
        });
    });
});