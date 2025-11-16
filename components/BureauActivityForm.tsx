import React, { useState, useEffect } from 'react';
import { BureauActivity, NewBureauActivity } from '../types';
import Button from './ui/Button';

interface BureauActivityFormProps {
    initialData: BureauActivity | null;
    onDone: () => void;
    onSave: (data: Omit<BureauActivity, 'id'> | BureauActivity) => Promise<void>;
    isProcessing: boolean;
}

const BureauActivityForm: React.FC<BureauActivityFormProps> = ({ initialData, onDone, onSave, isProcessing }) => {
    const [formData, setFormData] = useState<NewBureauActivity>({
        title: '',
        date: new Date().toISOString().split('T')[0],
        type: '',
        description: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                date: initialData.date,
                type: initialData.type,
                description: initialData.description,
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(initialData ? { ...initialData, ...formData } : formData);
        onDone();
    };

    const activityTypes = ['Réunion', 'Planification', 'Rapport', 'Autre'];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre</label>
                    <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
            </div>
            <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
                <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                    <option value="" disabled>Sélectionner...</option>
                    {activityTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea name="description" id="description" rows={3} value={formData.description} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" loading={isProcessing}>
                     Enregistrer
                </Button>
            </div>
        </form>
    );
};

export default BureauActivityForm;