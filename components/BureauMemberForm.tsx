import React, { useState, useEffect } from 'react';
import { BureauMember, NewBureauMember } from '../types';
import Button from './ui/Button';

interface BureauMemberFormProps {
    initialData: BureauMember | null;
    onDone: () => void;
    onSave: (data: Omit<BureauMember, 'id'> | BureauMember) => Promise<void>;
    isProcessing: boolean;
}

const BureauMemberForm: React.FC<BureauMemberFormProps> = ({ initialData, onDone, onSave, isProcessing }) => {
    const [formData, setFormData] = useState<NewBureauMember>({
        name: '',
        position: '',
        contact: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                position: initialData.position,
                contact: initialData.contact,
            });
        } else {
            setFormData({ name: '', position: '', contact: ''});
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(initialData ? { ...initialData, ...formData } : formData);
        onDone();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
                <input type="text" name="position" id="position" value={formData.position} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact</label>
                <input type="text" name="contact" id="contact" value={formData.contact} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" loading={isProcessing}>
                    Enregistrer
                </Button>
            </div>
        </form>
    );
};

export default BureauMemberForm;