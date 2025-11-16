
import React from 'react';

interface PaginationProps {
    currentPage: number;
    maxPage: number;
    prev: () => void;
    next: () => void;
    jump: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, maxPage, prev, next, jump }) => {
    if (maxPage <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= maxPage; i++) {
        pageNumbers.push(i);
    }
    
    // Logic to show a limited number of page buttons around the current page
    const pagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
    let endPage = Math.min(maxPage, startPage + pagesToShow - 1);

    if (endPage - startPage + 1 < pagesToShow) {
        startPage = Math.max(1, endPage - pagesToShow + 1);
    }

    const pages = Array.from({ length: (endPage - startPage) + 1 }, (_, i) => startPage + i);


    return (
        <nav className="flex items-center justify-between pt-4" aria-label="Table navigation">
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> sur <span className="font-semibold text-gray-900 dark:text-white">{maxPage}</span>
            </span>
            <ul className="inline-flex items-center -space-x-px">
                <li>
                    <button onClick={prev} disabled={currentPage === 1} className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        Précédent
                    </button>
                </li>
                {
                    pages.map(number => (
                        <li key={number}>
                            <button onClick={() => jump(number)} className={`px-3 py-2 leading-tight border border-gray-300 ${currentPage === number ? 'text-blue-600 bg-blue-50 dark:bg-gray-700 dark:text-white' : 'text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}`}>
                                {number}
                            </button>
                        </li>
                    ))
                }
                <li>
                    <button onClick={next} disabled={currentPage === maxPage} className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        Suivant
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Pagination;