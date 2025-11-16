import React, { useState, useEffect } from 'react';
import { useChurchData } from '../hooks/appContext';
import { useToast } from '../hooks/useToast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { BaptizedMember, NewBaptizedMember } from '../types';
import Button from './ui/Button';

interface BaptizedMemberFormProps {
    churchId: string;
    initialData: BaptizedMember | null;
    onDone: () => void;
}

const BaptizedMemberForm: React.FC<BaptizedMemberFormProps> = ({ churchId, initialData, onDone }) => {
    const [formData, setFormData] = useState<NewBaptizedMember>({
        fullName: '',
        gender: 'unknown',
        dateOfBirth: '',
        dateOfBaptism: '',
        address: '',
        phone: '',
        email: '',
        notes: '',
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    const { addBaptizedMember, updateBaptizedMember, isProcessing, addBaptizedMemberOffline, updateBaptizedMemberOffline } = useChurchData();
    const { showToast } = useToast();
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (initialData) {
            setFormData({
                fullName: initialData.fullName,
                gender: initialData.gender || 'unknown',
                dateOfBirth: initialData.dateOfBirth || '',
                dateOfBaptism: initialData.dateOfBaptism || '',
                address: initialData.address || '',
                phone: initialData.phone,
                email: initialData.email,
                notes: initialData.notes || '',
            });
        } else {
             setFormData({
                fullName: '',
                gender: 'unknown',
                dateOfBirth: '',
                dateOfBaptism: '',
                address: '',
                phone: '',
                email: '',
                notes: '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}));
        }
    };
    
    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Format de l'email invalide.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.fullName) {
            showToast('Le nom complet est requis.', 'error');
            return;
        }
        
        if (!validate()) {
            return;
        }

        try {
            if (initialData) {
                const updatedData = { ...initialData, ...formData };
                 if (isOnline) {
                    await updateBaptizedMember(churchId, updatedData);
                    showToast('Membre mis à jour et synchronisé.', 'success');
                } else {
                    await updateBaptizedMemberOffline(churchId, updatedData);
                    showToast('Membre mis à jour localement.', 'info');
                }
            } else {
                if (isOnline) {
                    await addBaptizedMember(churchId, formData);
                    showToast('Membre ajouté et synchronisé.', 'success');
                } else {
                    await addBaptizedMemberOffline(churchId, formData);
                    showToast('Membre sauvegardé localement. Il sera synchronisé dès que vous serez en ligne.', 'info');
                }
            }
            onDone();
        } catch {
            showToast("Erreur lors de l'enregistrement.", 'error');
        }
    };
    
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="fullName" className={labelClasses}>Nom Complet *</label>
                    <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} required className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="gender" className={labelClasses}>Genre</label>
                    <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                        <option value="unknown">Non spécifié</option>
                        <option value="male">Homme</option>
                        <option value="female">Femme</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="dateOfBirth" className={labelClasses}>Date de Naissance</label>
                    <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="dateOfBaptism" className={labelClasses}>Date de Baptême</label>
                    <input type="date" name="dateOfBaptism" id="dateOfBaptism" value={formData.dateOfBaptism} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="phone" className={labelClasses}>Téléphone</label>
                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="email" className={labelClasses}>Email</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClasses} />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
            </div>
            
            <div>
                <label htmlFor="address" className={labelClasses}>Adresse</label>
                <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className={inputClasses} />
            </div>

            <div>
                <label htmlFor="notes" className={labelClasses}>Notes</label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClasses}></textarea>
            </div>


            <div className="flex justify-end pt-4">
                 <Button type="submit" loading={isProcessing}>
                    Enregistrer
                </Button>
            </div>
        </form>
    );
};

export default BaptizedMemberForm;