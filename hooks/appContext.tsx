import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { produce } from 'immer';
import { api } from '../api';
import { 
    NationalData, User, Notification, AuditLog, NewWorshipService, WorshipService,
    NewBaptizedMember, BaptizedMember, NewChurchActivity, ChurchActivity, DataEntityType,
    NewBureauMember, BureauMember, NewBureauActivity, BureauActivity, OfflineQueueItem,
    Announcement, NewAnnouncement,
} from '../types';
import { useAuth } from './useAuth';
import { useToast } from './useToast';
import { useOnlineStatus } from './useOnlineStatus';

// --- Context Types ---

interface ChurchDataContextType {
    data: NationalData | null;
    isLoading: boolean;
    isProcessing: boolean;
    refreshData: () => Promise<void>;
    addWorshipService: (churchId: string, data: NewWorshipService) => Promise<WorshipService | void>;
    updateWorshipService: (churchId: string, data: WorshipService) => Promise<WorshipService | void>;
    deleteWorshipService: (churchId: string, serviceId: string) => Promise<void>;
    validateWorshipService: (churchId: string, reportId: string) => Promise<void>;
    rejectWorshipService: (churchId: string, reportId: string, reason: string) => Promise<void>;
    addBaptizedMember: (churchId: string, data: NewBaptizedMember) => Promise<BaptizedMember | void>;
    updateBaptizedMember: (churchId: string, data: BaptizedMember) => Promise<BaptizedMember | void>;
    deleteBaptizedMember: (churchId: string, memberId: string) => Promise<void>;
    addChurchActivity: (churchId: string, data: NewChurchActivity) => Promise<ChurchActivity | void>;
    updateChurchActivity: (churchId: string, data: ChurchActivity) => Promise<ChurchActivity | void>;
    deleteChurchActivity: (churchId: string, activityId: string) => Promise<void>;
    addBureauMember: (entityType: DataEntityType, entityId: string | null, data: NewBureauMember) => Promise<BureauMember | void>;
    updateBureauMember: (entityType: DataEntityType, entityId: string | null, data: BureauMember) => Promise<BureauMember | void>;
    deleteBureauMember: (entityType: DataEntityType, entityId: string | null, memberId: string) => Promise<void>;
    addBureauActivity: (entityType: DataEntityType, entityId: string | null, data: NewBureauActivity) => Promise<BureauActivity | void>;
    updateBureauActivity: (entityType: DataEntityType, entityId: string | null, data: BureauActivity) => Promise<BureauActivity | void>;
    deleteBureauActivity: (entityType: DataEntityType, entityId: string | null, activityId: string) => Promise<void>;
    addAnnouncement: (churchId: string, data: NewAnnouncement) => Promise<Announcement | void>;
    updateAnnouncement: (churchId: string, data: Announcement) => Promise<Announcement | void>;
    deleteAnnouncement: (churchId: string, announcementId: string) => Promise<void>;
    addWorshipServiceOffline: (churchId: string, data: NewWorshipService) => Promise<void>;
    addMultipleWorshipServicesOffline: (churchId: string, data: NewWorshipService[]) => Promise<void>;
    updateWorshipServiceOffline: (churchId: string, data: WorshipService) => Promise<void>;
    deleteWorshipServiceOffline: (churchId: string, serviceId: string) => Promise<void>;
    addBaptizedMemberOffline: (churchId: string, data: NewBaptizedMember) => Promise<void>;
    updateBaptizedMemberOffline: (churchId: string, data: BaptizedMember) => Promise<void>;
    deleteBaptizedMemberOffline: (churchId: string, memberId: string) => Promise<void>;
    addChurchActivityOffline: (churchId: string, data: NewChurchActivity) => Promise<void>;
    updateChurchActivityOffline: (churchId: string, data: ChurchActivity) => Promise<void>;
    deleteChurchActivityOffline: (churchId: string, activityId: string) => Promise<void>;
    addAnnouncementOffline: (churchId: string, data: NewAnnouncement) => Promise<void>;
    updateAnnouncementOffline: (churchId: string, data: Announcement) => Promise<void>;
    deleteAnnouncementOffline: (churchId: string, announcementId: string) => Promise<void>;
    getOfflineQueue: () => OfflineQueueItem[];
    syncOfflineQueueForChurch: (churchId: string) => Promise<void>;
}

interface UsersContextType {
    users: User[];
    isLoading: boolean;
    isProcessing: boolean;
    refreshData: () => Promise<void>;
    addUser: (userData: Omit<User, 'id'>) => Promise<User | void>;
    updateUser: (userData: User & {password?: string}) => Promise<User | void>;
    deleteUser: (userId: string) => Promise<void>;
}

