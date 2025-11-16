// __tests__/E2E_ValidationFlow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

import App from '../App';
import { api } from '../api';
import { User, NationalData } from '../types';
import { ROLES } from '../permissions';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

// --- Mock Data ---
const mockRegionalAdmin: User = {
    id: 'user_region_validator',
    username: 'region_validator_admin',
    roleId: 'region_admin',
    level: 'region',
    regionId: 'reg_valid',
    permissions: ROLES['region_admin'].permissions,
    forcePasswordChange: false,
};

const mockInitialData: NationalData = {
    bureau: [],
    activities: [],
    regions: {
        'reg_valid': { id: 'reg_valid', name: 'Région de Validation', churches: ['church_valid'], bureau: [], activities: [] }
    },
    churches: {
        'church_valid': {
            id: 'church_valid',
            name: 'Église à Valider',
            regionId: 'reg_valid',
            worshipServices: [
                { 
                    id: 'ws_pending_1',
                    date: '2024-01-20',
                    speaker: 'Val Speaker',
                    president: 'Val President',
                    attendance: { men: 5, women: 5, children: 5 },
                    offering: { tithes: 100, regular: 100, special: 100 },
                    status: 'pending' 
                }
            ],
            baptizedMembers: [],
            activities: [],
            bureau: [],
            // Fix: Added missing 'announcements' property to satisfy the Church type.
            announcements: [],
        }
    }
};

describe('E2E User Flow: Regional Admin Validates Report', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        // --- Mock API implementation ---
        let currentUser: User | null = null;
        mockApi.login.mockImplementation(async (username, password) => {
            if (username === 'region_validator_admin' && password === 'password123') {
                currentUser = mockRegionalAdmin;
                return mockRegionalAdmin;
            }
            throw new Error('Invalid credentials');
        });
        
        mockApi.getCurrentUser.mockImplementation(async () => currentUser);

        mockApi.getFullData.mockResolvedValue({
            data: JSON.parse(JSON.stringify(mockInitialData)),
            users: [mockRegionalAdmin],
            notifications: [],
            auditLogs: [],
        });
        
        mockApi.validateWorshipService.mockResolvedValue(undefined);
    });

    test('A regional admin can log in, navigate to validation, and validate a report', async () => {
        // 1. Render App
        render(<App />);

        // 2. Login
        expect(screen.getByRole('heading', { name: /connectez-vous/i })).toBeInTheDocument();
        fireEvent.change(screen.getByPlaceholderText(/nom d'utilisateur/i), { target: { value: 'region_validator_admin' } });
        fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
        
        // 3. Navigate to and verify Regional Dashboard
        await waitFor(() => {
            expect(screen.getByText('Région: Région de Validation')).toBeInTheDocument();
        });

        // The dashboard should show 1 pending report in the stat card and tab
        const pendingReportsStat = await screen.findByText('Rapports en Attente');
        const statCard = pendingReportsStat.closest('div.flex');
        expect(statCard).toHaveTextContent('1');
        const validationTab = await screen.findByRole('button', {name: /validation/i});
        expect(validationTab).toHaveTextContent('1');

        // 4. Navigate to Validation Tab
        fireEvent.click(validationTab);

        // 5. Find and validate the report
        // The table of pending reports should be visible
        const churchNameCell = await screen.findByText('Église à Valider');
        expect(churchNameCell).toBeInTheDocument();
        
        const reportRow = churchNameCell.closest('tr');
        expect(reportRow).not.toBeNull();
        if(!reportRow) return;

        // Find the "Valider" button within that row and click it
        const validateButton = reportRow.querySelector('button.bg-green-100'); // Using class to distinguish
        expect(validateButton).toBeInTheDocument();
        expect(validateButton).toHaveTextContent('Valider');
        
        fireEvent.click(validateButton!);

        // 6. Verification
        await waitFor(() => {
            expect(mockApi.validateWorshipService).toHaveBeenCalledTimes(1);
            expect(mockApi.validateWorshipService).toHaveBeenCalledWith(
                'church_valid', // churchId
                'ws_pending_1'  // serviceId
            );
        });

        // Mock the refetch to return data without the pending report.
        mockApi.getFullData.mockResolvedValue({
            data: {
                 ...JSON.parse(JSON.stringify(mockInitialData)),
                churches: {
                    'church_valid': {
                        ...mockInitialData.churches['church_valid'],
                        worshipServices: [
                             { ...mockInitialData.churches['church_valid'].worshipServices[0], status: 'validated' }
                        ]
                    }
                }
            },
            users: [mockRegionalAdmin],
            notifications: [],
            auditLogs: [],
        });
        
        // After validation, the API is called which triggers a refresh. The component should re-render.
        // We check that after the validation, the empty state is shown.
        await waitFor(() => {
            expect(screen.getByText('Aucun rapport en attente')).toBeInTheDocument();
        });
    });
});