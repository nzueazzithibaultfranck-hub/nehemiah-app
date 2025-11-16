import React, { useState, useEffect, useMemo } from 'react';
import { useUsers, useChurchData } from '../hooks/appContext';
import { useToast } from '../hooks/useToast';
import { User, Region, Church } from '../types';
import { ROLES } from '../permissions';
import Button from './ui/Button';

interface UserFormProps {
    initialData: User | null;
    onDone: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onDone }) => {
    const { addUser, updateUser, isProcessing, users } = useUsers();
    const { data } = useChurchData();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        roleId: 'church_admin',
        level: 'church' as 'national' | 'region' | 'church',
        regionId: '',
        churchId: '',
        forcePasswordChange: true,
    });
    
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const availableChurches = useMemo(() => {
        if (data && formData.regionId) {
            const region = data.regions[formData.regionId];
            // Fix: Add explicit type to resolve 'unknown' type errors.
            return region ? region.churches.map(id => data.churches[id]).filter(Boolean) as Church[] : [];
        }
        return [];
    }, [formData.regionId, data]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                username: initialData.username,
                password: '',
                roleId: initialData.roleId,
                level: initialData.level,
                regionId: initialData.regionId || '',
                churchId: initialData.churchId || '',
                forcePasswordChange: initialData.forcePasswordChange || false,
            });
        }
    }, [initialData]);
    
    useEffect(() => {
        // Reset churchId if it's not in the new list of available churches
        if (formData.churchId && !availableChurches.some(c => c.id === formData.churchId)) {
           setFormData(prev => ({ ...prev, churchId: '' }));
        }
    }, [availableChurches, formData.churchId]);


    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        
        // Username validation
        if (users.some(u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== initialData?.id)) {
            newErrors.username = "Ce nom d'utilisateur est déjà pris.";
        }
        
        // Password validation
        if (!initialData && formData.password.length < 8) {
             newErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
        }
        if (initialData && formData.password && formData.password.length < 8) {
             newErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => {
                const newState = { ...prev, [name]: value };
                if (name === 'level') {
                    newState.regionId = '';
                    newState.churchId = '';
                }
                if (name === 'regionId') {
                    newState.churchId = '';
                }
                return newState;
            });
        }
         // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validate()) {
            return;
        }

        try {
            // Fix: Get permissions from the selected role to satisfy the 'User' type requirements.
            const role = ROLES[formData.roleId];
            if (!role) {
                showToast("Rôle invalide sélectionné.", "error");
                return;
            }

            if (initialData) {
                // For updates, we create a payload based on initial data and form data.
                // We only include the password if a new one was typed.
                const payload: any = { 
                    ...initialData, 
                    ...formData,
                    permissions: role.permissions, // Also fixes a latent bug where permissions were not updated on role change.
                };
                if (!formData.password) {
                    delete payload.password;
                }
                await updateUser(payload);
                showToast('Utilisateur mis à jour avec succès.', 'success');
            } else {
                // For new users, password is required.
                const { password, ...userData } = formData;
                await addUser({ ...userData, password, permissions: role.permissions });
                showToast('Utilisateur ajouté avec succès.', 'success');
            }
            onDone();
        } catch (error: any) {
            showToast(error.message || "Erreur lors de l'enregistrement.", 'error');
        }
    };

    const roles = Object.values(ROLES);
    // Fix: Add explicit type to resolve 'unknown' type errors.
    const regions: Region[] = data ? Object.values(data.regions) : [];

    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const inputClasses = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="username" className={labelClasses}>Nom d'utilisateur</label>
                <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required className={inputClasses} />
                 {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>
             <div>
                <label htmlFor="password-field" className={labelClasses}>Mot de passe</label>
                <input type="password" name="password" id="password-field" value={formData.password} onChange={handleChange} placeholder={initialData ? "Laisser vide pour ne pas changer" : ""} required={!initialData} className={inputClasses} />
                 {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            
            {!initialData && (
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input id="forcePasswordChange" name="forcePasswordChange" type="checkbox" checked={formData.forcePasswordChange} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600" />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="forcePasswordChange" className="font-medium text-gray-900 dark:text-gray-300">Forcer le changement de mot de passe à la prochaine connexion</label>
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="roleId" className={labelClasses}>Rôle</label>
                <select name="roleId" id="roleId" value={formData.roleId} onChange={handleChange} required className={inputClasses}>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="level" className={labelClasses}>Niveau</label>
                <select name="level" id="level" value={formData.level} onChange={handleChange} required className={inputClasses}>
                    <option value="national">National</option>
                    <option value="region">Région</option>
                    <option value="church">Église</option>
                </select>
            </div>
            {(formData.level === 'region' || formData.level === 'church') && (
                <div>
                    <label htmlFor="regionId" className={labelClasses}>Région</label>
                    <select name="regionId" id="regionId" value={formData.regionId} onChange={handleChange} required className={inputClasses}>
                        <option value="">Sélectionner une région</option>
                        {regions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
                    </select>
                </div>
            )}
            {formData.level === 'church' && formData.regionId && (
                <div>
                    <label htmlFor="churchId" className={labelClasses}>Église</label>
                    <select name="churchId" id="churchId" value={formData.churchId} onChange={handleChange} required className={inputClasses}>
                        <option value="">Sélectionner une église</option>
                         {availableChurches.map(church => <option key={church.id} value={church.id}>{church.name}</option>)}
                    </select>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <Button type="submit" loading={isProcessing}>Enregistrer</Button>
            </div>
        </form>
    );
};

export default UserForm;