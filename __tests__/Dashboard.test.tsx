import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, test, expect } from '@jest/globals';

import Dashboard from '../components/Dashboard';
import { useAuth } from '../hooks/useAuth';
import { UIProvider } from '../hooks/useUI';
import { MemoryRouter } from 'react-router-dom';
import { User } from '../types';

// On simule les composants de vue pour isoler le test du composant Dashboard lui-même.
// Cela rend le test plus rapide et moins fragile.
jest.mock('../views/NationalView', () => () => <div>National Dashboard Mock</div>);
jest.mock('../views/RegionView', () => () => <div>Region Dashboard Mock</div>);
jest.mock('../views/ChurchView', () => () => <div>Church Dashboard Mock</div>);

// On simule le hook useAuth pour pouvoir contrôler quel utilisateur est "connecté" pendant le test.
jest.mock('../hooks/useAuth', () => ({
    ...jest.requireActual('../hooks/useAuth'),
    useAuth: jest.fn(),
}));

// Une fonction d'aide pour afficher notre composant avec un utilisateur spécifique.
const renderWithUser = (user: User | null) => {
    // On dit à notre simulation de useAuth de retourner l'utilisateur que nous voulons tester.
    (useAuth as jest.Mock).mockReturnValue({ user });
    
    // On affiche le composant dans un environnement de test avec tous les Providers nécessaires.
    // Le DataProvider est supprimé car le composant Dashboard lui-même ne l'utilise pas
    // et ses enfants (qui l'utilisent) sont simulés.
    return render(
        <MemoryRouter>
            <UIProvider>
                <Dashboard />
            </UIProvider>
        </MemoryRouter>
    );
};

// Début de la suite de tests pour le composant Dashboard
describe('Dashboard Component', () => {

    test('devrait afficher le tableau de bord national pour un utilisateur de niveau national', () => {
        const nationalUser: Partial<User> = { level: 'national' };
        renderWithUser(nationalUser as User);
        // On vérifie que le texte de notre simulation pour la vue nationale est bien présent à l'écran.
        expect(screen.getByText('National Dashboard Mock')).toBeInTheDocument();
    });

    test('devrait afficher le tableau de bord régional pour un utilisateur de niveau régional', () => {
        const regionUser: Partial<User> = { level: 'region' };
        renderWithUser(regionUser as User);
        expect(screen.getByText('Region Dashboard Mock')).toBeInTheDocument();
    });

    test('devrait afficher le tableau de bord d\'église pour un utilisateur de niveau église', () => {
        const churchUser: Partial<User> = { level: 'church' };
        renderWithUser(churchUser as User);
        expect(screen.getByText('Church Dashboard Mock')).toBeInTheDocument();
    });

    test('devrait afficher un message si l\'utilisateur est null', () => {
        renderWithUser(null);
        expect(screen.getByText('Utilisateur non trouvé.')).toBeInTheDocument();
    });

    test('devrait afficher un message pour un niveau d\'utilisateur inconnu', () => {
        // On teste un cas anormal pour s'assurer que l'application ne crashe pas.
        const unknownUser: Partial<User> = { level: 'unknown' as any };
        renderWithUser(unknownUser as User);
        expect(screen.getByText('Niveau d\'utilisateur inconnu.')).toBeInTheDocument();
    });
});