import React from 'react';
// Fix: Import `fireEvent` from testing-library to allow user interaction simulation.
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { MemoryRouter } from 'react-router-dom';

import RegionDashboard from '../components/RegionDashboard';
import { useAuth } from '../hooks/useAuth';
import { useChurchData } from '../hooks/appContext';
import { UIProvider } from '../hooks/useUI';
import { ToastProvider } from '../hooks/useToast';
import { User, Region, Church } from '../types';
import { PERMISSIONS } from '../permissions';

// Mock child components
jest.mock('../components/skeletons/RegionDashboardSkeleton', () => () => <div data-testid="skeleton-mock">Loading...</div>);

// Mock hooks
jest.mock('../hooks/useAuth');
jest.mock('../hooks/appContext', () => ({
    useChurchData: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseChurchData = useChurchData as jest.Mock;

const mockUser: User = {
    id: 'user_region_1',
    username: 'region_admin_1',
    roleId: 'region_admin',
    level: 'region',
    regionId: 'region1',
    permissions: [PERMISSIONS.MANAGE_BUREAU, PERMISSIONS.VIEW_FINANCES], 
    forcePasswordChange: false,
};

const mockChurches: { [id: string]: Church } = {
    'church1': {
        id: 'church1', name: 'First Church', regionId: 'region1',
        worshipServices: [
             { id: 'ws1', date: '2023-10-01', speaker: 'P1', president: 'Pr1', attendance: { men: 10, women: 10, children: 10 }, offering: { tithes: 100, regular: 50, special: 0 }, status: 'validated' },
             { id: 'ws2', date: '2023-10-08', speaker: 'P2', president: 'Pr2', attendance: { men: 1, women: 1, children: 1 }, offering: { tithes: 1, regular: 1, special: 1 }, status: 'pending' }
        ],
        baptizedMembers: Array(10).fill(null), activities: [], bureau: [], announcements: [],
    },
    'church2': {
        id: 'church2', name: 'Second Church', regionId: 'region1',
        worshipServices: [
             { id: 'ws3', date: '2023-10-01', speaker: 'P3', president: 'Pr3', attendance: { men: 20, women: 20, children: 20 }, offering: { tithes: 200, regular: 100, special: 0 }, status: 'validated' },
        ],
        baptizedMembers: Array(20).fill(null), activities: [], bureau: [], announcements: [],
    }
};

const mockRegion: Region = {
    id: 'region1',
    name: 'Coastal Region',
    churches: ['church1', 'church2'],
    bureau: [],
    activities: [],
};

const mockNationalData = {
    regions: { 'region1': mockRegion },
    churches: mockChurches,
};

const renderComponent = (user: User | null, data: any, isLoading: boolean) => {
    mockUseAuth.mockReturnValue({ user });
    mockUseChurchData.mockReturnValue({ data, isLoading });

    return render(
        <MemoryRouter>
            <ToastProvider>
                <UIProvider>
                    <RegionDashboard />
                </UIProvider>
            </ToastProvider>
        </MemoryRouter>
    );
};

describe('RegionDashboard Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('shows skeleton when loading', () => {
        renderComponent(mockUser, null, true);
        expect(screen.getByTestId('skeleton-mock')).toBeInTheDocument();
    });

    test('shows error message if user has no regionId', () => {
        const userWithoutRegion = { ...mockUser, regionId: undefined };
        renderComponent(userWithoutRegion, mockNationalData, false);
        // The component will render a message in this case, as `regionData` will be null.
        expect(screen.getByText('Données de la région non trouvées.')).toBeInTheDocument();
    });

    test('renders dashboard with aggregated stats when data is loaded', () => {
        renderComponent(mockUser, mockNationalData, false);
        
        expect(screen.getByText('Région: Coastal Region')).toBeInTheDocument();
        
        // Check stat cards
        expect(screen.getByText('Églises')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        
        expect(screen.getByText('Membres')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument(); // 10 + 20

        expect(screen.getByText('Offrandes (Total)')).toBeInTheDocument();
        expect(screen.getByText('450 FCFA')).toBeInTheDocument(); // 150 + 300

        expect(screen.getByText('Rapports en Attente')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // from church1
    });

    test('renders table with churches in the region', () => {
        renderComponent(mockUser, mockNationalData, false);

        // Click on the 'Églises' tab to make the table visible
        const churchesTab = screen.getByRole('button', { name: 'Églises' });
        fireEvent.click(churchesTab);

        // Check for table headers
        expect(screen.getByText('Églises de la Région')).toBeInTheDocument();
        
        // Check for church names in the table
        expect(screen.getByText('First Church')).toBeInTheDocument();
        expect(screen.getByText('Second Church')).toBeInTheDocument();

        // Check for specific stats in rows
        const firstChurchRow = screen.getByText('First Church').closest('tr');
        expect(firstChurchRow).toHaveTextContent('10'); // members
        expect(firstChurchRow).toHaveTextContent('1'); // pending reports
    });

});