// __tests__/Login.test.tsx
import React from 'react';
// NOTE: In a real project, you would install these dependencies via npm/yarn.
// These imports are for demonstrating a standard React test.
// Fix: Uncomment imports for React Testing Library to provide necessary testing utilities.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Fix: Import Jest globals to resolve TypeScript errors about undefined test functions.
import { jest, describe, afterEach, test, expect } from '@jest/globals';

import Login from '../components/Login';
import { useAuth } from '../hooks/useAuth';
import { ToastProvider } from '../hooks/useToast';
import { MemoryRouter } from 'react-router-dom';

/*
 * =============================================================================
 *  NOTE POUR L'UTILISATEUR :
 * =============================================================================
 *  Ceci est un fichier de test automatisé. Son but est de simuler le comportement
 *  d'un utilisateur sur le composant de connexion et de vérifier que tout
 *  fonctionne comme prévu.
 *
 *  Dans un projet réel, ce fichier serait exécuté par un outil spécialisé
 *  (comme "Jest") pour garantir que les futures modifications ne cassent pas
 *  la fonctionnalité de connexion (c'est ce qu'on appelle un "test de non-régression").
 *
 *  La création de ce type de fichier est la première étape de la "Priorité n°2 :
 *  Fiabilisation et Préparation à la Production".
 * =============================================================================
 */


// On simule (mock) les fonctions qui dépendent de l'extérieur (API, navigation)
// pour isoler notre test et le rendre prédictible.
const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../hooks/useAuth', () => ({
    // On garde les fonctionnalités originales du hook...
    ...jest.requireActual('../hooks/useAuth'),
    // ... mais on remplace la fonction `useAuth` pour qu'elle retourne notre simulation.
    useAuth: () => ({
        // isLoading et isAuthenticated ne sont pas utilisés par Login, mais c'est une bonne pratique de les fournir.
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: mockLogin, // On utilise notre fonction simulée
        logout: jest.fn(),
        changePassword: jest.fn(),
        refreshUser: jest.fn(),
    }),
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate, // On remplace la navigation par notre simulation.
}));


// Début de la suite de tests pour le composant Login
describe('Login Component', () => {

    // On s'assure de nettoyer nos simulations après chaque test
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    // Premier test : vérifie une connexion réussie
    test('devrait appeler la fonction de connexion et naviguer en cas de succès', async () => {
        // On prépare notre test : si `login` est appelé, on simule une réussite.
        mockLogin.mockResolvedValue(undefined);

        // On affiche le composant dans un DOM virtuel pour le tester.
        // Il est enveloppé dans les Providers nécessaires et un MemoryRouter pour la navigation.
        render(
            <MemoryRouter>
                <ToastProvider>
                    <Login />
                </ToastProvider>
            </MemoryRouter>
        );

        // On trouve les champs du formulaire et le bouton
        const usernameInput = screen.getByPlaceholderText(/nom d'utilisateur/i);
        const passwordInput = screen.getByPlaceholderText(/mot de passe/i);
        const submitButton = screen.getByRole('button', { name: /se connecter/i });

        // On simule la saisie de l'utilisateur
        fireEvent.change(usernameInput, { target: { value: 'national_admin' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        // On simule le clic sur le bouton de connexion
        fireEvent.click(submitButton);

        // On attend que les actions asynchrones (la connexion) se terminent
        await waitFor(() => {
            // On vérifie que notre fonction simulée `login` a bien été appelée avec les bons identifiants
            expect(mockLogin).toHaveBeenCalledWith('national_admin', 'password123');
        });
        
        await waitFor(() => {
            // On vérifie que la navigation vers le tableau de bord a bien été déclenchée
            expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        });
    });

    // Deuxième test : vérifie la gestion d'une erreur de connexion
    test('devrait afficher un message d\'erreur en cas d\'échec de la connexion', async () => {
        // On prépare notre test : si `login` est appelé, on simule une erreur.
        mockLogin.mockRejectedValue(new Error('Invalid credentials'));
        
        render(
            <MemoryRouter>
                <ToastProvider>
                    <Login />
                </ToastProvider>
            </MemoryRouter>
        );

        // On simule la saisie et la soumission du formulaire
        fireEvent.change(screen.getByPlaceholderText(/nom d'utilisateur/i), { target: { value: 'wronguser' } });
        fireEvent.change(screen.getByPlaceholderText(/mot de passe/i), { target: { value: 'wrongpass' } });
        fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));
        
        // On attend que les actions se terminent
        await waitFor(() => {
            // On vérifie que `login` a été appelé
            expect(mockLogin).toHaveBeenCalledWith('wronguser', 'wrongpass');
        });
        
        // On vérifie que la navigation n'a PAS été déclenchée
        expect(mockNavigate).not.toHaveBeenCalled();

        // On vérifie que le bouton n'est plus en état de chargement
        expect(screen.getByRole('button', { name: /se connecter/i })).not.toBeDisabled();
    });
});