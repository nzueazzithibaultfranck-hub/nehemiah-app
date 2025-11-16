import React, { useState, useMemo, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChurchData, useUsers } from '../hooks/appContext';
import { useUI } from '../hooks/useUI';
import { GlobalSearchResult, Region, Church, User } from '../types';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const MAX_RESULTS_PER_CATEGORY = 3;

const GlobalSearch: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const { data: churchData, isLoading: churchDataLoading } = useChurchData();
    const { users, isLoading: usersLoading } = useUsers();
    const { setViewOverride } = useUI();
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    const searchResults = useMemo<GlobalSearchResult[]>(() => {
        if (!searchTerm.trim() || (!churchData && !users)) {
            return [];
        }

        const term = searchTerm.toLowerCase();
        let results: GlobalSearchResult[] = [];
        const tempResults: { regions: GlobalSearchResult[], churches: GlobalSearchResult[], users: GlobalSearchResult[] } = {
            regions: [],
            churches: [],
            users: []
        };

        // Search Regions
        if (churchData?.regions) {
            for (const region of Object.values(churchData.regions) as Region[]) {
                if (tempResults.regions.length >= MAX_RESULTS_PER_CATEGORY) break;
                if (region.name.toLowerCase().includes(term)) {
                    tempResults.regions.push({ type: 'region', id: region.id, name: region.name, context: 'Région' });
                }
            }
        }

        // Search Churches
        if (churchData?.churches) {
            for (const church of Object.values(churchData.churches) as Church[]) {
                if (tempResults.churches.length >= MAX_RESULTS_PER_CATEGORY) break;
                if (church.name.toLowerCase().includes(term)) {
                    const regionName = churchData.regions[church.regionId]?.name || 'Région inconnue';
                    tempResults.churches.push({ type: 'church', id: church.id, name: church.name, context: `Église de ${regionName}` });
                }
            }
        }

        // Search Users
        if (users) {
            for (const user of users) {
                if (tempResults.users.length >= MAX_RESULTS_PER_CATEGORY) break;
                if (user.username.toLowerCase().includes(term)) {
                    tempResults.users.push({ type: 'user', id: user.id, name: user.username, context: `Utilisateur (${user.level})` });
                }
            }
        }
        
        results = [...tempResults.regions, ...tempResults.churches, ...tempResults.users];
        return results;
    }, [searchTerm, churchData, users]);

    const handleSelect = (result: GlobalSearchResult) => {
        setSearchTerm('');
        setIsOpen(false);
        if (result.type === 'region') {
            setViewOverride({ level: 'region', entityId: result.id });
            navigate('/');
        } else if (result.type === 'church') {
            setViewOverride({ level: 'church', entityId: result.id });
            navigate('/');
        } else if (result.type === 'user') {
            navigate('/users', { state: { highlightUserId: result.id } });
        }
    };

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter' && activeIndex >= 0 && searchResults[activeIndex]) {
            e.preventDefault();
            handleSelect(searchResults[activeIndex]);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };
    
    useEffect(() => {
        setActiveIndex(-1);
    }, [searchTerm]);

    const groupedResults = useMemo(() => {
        // Fix: Refactored to use a standard loop for better type inference.
        const groups: Record<string, GlobalSearchResult[]> = {};
        for (const result of searchResults) {
            const key = result.type === 'region' ? 'Régions' : result.type === 'church' ? 'Églises' : 'Utilisateurs';
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(result);
        }
        return groups;
    }, [searchResults]);

    return (
        <div className="relative w-full max-w-xs lg:max-w-md" ref={searchRef}>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Recherche globale..."
                    className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500"
                />
            </div>

            {isOpen && searchTerm.trim() && (
                <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="max-h-80 overflow-y-auto p-2">
                        {churchDataLoading || usersLoading ? (
                             <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Recherche...</div>
                        ) : searchResults.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Aucun résultat.</div>
                        ) : (
                            // FIX: Use Object.keys().map() for better type inference in some environments.
                            Object.keys(groupedResults).map(category => {
                                const items = groupedResults[category];
                                return (
                                <div key={category}>
                                    <h3 className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{category}</h3>
                                    <ul className="text-sm text-gray-700 dark:text-gray-300">
                                        {items.map(item => {
                                            const itemIndex = searchResults.findIndex(r => r.id === item.id);
                                            return (
                                                <li
                                                    key={item.id}
                                                    onClick={() => handleSelect(item)}
                                                    onMouseMove={() => setActiveIndex(itemIndex)}
                                                    className={`cursor-pointer rounded-md px-2 py-2 ${activeIndex === itemIndex ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                                >
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.context}</div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )})
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;