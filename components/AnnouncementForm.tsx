import React, { useState, useEffect } from 'react';
import { useChurchData } from '../hooks/appContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Announcement, NewAnnouncement } from '../types';
import Button from './ui/Button';

interface AnnouncementFormProps {
    churchId: string;
    initialData: Announcement | null;
    onDone: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ churchId, initialData, onDone }) => {
    const [formData, setFormData] = useState<Omit<NewAnnouncement, 'authorId' | 'authorName'>>({
        title: '',
        content: '',
    });
    
    const { addAnnouncement, updateAnnouncement, addAnnouncementOffline, updateAnnouncementOffline, isProcessing } = useChurchData();
    const { user } = useAuth();
    const { showToast } = useToast();
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                content: initialData.content,
            });
        } else {
             setFormData({
                title: '',
                content: '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.content.trim()) {
            showToast('Le titre et le contenu ne peuvent pas être vides.', 'error');
            return;
        }

        try {
            if (initialData) {
                const updatedData: Announcement = { ...initialData, ...formData };
                if (isOnline) {
                    await updateAnnouncement(churchId, updatedData);
                    showToast('Annonce mise à jour et synchronisée.', 'success');
                } else {
                    await updateAnnouncementOffline(churchId, updatedData);
                    showToast('Annonce mise à jour localement.', 'info');
                }
            } else {
                if (!user) {
                    showToast("Erreur: utilisateur non authentifié.", "error");
                    return;
                }
                const newAnnouncementData: NewAnnouncement = { ...formData };
                if (isOnline) {
                    await addAnnouncement(churchId, newAnnouncementData);
                    showToast('Annonce ajoutée et synchronisée.', 'success');
                } else {
                    await addAnnouncementOffline(churchId, newAnnouncementData);
                    showToast('Annonce sauvegardée localement.', 'info');
                }
            }
            onDone();
        } catch (error: any) {
            showToast(error.message || "Erreur lors de l'enregistrement.", 'error');
        }
    };
    
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className={labelClasses}>Titre</label>
                <input type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className={inputClasses} />
            </div>
            <div>
                <label htmlFor="content" className={labelClasses}>Contenu</label>
                <textarea name="content" id="content" value={formData.content} onChange={handleChange} rows={5} required className={inputClasses}></textarea>
            </div>
            <div className="flex justify-end pt-4">
                 <Button type="submit" loading={isProcessing}>
                    Enregistrer
                </Button>
            </div>
        </form>
    );
};

export default AnnouncementForm;