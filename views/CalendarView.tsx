import React, { useState, useMemo } from 'react';
import PageHeader from '../components/PageHeader';
import { useChurchData } from '../hooks/appContext';
import { useAuth } from '../hooks/useAuth';
import { ChurchActivity, BureauActivity, Church, Region } from '../types';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import Modal from '../components/Modal';

interface CalendarEvent {
    title: string;
    date: string;
    type: string;
    description: string;
    source: string; 
}

const CalendarView: React.FC = () => {
    const { data, isLoading } = useChurchData();
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const allEvents = useMemo(() => {
        if (!data || !user) return [];
        let events: CalendarEvent[] = [];
        // National Activities
        if (user.level === 'national') {
            data.activities.forEach((a: BureauActivity) => events.push({ ...a, source: 'Bureau National' }));
        }
        // Region Activities
        if (user.level === 'national') {
            Object.values(data.regions).forEach((r: Region) => r.activities.forEach((a: BureauActivity) => events.push({ ...a, source: `Région: ${r.name}` })));
        } else if (user.level === 'region' && user.regionId) {
            const region = data.regions[user.regionId];
            if (region) region.activities.forEach((a: BureauActivity) => events.push({ ...a, source: 'Bureau Régional' }));
        }
        // Church Activities
        if (user.level === 'national') {
            Object.values(data.churches).forEach((c: Church) => c.activities.forEach((a: ChurchActivity) => events.push({ ...a, source: `Église: ${c.name}` })));
        } else if (user.level === 'region' && user.regionId) {
             const region = data.regions[user.regionId];
             if (region) region.churches.forEach(cId => data.churches[cId]?.activities.forEach((a: ChurchActivity) => events.push({ ...a, source: `Église: ${data.churches[cId].name}` })));
        } else if (user.level === 'church' && user.churchId) {
            const church = data.churches[user.churchId];
            if(church) church.activities.forEach((a: ChurchActivity) => events.push({ ...a, source: 'Mon Église' }));
        }
        return events;
    }, [data, user]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon
        const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth -1; // 0=Mon, 6=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid: (Date | null)[] = Array(adjustedFirstDay).fill(null);
        for(let i=1; i<= daysInMonth; i++) {
            grid.push(new Date(year, month, i));
        }
        return grid;

    }, [currentDate]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        allEvents.forEach(event => {
            const dateStr = event.date; // YYYY-MM-DD
            if(!map.has(dateStr)) map.set(dateStr, []);
            map.get(dateStr)?.push(event);
        });
        return map;
    }, [allEvents]);

    if(isLoading) {
        return <div>Chargement du calendrier...</div>;
    }

    return (
        <>
            <PageHeader title="Calendrier des Activités" subtitle="Vue d'ensemble de toutes les activités planifiées." />
             <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                    <h2 className="text-lg font-semibold capitalize dark:text-white">{currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {calendarGrid.map((date, index) => {
                        if (!date) return <div key={`empty-${index}`} className="border-r border-b dark:border-gray-700 h-32"></div>;
                        
                        const dateStr = date.toISOString().split('T')[0];
                        const dayEvents = eventsByDate.get(dateStr) || [];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;

                        return (
                             <div key={dateStr} className="border-r border-b dark:border-gray-700 h-32 p-2 flex flex-col">
                                <span className={`self-end text-sm font-medium ${isToday ? 'bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {date.getDate()}
                                </span>
                                <div className="flex-1 overflow-y-auto text-left text-xs space-y-1 mt-1">
                                    {dayEvents.map((event, eventIndex) => (
                                        <div key={eventIndex} onClick={() => setSelectedEvent(event)} className="p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800">
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || ''}>
                {selectedEvent && (
                    <div className="space-y-2 text-sm dark:text-gray-300">
                        <p><span className="font-semibold">Date:</span> {new Date(selectedEvent.date).toLocaleDateString('fr-FR')}</p>
                        <p><span className="font-semibold">Type:</span> {selectedEvent.type}</p>
                        <p><span className="font-semibold">Source:</span> {selectedEvent.source}</p>
                        {selectedEvent.description && <p className="mt-2 text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default CalendarView;