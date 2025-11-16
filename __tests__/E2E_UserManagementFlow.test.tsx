// __tests__/E2E_UserManagementFlow.test.tsx
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
const mockNationalAdmin: User = {
    id: 'user_national_admin_test',
    username: 'national_admin_test',
    roleId: 'national_admin',
    level: 'national',
    permissions: ROLES['national_admin'].permissions,
    forcePasswordChange: false,
};

const mockInitialData: NationalData = {
    bureau: [],
    activities: [],
    regions: {
        'reg_for_new_user': { id: 'reg_for_new_user', name: 'Région Nouvelle', churches: ['church_for_new_user'], bureau: [], activities: [] }
    },
    churches: {
        'church_for_new_user': {
            id: 'church_for_new_user',
            name: 'Église Nouvelle',
            regionId: 'reg_for_new_user',
            worshipServices: [], baptizedMembers: [], activities: [], bureau: [],
            // Fix: Added missing 'announcements' property to satisfy the Church type.
            announcements: [],
        }
    }
};

describe('E2E User Flow: National Admin Creates a New User', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        let currentUser: User | null = null;
        mockApi.login.mockImplementation(async (username, password) => {
            if (username === 'national_admin_test' && password === 'password123') {
                currentUser = mockNationalAdmin;
                return mockNationalAdmin;
            }
            throw new Error('Invalid credentials');
        });

        mockApi.getCurrentUser.mockImplementation(async () => currentUser);

        mockApi.getFullData.mockResolvedValue({
            data: JSON.parse(JSON.stringify(mockInitialData)),
            users: [mockNationalAdmin],
            notifications: [],
            auditLogs: [],
        });
        
        mockApi.addUser.mockResolvedValue({
            id: 'user_newly_created',
            username: 'new_church_user',
            roleId: 'church_admin',
            level: 'church',
            churchId: 'church_for_new_user',
            regionId: 'reg_for_new_user',
            permissions: ROLES['church_admin'].permissions,
            forcePasswordChange: true,
        });
    });

    test('a national admin can log in, navigate, and create a new church user', async () => {
        // 1. Render App
        render(<App />);

        // 2. Login
        fireEvent.change(screen.getByPlaceholderText(/nom d'utilisateur/i), { target: { value: 'national_admin_test' } });
        fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

        // 3. Navigate to User Management
        const userManagementLink = await screen.findByRole('link', { name: /gestion utilisateurs/i });
        fireEvent.click(userManagementLink);

        // 4. Open Add User Modal
        const addUserButton = await screen.findByRole('button', { name: /ajouter un utilisateur/i });
        fireEvent.click(addUserButton);

        // 5. Fill out the form in the modal
        const modalTitle = await screen.findByText('Ajouter un utilisateur');
        expect(modalTitle).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/nom d'utilisateur/i), { target: { value: 'new_church_user' } });
        fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'newpassword123' } });
        
        fireEvent.change(screen.getByLabelText(/rôle/i), { target: { value: 'church_admin' } });
        fireEvent.change(screen.getByLabelText(/^niveau$/i), { target: { value: 'church' } });
        
        const regionSelect = await screen.findByLabelText(/^région$/i);
        fireEvent.change(regionSelect, { target: { value: 'reg_for_new_user' } });

        const churchSelect = await screen.findByLabelText(/^église$/i);
        fireEvent.change(churchSelect, { target: { value: 'church_for_new_user' } });

        const saveButton = screen.getByRole('button', { name: /enregistrer/i });
        fireEvent.click(saveButton);

        // 6. Verification
        await waitFor(() => {
            expect(mockApi.addUser).toHaveBeenCalledTimes(1);
            expect(mockApi.addUser).toHaveBeenCalledWith({
                username: 'new_church_user',
                password: 'newpassword123',
                roleId: 'church_admin',
                level: 'church',
                regionId: 'reg_for_new_user',
                churchId: 'church_for_new_user',
                forcePasswordChange: true,
                permissions: ROLES['church_admin'].permissions,
            });
        });
        
        await waitFor(() => {
            expect(screen.queryByText('Ajouter un utilisateur')).not.toBeInTheDocument();
        });
    });
});