// __tests__/E2E_UserFlow.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

import App from '../App';
import { api } from '../api'; // We'll mock the api directly
import { User, NationalData } from '../types';
import { ROLES } from '../permissions';

/*
 * =============================================================================
 *  NOTE POUR L'UTILISATEUR : Test de Flux de Bout-en-Bout (End-to-End)
 * =============================================================================
 *  Ce fichier est la première étape concrète de la "Phase 1 : Fiabilisation".
 *  Contrairement aux tests unitaires qui vérifient de petits composants isolés,
 *  ce test simule un parcours utilisateur complet et critique :
 *
 *  1. Un administrateur d'église se connecte.
 *  2. Il navigue vers la section des rapports de culte.
 *  3. Il ajoute un nouveau rapport.
 *
 *  Ce test garantit que ce flux essentiel ne sera jamais cassé par de futures
 *  modifications. C'est une assurance qualité automatisée pour la stabilité de
 *  l'application. Nous n'avons modifié AUCUN fichier de l'application
 *  existante, nous avons seulement ajouté ce "scénario de test".
 * =============================================================================
 */

// We mock the entire data service layer (the "backend")
jest.mock('../api');

const mockApi = api as jest.Mocked<typeof api>;

// --- Initial Mock Data ---
const mockChurchAdmin: User = {
    id: 'user_church_test',
    username: 'church_test_admin',
    roleId: 'church_admin',
    level: 'church',
    churchId: 'church_test',
    regionId: 'reg_test',
    permissions: ROLES['church_admin'].permissions,
    forcePasswordChange: false,
};

const mockInitialData: NationalData = {
    bureau: [],
    activities: [],
    regions: {
        'reg_test': { id: 'reg_test', name: 'Région Test', churches: ['church_test'], bureau: [], activities: [] }
    },
    churches: {
        'church_test': {
            id: 'church_test',
            name: 'Église de Test',
            regionId: 'reg_test',
            worshipServices: [],
            baptizedMembers: [],
            activities: [],
            bureau: [],
            // Fix: Added missing 'announcements' property to satisfy the Church type.
            announcements: [],
        }
    }
};

describe('E2E User Flow: Church Admin Adds Worship Service Report', () => {

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // --- Mock API implementation ---
        // Auth
        mockApi.login.mockImplementation(async (username, password) => {
            if (username === 'church_test_admin' && password === 'password123') {
                return mockChurchAdmin;
            }
            throw new Error('Invalid credentials');
        });
        
        let currentUser: User | null = null;
        mockApi.getCurrentUser.mockImplementation(async () => {
             // Simulate session persistence after login
            if (mockApi.login.mock.calls.length > 0) {
                currentUser = mockChurchAdmin;
            }
            return currentUser;
        });

        // Data
        mockApi.getFullData.mockResolvedValue({
            data: JSON.parse(JSON.stringify(mockInitialData)),
            users: [mockChurchAdmin],
            notifications: [],
            auditLogs: [],
        });
        
        // Mock the 'add' function to verify it's called
        mockApi.addWorshipService.mockResolvedValue({
            id: 'ws_new',
            date: '2024-01-15',
            speaker: 'Pasteur Test',
            president: 'Ancien Test',
            attendance: { men: 20, women: 25, children: 10 },
            offering: { tithes: 50000, regular: 20000, special: 5000 },
            status: 'pending'
        });
    });

    test('A church admin can log in, navigate, and successfully add a new report', async () => {
        // 1. --- Render the entire application ---
        render(<App />);

        // 2. --- Login Phase ---
        // The user should see the login screen first
        expect(screen.getByRole('heading', { name: /connectez-vous/i })).toBeInTheDocument();

        // Fill in the form
        fireEvent.change(screen.getByPlaceholderText(/nom d'utilisateur/i), { target: { value: 'church_test_admin' } });
        fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'password123' } });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
        
        // 3. --- Navigation and Dashboard Verification ---
        // Wait for the dashboard to load after login. We look for the church name.
        await waitFor(() => {
            expect(screen.getByText('Église de Test')).toBeInTheDocument();
        });

        // Navigate to the "Rapports de Culte" tab
        const reportsTab = await screen.findByRole('button', { name: /rapports de culte/i });
        fireEvent.click(reportsTab);
        
        // 4. --- Form Submission Phase ---
        // Click the "Add" button to open the modal
        const addButton = await screen.findByRole('button', { name: /ajouter/i });
        fireEvent.click(addButton);

        // Wait for the modal to appear and fill the form
        const modalTitle = await screen.findByText('Ajouter Rapport');
        expect(modalTitle).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2024-01-15' } });
        fireEvent.change(screen.getByLabelText(/orateur/i), { target: { value: 'Pasteur Test' } });
        fireEvent.change(screen.getByLabelText(/président/i), { target: { value: 'Ancien Test' } });
        fireEvent.change(screen.getByLabelText(/hommes/i), { target: { value: '20' } });
        fireEvent.change(screen.getByLabelText(/femmes/i), { target: { value: '25' } });
        fireEvent.change(screen.getByLabelText(/enfants/i), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText(/dîmes/i), { target: { value: '50000' } });
        fireEvent.change(screen.getByLabelText(/régulière/i), { target: { value: '20000' } });
        fireEvent.change(screen.getByLabelText(/spéciale/i), { target: { value: '5000' } });
        
        // Submit the form within the modal
        const saveButton = screen.getByRole('button', { name: /enregistrer/i });
        fireEvent.click(saveButton);

        // 5. --- Verification ---
        // We wait and check if our mocked API was called correctly.
        // This confirms that the entire UI flow worked as expected.
        await waitFor(() => {
            expect(mockApi.addWorshipService).toHaveBeenCalledTimes(1);
            expect(mockApi.addWorshipService).toHaveBeenCalledWith(
                'church_test', // churchId
                { // The form data
                    date: '2024-01-15',
                    speaker: 'Pasteur Test',
                    president: 'Ancien Test',
                    attendance: { men: 20, women: 25, children: 10 },
                    offering: { tithes: 50000, regular: 20000, special: 5000 }
                }
            );
        });

        // Also check if the modal is closed after submission
        await waitFor(() => {
            expect(screen.queryByText('Ajouter Rapport')).not.toBeInTheDocument();
        });
    });
});