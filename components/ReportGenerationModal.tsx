import React, { useState } from 'react';
import Modal from './Modal';
import Button from './ui/Button';

interface ReportGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (year: number, month: number) => void;
    title: string;
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({ isOpen, onClose, onSubmit, title }) => {
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const handleGenerate = () => {
        onSubmit(year, month);
        onClose();
    };
    
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const inputClasses = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="report-year" className={labelClasses}>Année</label>
                    <input
                        type="number"
                        id="report-year"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value, 10))}
                        className={inputClasses}
                        min="2020"
                        max={currentYear}
                    />
                </div>
                <div>
                    <label htmlFor="report-month" className={labelClasses}>Mois</label>
                    <select
                        id="report-month"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                        className={inputClasses}
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end pt-4">
                    <Button onClick={handleGenerate}>
                        Générer le rapport
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ReportGenerationModal;