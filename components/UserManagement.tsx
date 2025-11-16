import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUsers, useChurchData } from '../hooks/appContext';
import PageHeader from './PageHeader';
import Card from './ui/Card';
import Button from './ui/Button';
import SearchInput from './ui/SearchInput';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import UserForm from './UserForm';
import Pagination from './Pagination';
import { User } from '../types';
import { ROLES } from '../permissions';
import { useFilter } from '../hooks/useFilter';
import { usePagination } from '../hooks/usePagination';
import { exportToCsv } from '../utils/csvExporter';
import { PencilIcon, TrashIcon, PlusIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useSort } from '../hooks/useSort';
import SortableHeader from './ui/SortableHeader';

type UserWithDetails = User & {
    roleName: string;
    entityName: string;
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { users, isLoading: usersLoading, deleteUser, isProcessing: usersProcessing } = useUsers();
    const { data, isLoading: dataLoading, isProcessing: dataProcessing } = useChurchData();
    const location = useLocation();
    const highlightUserId = location.state?.highlightUserId;
    const isLoading = usersLoading || dataLoading;
    const isProcessing = usersProcessing || dataProcessing;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

     const getEntityName = (user: User) => {
        if (user.level === 'region' && user.regionId && data) {
            return data.regions[user.regionId]?.name;
        }
        if (user.level === 'church' && user.churchId && data) {
            return data.churches[user.churchId]?.name;
        }
        return 'N/A';
    };

    const usersWithDetails = useMemo<UserWithDetails[]>(() => users.map(user => ({
        ...user,
        roleName: ROLES[user.roleId]?.name || user.roleId,
        entityName: getEntityName(user) || 'N/A',
    })), [users, data]);


    const filterFn = (user: UserWithDetails, searchTerm: string) => {
        return (
            user.username.toLowerCase().includes(searchTerm) ||
            user.roleName.toLowerCase().includes(searchTerm) ||
            user.entityName.toLowerCase().includes(searchTerm)
        );
    };
    
    const { searchTerm, setSearchTerm, filteredItems } = useFilter(usersWithDetails, filterFn);
    const { items: sortedItems, requestSort, getSortDirection } = useSort(filteredItems, { key: 'username', direction: 'asc' });
    const { currentData, currentPage, maxPage, jump, next, prev } = usePagination(sortedItems, 10);

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedUser) {
            await deleteUser(selectedUser.id);
            setIsConfirmModalOpen(false);
            setSelectedUser(null);
        }
    };
    
    const handleExport = () => {
        // Fix: Explicitly type the 'u' parameter to prevent type inference issues.
        const dataToExport = sortedItems.map((u: UserWithDetails) => ({
            "Nom d'utilisateur": u.username,
            "Rôle": u.roleName,
            "Niveau": u.level,
            "Entité": u.entityName
        }));
        exportToCsv(`utilisateurs_${new Date().toISOString().split('T')[0]}.csv`, dataToExport);
    };

    return (
        <>
            <PageHeader title="Gestion des utilisateurs" subtitle={`Total: ${users.length} utilisateurs`}>
                 <div className="flex space-x-2">
                    <Button onClick={handleExport} variant="secondary">
                        <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                        Exporter
                    </Button>
                    <Button onClick={handleAdd}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Ajouter un utilisateur
                    </Button>
                </div>
            </PageHeader>
            <Card>
                <div className="mb-4">
                    <SearchInput 
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Rechercher par nom, rôle, entité..."
                    />
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {/* FIX: Explicitly passing children prop to resolve type error. */}
                                <SortableHeader<UserWithDetails> sortKey="username" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    children="Utilisateur"
                                />
                                {/* FIX: Explicitly passing children prop to resolve type error. */}
                                <SortableHeader<UserWithDetails> sortKey="roleName" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    children="Rôle"
                                />
                                {/* FIX: Explicitly passing children prop to resolve type error. */}
                                <SortableHeader<UserWithDetails> sortKey="entityName" requestSort={requestSort} getSortDirection={getSortDirection} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                    children="Entité Associée"
                                />
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                             {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-4 dark:text-gray-300">Chargement...</td></tr>
                            ) : currentData.map(user => (
                                <tr 
                                    key={user.id}
                                    className={highlightUserId === user.id ? 'bg-blue-100 dark:bg-blue-900/50' : ''}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.roleName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.entityName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"><PencilIcon className="h-5 w-5"/></button>
                                        {currentUser?.id !== user.id && (
                                            <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="h-5 w-5"/></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <Pagination currentPage={currentPage} maxPage={maxPage} next={next} prev={prev} jump={jump} />
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}>
                <UserForm initialData={selectedUser} onDone={() => setIsModalOpen(false)} />
            </Modal>
            
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer l'utilisateur "${selectedUser?.username}" ? Cette action est irréversible.`}
                isProcessing={isProcessing}
            />
        </>
    );
};

export default UserManagement;