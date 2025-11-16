import React, { useState } from 'react';
import { useChurchData } from '../hooks/appContext';
import { useToast } from '../hooks/useToast';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { NewWorshipService } from '../types';
import Button from './ui/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface RapidWorshipServiceEntryProps {
    churchId: string;
    onDone: () => void;
}

type ServiceRow = NewWorshipService & { tempId: string };

const createEmptyRow = (): ServiceRow => ({
    tempId: `row_${Date.now()}_${Math.random()}`,
    date: new Date().toISOString().split('T')[0],
    speaker: '',
    president: '',
    attendance: { men: 0, women: 0, children: 0 },
    offering: { tithes: 0, regular: 0, special: 0 },
});

const RapidWorshipServiceEntry: React.FC<RapidWorshipServiceEntryProps> = ({ churchId, onDone }) => {
    const [rows, setRows] = useState<ServiceRow[]>([createEmptyRow()]);
    const { addWorshipService, addMultipleWorshipServicesOffline, isProcessing } = useChurchData();
    const { showToast } = useToast();
    const isOnline = useOnlineStatus();

    const handleAddRow = () => {
        setRows(prev => [...prev, createEmptyRow()]);
    };

    const handleRemoveRow = (tempId: string) => {
        setRows(prev => prev.filter(row => row.tempId !== tempId));
    };

    const handleChange = (tempId: string, field: keyof NewWorshipService, value: any) => {
        setRows(prev => prev.map(row => row.tempId === tempId ? { ...row, [field]: value } : row));
    };
    
    const handleNestedChange = (tempId: string, category: 'attendance' | 'offering', field: string, value: string) => {
         setRows(prev => prev.map(row => {
            if (row.tempId === tempId) {
                return {
                    ...row,
                    [category]: {
                        ...row[category],
                        [field]: Math.max(0, parseInt(value, 10) || 0)
                    }
                };
            }
            return row;
        }));
    }

    const handleSubmit = async () => {
        const validRows = rows.filter(row => row.speaker && row.president && row.date);
        if (validRows.length === 0) {
            showToast("Veuillez remplir au moins un rapport valide.", 'error');
            return;
        }

        const reportsToAdd: NewWorshipService[] = validRows.map(({ tempId, ...rest }) => rest);

        try {
            if (isOnline) {
                // Online: submit one by one
                await Promise.all(reportsToAdd.map(report => addWorshipService(churchId, report)));
                showToast(`${reportsToAdd.length} rapport(s) ajouté(s) et synchronisé(s).`, 'success');
            } else {
                // Offline: use the batch offline function
                await addMultipleWorshipServicesOffline(churchId, reportsToAdd);
                showToast(`${reportsToAdd.length} rapport(s) sauvegardé(s) localement.`, 'info');
            }
            onDone();
        } catch (error) {
            showToast("Une erreur est survenue lors de l'enregistrement.", 'error');
        }
    };
    
    const inputClasses = "block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400";

    return (
        <div className="space-y-4">
            <div className="max-h-[60vh] overflow-y-auto">
                 <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Orateur</th>
                            <th className="p-2 text-left">Président</th>
                            <th className="p-2 text-left">Présence (H/F/E)</th>
                            <th className="p-2 text-left">Offrandes (D/R/S)</th>
                            <th className="p-2 text-left"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.tempId} className="border-b dark:border-gray-700">
                                <td className="p-1"><input type="date" value={row.date} onChange={e => handleChange(row.tempId, 'date', e.target.value)} className={inputClasses} /></td>
                                <td className="p-1"><input type="text" value={row.speaker} onChange={e => handleChange(row.tempId, 'speaker', e.target.value)} className={inputClasses} placeholder="Orateur" /></td>
                                <td className="p-1"><input type="text" value={row.president} onChange={e => handleChange(row.tempId, 'president', e.target.value)} className={inputClasses} placeholder="Président" /></td>
                                <td className="p-1">
                                    <div className="flex gap-1">
                                        <input type="number" min="0" value={row.attendance.men} onChange={e => handleNestedChange(row.tempId, 'attendance', 'men', e.target.value)} className={inputClasses} placeholder="H" />
                                        <input type="number" min="0" value={row.attendance.women} onChange={e => handleNestedChange(row.tempId, 'attendance', 'women', e.target.value)} className={inputClasses} placeholder="F" />
                                        <input type="number" min="0" value={row.attendance.children} onChange={e => handleNestedChange(row.tempId, 'attendance', 'children', e.target.value)} className={inputClasses} placeholder="E" />
                                    </div>
                                </td>
                                 <td className="p-1">
                                    <div className="flex gap-1">
                                        <input type="number" min="0" value={row.offering.tithes} onChange={e => handleNestedChange(row.tempId, 'offering', 'tithes', e.target.value)} className={inputClasses} placeholder="Dîmes" />
                                        <input type="number" min="0" value={row.offering.regular} onChange={e => handleNestedChange(row.tempId, 'offering', 'regular', e.target.value)} className={inputClasses} placeholder="Rég." />
                                        <input type="number" min="0" value={row.offering.special} onChange={e => handleNestedChange(row.tempId, 'offering', 'special', e.target.value)} className={inputClasses} placeholder="Spéc." />
                                    </div>
                                </td>
                                <td className="p-1">
                                    <Button size="sm" variant="danger" onClick={() => handleRemoveRow(row.tempId)} disabled={rows.length <= 1}>
                                        <TrashIcon className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
           
            <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                 <Button variant="secondary" onClick={handleAddRow}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Ajouter une ligne
                </Button>
                <Button onClick={handleSubmit} loading={isProcessing}>
                    Enregistrer tout ({rows.length})
                </Button>
            </div>
        </div>
    );
};

export default RapidWorshipServiceEntry;