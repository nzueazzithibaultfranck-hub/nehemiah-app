import React, { useState, useEffect } from 'react';
import { useChurchData } from '../hooks/appContext';
import { useToast } from '../hooks/useToast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WorshipService, NewWorshipService } from '../types';
import Button from './ui/Button';

interface WorshipServiceFormProps {
    churchId: string;
    initialData: WorshipService | null;
    onDone: () => void;
}

const WorshipServiceForm: React.FC<WorshipServiceFormProps> = ({ churchId, initialData, onDone }) => {
    const [formData, setFormData] = useState<NewWorshipService>({
        date: '',
        speaker: '',
        president: '',
        attendance: { men: 0, women: 0, children: 0 },
        offering: { tithes: 0, regular: 0, special: 0 },
    });
    
    const { addWorshipService, updateWorshipService, isProcessing, addWorshipServiceOffline, updateWorshipServiceOffline } = useChurchData();
    const { showToast } = useToast();
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (initialData) {
            setFormData({
                date: initialData.date,
                speaker: initialData.speaker,
                president: initialData.president,
                attendance: { ...initialData.attendance },
                offering: { ...initialData.offering },
            });
        } else {
             setFormData({
                date: new Date().toISOString().split('T')[0],
                speaker: '',
                president: '',
                attendance: { men: 0, women: 0, children: 0 },
                offering: { tithes: 0, regular: 0, special: 0 },
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (e: React.ChangeEvent<HTMLInputElement>, category: 'attendance' | 'offering') => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [name]: Math.max(0, parseInt(value, 10) || 0),
            },
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData) { // Editing
                const updatedData = { ...initialData, ...formData };
                if (isOnline) {
                    await updateWorshipService(churchId, updatedData);
                    showToast('Rapport mis à jour et synchronisé.', 'success');
                } else {
                    await updateWorshipServiceOffline(churchId, updatedData);
                    showToast('Rapport mis à jour localement.', 'info');
                }
            } else { // Creating
                if (isOnline) {
                    await addWorshipService(churchId, formData);
                    showToast('Rapport ajouté et synchronisé.', 'success');
                } else {
                    await addWorshipServiceOffline(churchId, formData);
                    showToast('Rapport sauvegardé localement. Il sera synchronisé dès que vous serez en ligne.', 'info');
                }
            }
            onDone();
        } catch (error: any) {
            showToast(error.message || "Erreur lors de l'enregistrement.", 'error');
        }
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="date" className={labelClasses}>Date</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="speaker" className={labelClasses}>Orateur</label>
                    <input type="text" name="speaker" id="speaker" value={formData.speaker} onChange={handleChange} required className={inputClasses} />
                </div>
                 <div>
                    <label htmlFor="president" className={labelClasses}>Président</label>
                    <input type="text" name="president" id="president" value={formData.president} onChange={handleChange} required className={inputClasses} />
                </div>
            </div>
            
            <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Présence</h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                        <label htmlFor="men" className={labelClasses}>Hommes</label>
                        <input type="number" min="0" name="men" id="men" value={formData.attendance.men} onChange={e => handleNestedChange(e, 'attendance')} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="women" className={labelClasses}>Femmes</label>
                        <input type="number" min="0" name="women" id="women" value={formData.attendance.women} onChange={e => handleNestedChange(e, 'attendance')} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="children" className={labelClasses}>Enfants</label>
                        <input type="number" min="0" name="children" id="children" value={formData.attendance.children} onChange={e => handleNestedChange(e, 'attendance')} required className={inputClasses} />
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">Offrandes (FCFA)</h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                        <label htmlFor="tithes" className={labelClasses}>Dîmes</label>
                        <input type="number" min="0" name="tithes" id="tithes" value={formData.offering.tithes} onChange={e => handleNestedChange(e, 'offering')} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="regular" className={labelClasses}>Régulière</label>
                        <input type="number" min="0" name="regular" id="regular" value={formData.offering.regular} onChange={e => handleNestedChange(e, 'offering')} required className={inputClasses} />
                    </div>
                    <div>
                        <label htmlFor="special" className={labelClasses}>Spéciale</label>
                        <input type="number" min="0" name="special" id="special" value={formData.offering.special} onChange={e => handleNestedChange(e, 'offering')} required className={inputClasses} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                 <Button type="submit" loading={isProcessing}>
                    Enregistrer
                </Button>
            </div>
        </form>
    );
};

export default WorshipServiceForm;