import React, { useState } from 'react';
import { WorshipService } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../Pagination';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Modal from '../Modal';
import { InboxIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PendingReportsDetailViewProps {
    reports: (WorshipService & { churchId: string; churchName: string })[];
    onValidate: (churchId: string, reportId: string) => Promise<void>;
    onReject: (churchId: string, reportId: string, reason: string) => Promise<void>;
    isProcessing: boolean;
}

const PendingReportsDetailView: React.FC<PendingReportsDetailViewProps> = ({ reports, onValidate, onReject, isProcessing }) => {
    
    const [rejectionModal, setRejectionModal] = useState<(WorshipService & { churchId: string; churchName: string }) | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const { currentData, ...paginationProps } = usePagination(reports, 10);

    const handleRejectClick = (report: WorshipService & { churchId: string; churchName: string }) => {
        setRejectionModal(report);
    };

    const handleConfirmRejection = async () => {
        if (rejectionModal && rejectionReason) {
            await onReject(rejectionModal.churchId, rejectionModal.id, rejectionReason);
            setRejectionModal(null);
            setRejectionReason('');
        }
    };


    if (reports.length === 0) {
        return (
            <EmptyState
                icon={<InboxIcon className="h-12 w-12 text-gray-400" />}
                title="Aucun rapport en attente"
                message="Tous les rapports soumis ont été traités. Bon travail !"
            />
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Église</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Présence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Offrandes (FCFA)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentData.map(report => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{report.date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{report.churchName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{(report.attendance.men + report.attendance.women + report.attendance.children).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{(report.offering.tithes + report.offering.regular + report.offering.special).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    <Button 
                                        onClick={() => onValidate(report.churchId, report.id)}
                                        variant="secondary" 
                                        size="sm"
                                        loading={isProcessing}
                                        className="bg-green-100 text-green-700 hover:bg-green-200"
                                    >
                                        <CheckIcon className="h-4 w-4 mr-1"/> Valider
                                    </Button>
                                    <Button 
                                        onClick={() => handleRejectClick(report)}
                                        variant="secondary" 
                                        size="sm"
                                        loading={isProcessing}
                                        className="bg-red-100 text-red-700 hover:bg-red-200"
                                    >
                                        <XMarkIcon className="h-4 w-4 mr-1"/> Rejeter
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination {...paginationProps} />
            <Modal 
                isOpen={!!rejectionModal} 
                onClose={() => setRejectionModal(null)} 
                title={`Rejeter le rapport de ${rejectionModal?.churchName}`}
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Motif du rejet (obligatoire)
                        </label>
                        <textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Ex: Le total des offrandes semble incorrect."
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="secondary" onClick={() => setRejectionModal(null)}>Annuler</Button>
                        <Button variant="danger" onClick={handleConfirmRejection} disabled={!rejectionReason || isProcessing} loading={isProcessing}>
                            Confirmer le Rejet
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PendingReportsDetailView;