import React, { useState, useMemo } from 'react';
import { useChurchData } from '../hooks/appContext';
import { useToast } from '../hooks/useToast';
import { BureauMember, BureauActivity, DataEntityType, NewBureauMember, NewBureauActivity } from '../types';
import { useSort } from '../hooks/useSort';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import SortableHeader from './ui/SortableHeader';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import BureauMemberForm from './BureauMemberForm';
import BureauActivityForm from './BureauActivityForm';
import { PlusIcon, PencilIcon, TrashIcon, BriefcaseIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface BureauManagementProps {
    entityType: DataEntityType;
    entityId: string | null;
    entityName: string;
}

const BureauManagement: React.FC<BureauManagementProps> = ({ entityType, entityId, entityName }) => {
    const { 
        data, 
        isProcessing,
        addBureauMember, 
        updateBureauMember, 
        deleteBureauMember,
        addBureauActivity,
        updateBureauActivity,
        deleteBureauActivity
    } = useChurchData();
    const { showToast } = useToast();

    const [modal, setModal] = useState<{ type: 'member' | 'activity', data: any | null } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ type: 'member' | 'activity', data: any | null } | null>(null);

    const entityData = useMemo(() => {
        if (!data) return null;
        if (entityType === 'national') return data;
        if (entityType === 'region' && entityId) return data.regions[entityId];
        if (entityType === 'church' && entityId) return data.churches[entityId];
        return null;
    }, [data, entityType, entityId]);

    const bureauMembers = entityData?.bureau || [];
    // Church entity does not have 'activities' of type BureauActivity, so we only handle them for national and region
    const bureauActivities = (entityType !== 'church' && entityData && 'activities' in entityData) ? (entityData as any).activities : [];

    const { items: sortedMembers, requestSort: requestSortMembers, getSortDirection: getSortDirectionMembers } = useSort<BureauMember>(bureauMembers, { key: 'name', direction: 'asc' });
    const { items: sortedActivities, requestSort: requestSortActivities, getSortDirection: getSortDirectionActivities } = useSort<BureauActivity>(bureauActivities, { key: 'date', direction: 'desc' });
    
    const handleSaveMember = async (memberData: NewBureauMember | BureauMember) => {
        try {
            if ('id' in memberData) {
                await updateBureauMember(entityType, entityId, memberData as BureauMember);
                showToast('Membre mis à jour.', 'success');
            } else {
                await addBureauMember(entityType, entityId, memberData as NewBureauMember);
                showToast('Membre ajouté.', 'success');
            }
        } catch (e: any) {
            showToast(e.message || 'Erreur', 'error');
        }
    };
    
    const handleSaveActivity = async (activityData: NewBureauActivity | BureauActivity) => {
        try {
            if ('id' in activityData) {
                await updateBureauActivity(entityType, entityId, activityData as BureauActivity);
                showToast('Activité mise à jour.', 'success');
            } else {
                await addBureauActivity(entityType, entityId, activityData as NewBureauActivity);
                showToast('Activité ajoutée.', 'success');
            }
        } catch (e: any) {
            showToast(e.message || 'Erreur', 'error');
        }
    };

    const handleDelete = async () => {
        if (!confirmModal) return;
        try {
            if (confirmModal.type === 'member') {
                await deleteBureauMember(entityType, entityId, confirmModal.data.id);
                showToast('Membre supprimé.', 'success');
            } else if (confirmModal.type === 'activity') {
                await deleteBureauActivity(entityType, entityId, confirmModal.data.id);
                 showToast('Activité supprimée.', 'success');
            }
        } catch (e: any) {
            showToast(e.message || 'Erreur', 'error');
        } finally {
            setConfirmModal(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Bureau Members Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Membres du Bureau</h3>
                    <Button onClick={() => setModal({ type: 'member', data: null })}><PlusIcon className="h-5 w-5 mr-2"/>Ajouter Membre</Button>
                </div>
                {sortedMembers.length === 0 ? (
                    <EmptyState 
                        icon={<BriefcaseIcon className="h-8 w-8 text-gray-400"/>}
                        title="Aucun membre du bureau"
                        message={`Ajoutez les membres qui composent le bureau ${entityType === 'national' ? 'national' : `de ${entityName}`}.`}
                        actionText="Ajouter un membre"
                        onActionClick={() => setModal({ type: 'member', data: null })}
                    />
                ) : (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                             <thead className="bg-gray-50">
                                <tr>
                                    {/* FIX: Explicitly passing children prop to resolve type error. */}
                                    <SortableHeader<BureauMember> sortKey="name" requestSort={requestSortMembers} getSortDirection={getSortDirectionMembers} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" children="Nom" />
                                    {/* FIX: Explicitly passing children prop to resolve type error. */}
                                    <SortableHeader<BureauMember> sortKey="position" requestSort={requestSortMembers} getSortDirection={getSortDirectionMembers} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" children="Position" />
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedMembers.map(member => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{member.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{member.position}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{member.contact}</td>
                                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                            <Button size="sm" variant="secondary" onClick={() => setModal({type: 'member', data: member})}><PencilIcon className="h-4 w-4"/></Button>
                                            <Button size="sm" variant="danger" onClick={() => setConfirmModal({type: 'member', data: member})}><TrashIcon className="h-4 w-4"/></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Bureau Activities Section (not for churches) */}
            {entityType !== 'church' && (
                 <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Activités du Bureau</h3>
                        <Button onClick={() => setModal({ type: 'activity', data: null })}><PlusIcon className="h-5 w-5 mr-2"/>Ajouter Activité</Button>
                    </div>
                    {sortedActivities.length === 0 ? (
                        <EmptyState 
                            icon={<CalendarDaysIcon className="h-8 w-8 text-gray-400"/>}
                            title="Aucune activité de bureau"
                            message={`Ajoutez les activités (réunions, etc.) du bureau ${entityType === 'national' ? 'national' : `de ${entityName}`}.`}
                            actionText="Ajouter une activité"
                            onActionClick={() => setModal({ type: 'activity', data: null })}
                        />
                    ) : (
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                 <thead className="bg-gray-50">
                                    <tr>
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<BureauActivity> sortKey="date" requestSort={requestSortActivities} getSortDirection={getSortDirectionActivities} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" children="Date" />
                                        {/* FIX: Explicitly passing children prop to resolve type error. */}
                                        <SortableHeader<BureauActivity> sortKey="title" requestSort={requestSortActivities} getSortDirection={getSortDirectionActivities} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" children="Titre" />
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedActivities.map(activity => (
                                        <tr key={activity.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{activity.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{activity.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{activity.type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                                <Button size="sm" variant="secondary" onClick={() => setModal({type: 'activity', data: activity})}><PencilIcon className="h-4 w-4"/></Button>
                                                <Button size="sm" variant="danger" onClick={() => setConfirmModal({type: 'activity', data: activity})}><TrashIcon className="h-4 w-4"/></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            
            <Modal isOpen={!!modal} onClose={() => setModal(null)} title={modal?.data ? `Modifier ${modal?.type === 'member' ? 'Membre' : 'Activité'}` : `Ajouter ${modal?.type === 'member' ? 'Membre' : 'Activité'}`}>
                {modal?.type === 'member' && (
                    <BureauMemberForm 
                        initialData={modal.data} 
                        onDone={() => setModal(null)} 
                        onSave={handleSaveMember}
                        isProcessing={isProcessing} 
                    />
                )}
                {modal?.type === 'activity' && (
                    <BureauActivityForm 
                        initialData={modal.data} 
                        onDone={() => setModal(null)} 
                        onSave={handleSaveActivity}
                        isProcessing={isProcessing} 
                    />
                )}
            </Modal>
            
             <ConfirmationModal 
                isOpen={!!confirmModal}
                onClose={() => setConfirmModal(null)}
                onConfirm={handleDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.`}
                isProcessing={isProcessing}
            />
        </div>
    );
};

export default BureauManagement;