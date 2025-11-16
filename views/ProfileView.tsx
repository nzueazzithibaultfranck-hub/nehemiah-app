import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import PageHeader from '../components/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const ProfileView: React.FC = () => {
    // Fix: Destructure isProcessing from useAuth to track the password change loading state.
    const { user, changePassword, isLoading, isProcessing } = useAuth();
    const { showToast } = useToast();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (newPassword.length < 8) {
            newErrors.newPassword = "Le nouveau mot de passe doit contenir au moins 8 caractères.";
        }
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }
    
    const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: ''}));
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }
        if (!user) {
            showToast("Utilisateur non trouvé.", "error");
            return;
        }
        
        try {
            await changePassword(user.id, oldPassword, newPassword);
            showToast('Mot de passe changé avec succès.', 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showToast(error.message || 'Une erreur est survenue.', 'error');
        }
    };

    if (isLoading || !user) {
        return <div>Chargement...</div>;
    }

    return (
        <>
            <PageHeader title="Mon Profil" subtitle={`Bienvenue, ${user.username}`} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Informations</h3>
                        <div className="mt-4 space-y-2">
                            <p><span className="font-semibold">Nom d'utilisateur:</span> {user.username}</p>
                            <p><span className="font-semibold">Niveau:</span> <span className="capitalize">{user.level}</span></p>
                        </div>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Changer le mot de passe</h3>
                        {user.forcePasswordChange && (
                             <div className="mt-2 text-sm text-yellow-800 bg-yellow-100 p-3 rounded-md border border-yellow-200">
                                <p className="font-medium">Action requise</p>
                                <p>Pour des raisons de sécurité, vous devez changer votre mot de passe initial avant de continuer.</p>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="old-password"  className="block text-sm font-medium text-gray-700">Ancien mot de passe</label>
                                <input type="password" id="old-password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                             <div>
                                <label htmlFor="new-password"  className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                                <input type="password" id="new-password" value={newPassword} onChange={handleChange(setNewPassword, 'newPassword')} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
                            </div>
                             <div>
                                <label htmlFor="confirm-password"  className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                                <input type="password" id="confirm-password" value={confirmPassword} onChange={handleChange(setConfirmPassword, 'confirmPassword')} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
                            </div>
                            <div className="text-right">
                                <Button type="submit" loading={isProcessing}>
                                    Mettre à jour
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default ProfileView;