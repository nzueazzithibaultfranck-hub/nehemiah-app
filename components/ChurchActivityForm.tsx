import React, { useState, useEffect } from 'react';
import { useChurchData } from '../hooks/appContext';
import { useToast } from '../hooks/useToast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ChurchActivity, NewChurchActivity } from '../types';
import Button from './ui/Button';

interface ChurchActivityFormProps {
    churchId: string;
    initialData: ChurchActivity | null;
    onDone: () => void;
}

const ChurchActivityForm: React.FC<ChurchActivityFormProps> = ({ churchId, initialData, onDone }) => {
    const [formData, setFormData] = useState<NewChurchActivity>({
        title: '',
        date: '',
        type: '',
        description: '',
    });
    
    const { addChurchActivity, updateChurchActivity, addChurchActivityOffline, updateChurchActivityOffline, isProcessing } = useChurchData();
    const { showToast } = useToast();
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                date: initialData.date,
                type: initialData.type,
                description: initialData.description,
            });
        } else {
             setFormData({
                title: '',
                date: new Date().toISOString().split('T')[0],
                type: '',
                description: '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.title || !formData.date || !formData.type) {
            showToast('Veuillez remplir les champs Titre, Date, et Type.', 'error');
            return;
        }

        try {
            if (initialData) {
                const updatedData = { ...initialData, ...formData };
                if (isOnline) {
                    await updateChurchActivity(churchId, updatedData);
                    showToast('Activité mise à jour et synchronisée.', 'success');
                } else {
                    await updateChurchActivityOffline(churchId, updatedData);
                    showToast('Activité mise à jour localement.', 'info');
                }
            } else {
                if (isOnline) {
                    await addChurchActivity(churchId, formData);
                    showToast('Activité ajoutée et synchronisée.', 'success');
                } else {
                    await addChurchActivityOffline(churchId, formData);
                    showToast('Activité sauvegardée localement. Elle sera synchronisée dès que vous serez en ligne.', 'info');
                }
            }
            onDone();
        } catch (error: any) {
            showToast(error.message || "Erreur lors de l'enregistrement.", 'error');
        }
    };
    
    const activityTypes = ['Formation', 'Retraite Spirituelle', 'Action Communautaire', 'Prière', 'Évangélisation', 'Autre'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre de l'activité</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
            </div>
             <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type d'activité</label>
                <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="" disabled>Sélectionner un type</option>
                    {activityTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>

            <div className="flex justify-end pt-4">
                 <Button type="submit" loading={isProcessing}>
                    Enregistrer
                </Button>
            </div>
        </form>
    );
};

export default ChurchActivityForm;