interface SystemContextType {
    notifications: Notification[];
    auditLogs: AuditLog[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
    markNotificationAsRead: (id: number) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
}

// --- Contexts ---
const ChurchDataContext = createContext<ChurchDataContextType | undefined>(undefined);
const UsersContext = createContext<UsersContextType | undefined>(undefined);
const SystemContext = createContext<SystemContextType | undefined>(undefined);


export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setData] = useState<NationalData | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
    
    const { user } = useAuth();
    const { showToast } = useToast();
    const isOnline = useOnlineStatus();

    const refreshOfflineQueue = useCallback(async () => {
        if (user) {
            try {
                const queue = await api.getOfflineQueue();
                setOfflineQueue(queue);
            } catch (error) {
                console.error("Failed to fetch offline queue", error);
                setOfflineQueue([]);
            }
        } else {
            setOfflineQueue([]);
        }
    }, [user]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, users, notifications, auditLogs } = await api.getFullData();
            setData(data);
            setUsers(users);
            setNotifications(notifications);
            setAuditLogs(auditLogs);
        } catch (error) {
            console.error("Failed to fetch data", error);
            showToast("Impossible de charger les données.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (user) {
            fetchData();
            refreshOfflineQueue();
        } else {
            setIsLoading(false);
            setOfflineQueue([]);
        }
    }, [fetchData, refreshOfflineQueue, user]);

    const handleApiCall = async <T,>(apiCall: () => Promise<T>): Promise<T | void> => {
        setIsProcessing(true);
        try {
            const result = await apiCall();
            await fetchData(); // Always refresh all data after any successful API call
            return result;
        } catch (error: any) {
            console.error("API call failed", error);
            showToast(error.message || 'Une erreur est survenue.', 'error');
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Offline handlers with Optimistic UI ---
    const addWorshipServiceOffline = async (churchId: string, serviceData: NewWorshipService) => {
        const tempId = `offline_${Date.now()}`;
        setData(produce(draft => {
            if (draft) {
                const newService: WorshipService = { ...serviceData, id: tempId, status: 'offline' };
                draft.churches[churchId]?.worshipServices.push(newService);
            }
        }));
        await api.addWorshipServiceOffline(churchId, serviceData, tempId);
        await refreshOfflineQueue();
    };

    const addMultipleWorshipServicesOffline = async (churchId: string, servicesData: NewWorshipService[]) => {
        const tempServices: WorshipService[] = [];
        const offlineActions: Promise<void>[] = [];

        servicesData.forEach((serviceData, index) => {
            const tempId = `offline_${Date.now()}_${index}`;
            tempServices.push({ ...serviceData, id: tempId, status: 'offline' });
            offlineActions.push(api.addWorshipServiceOffline(churchId, serviceData, tempId));
        });

        setData(produce(draft => {
            if (draft) {
                draft.churches[churchId]?.worshipServices.push(...tempServices);
            }
        }));

        await Promise.all(offlineActions);
        await refreshOfflineQueue();
    };
    
    const updateWorshipServiceOffline = async (churchId: string, serviceData: WorshipService) => {
        setData(produce(draft => {
             if (draft) {
                const services = draft.churches[churchId]?.worshipServices;
                const index = services?.findIndex(s => s.id === serviceData.id);
                if (index !== undefined && index > -1 && services) {
                    services[index] = { ...serviceData, status: 'offline-modified' };
                }
            }
        }));
        await api.updateWorshipServiceOffline(churchId, serviceData);
        await refreshOfflineQueue();
    };
    
    const deleteWorshipServiceOffline = async (churchId: string, serviceId: string) => {
        setData(produce(draft => {
            if (draft) {
                const church = draft.churches[churchId];
                if (church) {
                    church.worshipServices = church.worshipServices.filter(s => s.id !== serviceId);
                }
            }
        }));
        await api.deleteWorshipServiceOffline(churchId, serviceId);
        await refreshOfflineQueue();
    };

    const addBaptizedMemberOffline = async (churchId: string, memberData: NewBaptizedMember) => {
        const tempId = `offline_${Date.now()}`;
        setData(produce(draft => {
            if (draft) {
                const newMember: BaptizedMember = { ...memberData, id: tempId, status: 'offline' };
                draft.churches[churchId]?.baptizedMembers.push(newMember);
            }
        }));
        await api.addBaptizedMemberOffline(churchId, memberData, tempId);
        await refreshOfflineQueue();
    };

     const updateBaptizedMemberOffline = async (churchId: string, memberData: BaptizedMember) => {
        setData(produce(draft => {
             if (draft) {
                const members = draft.churches[churchId]?.baptizedMembers;
                const index = members?.findIndex(m => m.id === memberData.id);
                if (index !== undefined && index > -1 && members) {
                    members[index] = { ...memberData, status: 'offline-modified' };
                }
            }
        }));
        await api.updateBaptizedMemberOffline(churchId, memberData);
        await refreshOfflineQueue();
    };

    const deleteBaptizedMemberOffline = async (churchId: string, memberId: string) => {
        setData(produce(draft => {
            if (draft) {
                const church = draft.churches[churchId];
                if (church) {
                    church.baptizedMembers = church.baptizedMembers.filter(m => m.id !== memberId);
                }
            }
        }));
        await api.deleteBaptizedMemberOffline(churchId, memberId);
        await refreshOfflineQueue();
    };
    
    const addChurchActivityOffline = async (churchId: string, activityData: NewChurchActivity) => {
        const tempId = `offline_${Date.now()}`;
        setData(produce(draft => {
            if (draft) {
                const newActivity: ChurchActivity = { ...activityData, id: tempId, status: 'offline' };
                draft.churches[churchId]?.activities.push(newActivity);
            }
        }));
        await api.addChurchActivityOffline(churchId, activityData, tempId);
        await refreshOfflineQueue();
    };

    const updateChurchActivityOffline = async (churchId: string, activityData: ChurchActivity) => {
        setData(produce(draft => {
             if (draft) {
                const activities = draft.churches[churchId]?.activities;
                const index = activities?.findIndex(a => a.id === activityData.id);
                if (index !== undefined && index > -1 && activities) {
                    activities[index] = { ...activityData, status: 'offline-modified' };
                }
            }
        }));
        await api.updateChurchActivityOffline(churchId, activityData);
        await refreshOfflineQueue();
    };

    const deleteChurchActivityOffline = async (churchId: string, activityId: string) => {
        setData(produce(draft => {
            if (draft) {
                const church = draft.churches[churchId];
                if (church) {
                    church.activities = church.activities.filter(a => a.id !== activityId);
                }
            }
        }));
        await api.deleteChurchActivityOffline(churchId, activityId);
        await refreshOfflineQueue();
    };
    
    const addAnnouncementOffline = async (churchId: string, announcementData: NewAnnouncement) => {
        if (!user) {
            showToast("Vous devez être connecté pour ajouter une annonce.", "error");
            return;
        }
        const tempId = `offline_${Date.now()}`;
        const now = new Date().toISOString();
        setData(produce(draft => {
            if (draft) {
                const newAnnouncement: Announcement = {
                    ...announcementData,
                    id: tempId,
                    authorId: user.id,
                    authorName: user.username,
                    createdAt: now,
                    updatedAt: now,
                    status: 'offline'
                };
                draft.churches[churchId]?.announcements.push(newAnnouncement);
            }
        }));
        await api.addAnnouncementOffline(churchId, announcementData, tempId);
        await refreshOfflineQueue();
    };

    const updateAnnouncementOffline = async (churchId: string, announcementData: Announcement) => {
        setData(produce(draft => {
            if (draft) {
                const announcements = draft.churches[churchId]?.announcements;
                const index = announcements?.findIndex(a => a.id === announcementData.id);
                if (index !== undefined && index > -1 && announcements) {
                    announcements[index] = { ...announcementData, status: 'offline-modified' };
                }
            }
        }));
        await api.updateAnnouncementOffline(churchId, announcementData);
        await refreshOfflineQueue();
    };

    const deleteAnnouncementOffline = async (churchId: string, announcementId: string) => {
        setData(produce(draft => {
            if (draft) {
                const church = draft.churches[churchId];
                if (church) {
                    church.announcements = church.announcements.filter(a => a.id !== announcementId);
                }
            }
        }));
        await api.deleteAnnouncementOffline(churchId, announcementId);
        await refreshOfflineQueue();
    };

    const syncOfflineQueueForChurch = async (churchId: string) => {
        if (!isOnline) {
            showToast("Vous êtes hors ligne. La synchronisation est impossible.", "error");
            return;
        }

        const itemsToSync = offlineQueue.filter(item => item.payload.churchId === churchId);
        if(itemsToSync.length === 0) {
            showToast("Aucune action à synchroniser.", "info");
            return;
        }

        setIsProcessing(true);
        try {
            const { successCount, totalCount } = await api.syncOfflineQueueForChurch(churchId);
            showToast(`${successCount} sur ${totalCount} action(s) synchronisée(s).`, successCount < totalCount ? 'error' : 'success');
            await fetchData();
            await refreshOfflineQueue();
        } catch (error: any) {
            showToast(error.message || "Erreur de synchronisation.", "error");
            await refreshOfflineQueue();
        } finally {
            setIsProcessing(false);
        }
    };
    
    // --- Context Values ---

    const churchDataContext: ChurchDataContextType = {
        data, isLoading, isProcessing, refreshData: fetchData,
        addWorshipService: (c,d) => handleApiCall(() => api.addWorshipService(c,d)),
        updateWorshipService: (c,d) => handleApiCall(() => api.updateWorshipService(c,d)),
        deleteWorshipService: (c,id) => handleApiCall(() => api.deleteWorshipService(c,id)),
        validateWorshipService: (c,id) => handleApiCall(() => api.validateWorshipService(c,id)),
        rejectWorshipService: (c,id, r) => handleApiCall(() => api.rejectWorshipService(c,id, r)),
        addBaptizedMember: (c,d) => handleApiCall(() => api.addBaptizedMember(c,d)),
        updateBaptizedMember: (c,d) => handleApiCall(() => api.updateBaptizedMember(c,d)),
        deleteBaptizedMember: (c,id) => handleApiCall(() => api.deleteBaptizedMember(c,id)),
        addChurchActivity: (c,d) => handleApiCall(() => api.addChurchActivity(c,d)),
        updateChurchActivity: (c,d) => handleApiCall(() => api.updateChurchActivity(c,d)),
        deleteChurchActivity: (c,id) => handleApiCall(() => api.deleteChurchActivity(c,id)),
        addBureauMember: (t,id,d) => handleApiCall(() => api.addBureauMember(t,id,d)),
        updateBureauMember: (t,id,d) => handleApiCall(() => api.updateBureauMember(t,id,d)),
        deleteBureauMember: (t,id,mid) => handleApiCall(() => api.deleteBureauMember(t,id,mid)),
        addBureauActivity: (t,id,d) => handleApiCall(() => api.addBureauActivity(t,id,d)),
        updateBureauActivity: (t,id,d) => handleApiCall(() => api.updateBureauActivity(t,id,d)),
        deleteBureauActivity: (t,id,aid) => handleApiCall(() => api.deleteBureauActivity(t,id,aid)),
        addAnnouncement: (c,d) => handleApiCall(() => api.addAnnouncement(c,d)),
        updateAnnouncement: (c,d) => handleApiCall(() => api.updateAnnouncement(c,d)),
        deleteAnnouncement: (c,id) => handleApiCall(() => api.deleteAnnouncement(c,id)),
        addWorshipServiceOffline, 
        addMultipleWorshipServicesOffline,
        updateWorshipServiceOffline, 
        deleteWorshipServiceOffline,
        addBaptizedMemberOffline, updateBaptizedMemberOffline, deleteBaptizedMemberOffline,
        addChurchActivityOffline, updateChurchActivityOffline, deleteChurchActivityOffline,
        addAnnouncementOffline, updateAnnouncementOffline, deleteAnnouncementOffline,
        getOfflineQueue: () => offlineQueue,
        syncOfflineQueueForChurch,
    };

    const usersContext: UsersContextType = {
        users, isLoading, isProcessing, refreshData: fetchData,
        addUser: (d) => handleApiCall(() => api.addUser(d)),
        updateUser: (d) => handleApiCall(() => api.updateUser(d)),
        deleteUser: (id) => handleApiCall(() => api.deleteUser(id)),
    };

    const systemContext: SystemContextType = {
        notifications, auditLogs, isLoading, refreshData: fetchData,
        markNotificationAsRead: async (id) => {
            await api.markNotificationAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
        },
        markAllNotificationsAsRead: async () => {
            await api.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({...n, read: true})));
        },
    };

    return (
        <ChurchDataContext.Provider value={churchDataContext}>
            <UsersContext.Provider value={usersContext}>
                <SystemContext.Provider value={systemContext}>
                    {children}
                </SystemContext.Provider>
            </UsersContext.Provider>
        </ChurchDataContext.Provider>
    );
};

// --- Consumer Hooks ---

export const useChurchData = (): ChurchDataContextType => {
    const context = useContext(ChurchDataContext);
    if (context === undefined) {
        throw new Error('useChurchData must be used within an AppDataProvider');
    }
    return context;
};

export const useUsers = (): UsersContextType => {
    const context = useContext(UsersContext);
    if (context === undefined) {
        throw new Error('useUsers must be used within an AppDataProvider');
    }
    return context;
};

export const useSystem = (): SystemContextType => {
    const context = useContext(SystemContext);
    if (context === undefined) {
        throw new Error('useSystem must be used within an AppDataProvider');
    }
    return context;
};