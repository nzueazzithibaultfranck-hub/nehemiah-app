import { db } from './db';
import { initialData, initialUsers } from '../mockData';
import { 
    User, 
    NationalData, 
    WorshipService, 
    NewWorshipService, 
    BaptizedMember, 
    NewBaptizedMember,
    ChurchActivity,
    NewChurchActivity,
    DataEntityType,
    BureauMember,
    NewBureauMember,
    BureauActivity,
    NewBureauActivity,
    AuditLog,
    Notification,
    OfflineQueueItem,
    // Fix: Added missing 'Church' type import.
    Church,
    Announcement,
    NewAnnouncement,
} from '../types';

const FAKE_DELAY = 200; // Fake delay for API calls simulation

class DataService {
    private data: NationalData | null = null;
    private users: User[] = [];
    private notifications: Notification[] = [];
    private auditLogs: AuditLog[] = [];
    private currentUser: User | null = null;

    private initPromise: Promise<void>;

    constructor() {
        this.initPromise = this._initialize();
    }

    private async _initialize(): Promise<void> {
        try {
            const [data, users, notifications, auditLogs, session] = await db.keyval.bulkGet([
                'data', 'users', 'notifications', 'auditLogs', 'session'
            ]);

            if (data && users && notifications && auditLogs) {
                this.data = data.value;
                this.users = users.value;
                this.notifications = notifications.value;
                this.auditLogs = auditLogs.value;
                this.currentUser = session ? session.value : null;
            } else {
                console.log("Initializing IndexedDB with mock data.");
                this.data = initialData.data;
                this.users = initialUsers;
                this.notifications = initialData.notifications;
                this.auditLogs = [];
                this.currentUser = null;
                await this.saveAllToDb();
            }
        } catch (error) {
             console.error("Failed to initialize DataService from IndexedDB:", error);
             // Fallback to in-memory initial data if DB fails
             this.data = initialData.data;
             this.users = initialUsers;
             this.notifications = initialData.notifications;
        }
    }

    private async saveAllToDb() {
        // Deep clone to remove any proxies before storing
        const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));
        await db.keyval.bulkPut([
            { key: 'data', value: deepClone(this.data) },
            { key: 'users', value: deepClone(this.users) },
            { key: 'notifications', value: deepClone(this.notifications) },
            { key: 'auditLogs', value: deepClone(this.auditLogs) },
            { key: 'session', value: deepClone(this.currentUser) },
        ]);
    }

    private async saveData() { await db.keyval.put({ key: 'data', value: JSON.parse(JSON.stringify(this.data)) }); }
    private async saveUsers() { await db.keyval.put({ key: 'users', value: JSON.parse(JSON.stringify(this.users)) }); }
    private async saveNotifications() { await db.keyval.put({ key: 'notifications', value: JSON.parse(JSON.stringify(this.notifications)) }); }
    private async saveAuditLogs() { await db.keyval.put({ key: 'auditLogs', value: JSON.parse(JSON.stringify(this.auditLogs)) }); }
    private async saveSession() { await db.keyval.put({ key: 'session', value: JSON.parse(JSON.stringify(this.currentUser)) }); }
    
    private async logAction(action: string, details: string) {
        await this.initPromise;
        if (!this.currentUser) return;
        const log: AuditLog = {
            id: this.generateId('log'),
            timestamp: new Date().toISOString(),
            actorUsername: this.currentUser.username,
            action,
            details,
        };
        this.auditLogs.unshift(log);
        await this.saveAuditLogs();
    }
    
    private async createNotification(message: string) {
        await this.initPromise;
        const notif: Notification = {
            id: Date.now(),
            message,
            read: false,
            timestamp: new Date().toISOString(),
        };
        this.notifications.unshift(notif);
        await this.saveNotifications();
        return notif;
    }

    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // --- Authentication ---
    async login(username: string, password: string): Promise<User> {
        await this.initPromise;
        await new Promise(res => setTimeout(res, FAKE_DELAY));
        const user = this.users.find(u => u.username === username);
        if (user) {
            this.currentUser = user;
            await this.saveSession();
            return user;
        }
        throw new Error('Invalid credentials');
    }

    async logout(): Promise<void> {
        await this.initPromise;
        this.currentUser = null;
        await this.saveSession();
    }
    
    async getCurrentUser(): Promise<User | null> {
        await this.initPromise;
        return this.currentUser;
    }
    
    async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
        await this.initPromise;
        await new Promise(res => setTimeout(res, FAKE_DELAY));
        if (userId === this.currentUser?.id) {
            this.currentUser.forcePasswordChange = false;
            await this.saveSession();
            const userInDb = this.users.find(u => u.id === userId);
            if (userInDb) {
                userInDb.forcePasswordChange = false;
                await this.saveUsers();
            }
            await this.logAction('CHANGE_PASSWORD', `User ${this.currentUser.username} changed their password.`);
            return;
        }
        throw new Error('Could not change password.');
    }

    // --- Data Fetching ---
    async getFullData(): Promise<{data: NationalData, users: User[], notifications: Notification[], auditLogs: AuditLog[]}> {
        await this.initPromise;
        await new Promise(res => setTimeout(res, FAKE_DELAY / 2));
        return {
            data: JSON.parse(JSON.stringify(this.data)),
            users: JSON.parse(JSON.stringify(this.users)),
            notifications: JSON.parse(JSON.stringify(this.notifications)),
            auditLogs: JSON.parse(JSON.stringify(this.auditLogs)),
        };
    }
    
    // --- User Management ---
    async addUser(userData: Omit<User, 'id'>): Promise<User> {
        await this.initPromise;
        const newUser: User = { ...userData, id: this.generateId('user') };
        this.users.push(newUser);
        await this.saveUsers();
        await this.logAction('ADD_USER', `Created user ${newUser.username}.`);
        return newUser;
    }

    async updateUser(userData: User): Promise<User> {
        await this.initPromise;
        const index = this.users.findIndex(u => u.id === userData.id);
        if (index > -1) {
            this.users[index] = { ...this.users[index], ...userData };
            await this.saveUsers();
            await this.logAction('UPDATE_USER', `Updated user ${userData.username}.`);
            return this.users[index];
        }
        throw new Error('User not found');
    }

    async deleteUser(userId: string): Promise<void> {
        await this.initPromise;
        const userToDelete = this.users.find(u => u.id === userId);
        this.users = this.users.filter(u => u.id !== userId);
        await this.saveUsers();
        if (userToDelete) {
             await this.logAction('DELETE_USER', `Deleted user ${userToDelete.username}.`);
        }
    }
    
    // --- Generic Entity Modifiers ---
    private async modifyChurchData<T>(churchId: string, modification: (church: Church) => T): Promise<T> {
        await this.initPromise;
        const church = this.data?.churches[churchId];
        if (!church) throw new Error('Church not found');
        const result = modification(church);
        await this.saveData();
        return result;
    }
    
    // --- Worship Service ---
    async addWorshipService(churchId: string, serviceData: NewWorshipService, offlineId?: string): Promise<WorshipService> {
        const newService = await this.modifyChurchData(churchId, (church) => {
            const id = this.generateId('ws');
            // If it's a synced offline item, replace the temp ID with the real one.
            if(offlineId) {
                const existing = church.worshipServices.find(s => s.id === offlineId);
                if (existing) {
                    existing.id = id;
                    existing.status = 'pending';
                    return existing;
                }
            }
            const service: WorshipService = { ...serviceData, id, status: 'pending' };
            church.worshipServices.push(service);
            return service;
        });
        await this.logAction('ADD_REPORT', `Added worship service for ${this.data?.churches[churchId].name} on ${newService.date}.`);
        await this.createNotification(`Nouveau rapport de culte soumis par ${this.data?.churches[churchId].name}.`);
        return newService;
    }

    async updateWorshipService(churchId: string, serviceData: WorshipService): Promise<WorshipService> {
        const updated = await this.modifyChurchData(churchId, (church) => {
            const index = church.worshipServices.findIndex(s => s.id === serviceData.id);
            if (index > -1) {
                church.worshipServices[index] = { ...church.worshipServices[index], ...serviceData, status: 'pending' };
                return church.worshipServices[index];
            }
            throw new Error('Worship service not found');
        });
        await this.logAction('UPDATE_REPORT', `Updated report for ${this.data?.churches[churchId].name} from ${updated.date}.`);
        await this.createNotification(`Rapport de culte de ${this.data?.churches[churchId].name} mis à jour.`);
        return updated;
    }

    async deleteWorshipService(churchId: string, serviceId: string): Promise<void> {
        await this.modifyChurchData(churchId, (church) => {
            church.worshipServices = church.worshipServices.filter(s => s.id !== serviceId);
        });
        await this.logAction('DELETE_REPORT', `Deleted report from ${this.data?.churches[churchId].name} (ID: ${serviceId}).`);
    }

    async validateWorshipService(churchId: string, serviceId: string): Promise<void> {
        const service = await this.modifyChurchData(churchId, (church) => {
            const srv = church.worshipServices.find(s => s.id === serviceId);
            if (srv) srv.status = 'validated';
            return srv;
        });
        if (service) await this.logAction('VALIDATE_REPORT', `Validated report for ${this.data?.churches[churchId].name} from ${service.date}.`);
    }
    
    async rejectWorshipService(churchId: string, serviceId: string, reason: string): Promise<void> {
        const service = await this.modifyChurchData(churchId, (church) => {
            const srv = church.worshipServices.find(s => s.id === serviceId);
            if (srv) {
                srv.status = 'rejected';
                srv.rejectionReason = reason;
            }
            return srv;
        });
        if (service) await this.logAction('REJECT_REPORT', `Rejected report for ${this.data?.churches[churchId].name} from ${service.date}. Reason: ${reason}`);
    }

    // --- Baptized Member ---
    async addBaptizedMember(churchId: string, memberData: NewBaptizedMember, offlineId?: string): Promise<BaptizedMember> {
        const newMember = await this.modifyChurchData(churchId, (church) => {
             const id = this.generateId('bm');
             if(offlineId) {
                const existing = church.baptizedMembers.find(m => m.id === offlineId);
                if (existing) {
                    existing.id = id;
                    existing.status = undefined;
                    return existing;
                }
            }
            const member: BaptizedMember = { ...memberData, id };
            church.baptizedMembers.push(member);
            return member;
        });
        await this.logAction('ADD_MEMBER', `Added member ${newMember.fullName} to ${this.data?.churches[churchId].name}.`);
        return newMember;
    }

    async updateBaptizedMember(churchId: string, memberData: BaptizedMember): Promise<BaptizedMember> {
        return this.modifyChurchData(churchId, (church) => {
            const index = church.baptizedMembers.findIndex(m => m.id === memberData.id);
            if (index > -1) {
                church.baptizedMembers[index] = memberData;
                this.logAction('UPDATE_MEMBER', `Updated member ${memberData.fullName} in ${church.name}.`);
                return church.baptizedMembers[index];
            }
            throw new Error('Member not found');
        });
    }

    async deleteBaptizedMember(churchId: string, memberId: string): Promise<void> {
        await this.modifyChurchData(churchId, (church) => {
            const member = church.baptizedMembers.find(m => m.id === memberId);
            church.baptizedMembers = church.baptizedMembers.filter(m => m.id !== memberId);
            if(member) this.logAction('DELETE_MEMBER', `Deleted member ${member.fullName} from ${church.name}.`);
        });
    }
    
    // ... ChurchActivity ...
    async addChurchActivity(churchId: string, activityData: NewChurchActivity, offlineId?: string): Promise<ChurchActivity> {
        return this.modifyChurchData(churchId, (church) => {
            const id = this.generateId('ca');
            if(offlineId) {
                const existing = church.activities.find(a => a.id === offlineId);
                if (existing) {
                    existing.id = id;
                    existing.status = undefined;
                    return existing;
                }
            }
            const newActivity: ChurchActivity = { ...activityData, id };
            church.activities.push(newActivity);
            this.logAction('ADD_CHURCH_ACTIVITY', `Added activity "${newActivity.title}" to ${church.name}.`);
            return newActivity;
        });
    }

    async updateChurchActivity(churchId: string, activityData: ChurchActivity): Promise<ChurchActivity> {
        return this.modifyChurchData(churchId, (church) => {
            const index = church.activities.findIndex(a => a.id === activityData.id);
            if (index > -1) {
                church.activities[index] = activityData;
                this.logAction('UPDATE_CHURCH_ACTIVITY', `Updated activity "${activityData.title}" in ${church.name}.`);
                return church.activities[index];
            }
            throw new Error('Activity not found');
        });
    }
    
    async deleteChurchActivity(churchId: string, activityId: string): Promise<void> {
        await this.modifyChurchData(churchId, (church) => {
            const activity = church.activities.find(a => a.id === activityId);
            church.activities = church.activities.filter(a => a.id !== activityId);
            if(activity) this.logAction('DELETE_CHURCH_ACTIVITY', `Deleted activity "${activity.title}" from ${church.name}.`);
        });
    }

    // --- Announcements ---
    async addAnnouncement(churchId: string, announcementData: NewAnnouncement, offlineId?: string): Promise<Announcement> {
        if (!this.currentUser) throw new Error("Authentication required");
        return this.modifyChurchData(churchId, (church) => {
            const now = new Date().toISOString();
            const id = this.generateId('ann');

            if (offlineId) {
                const existing = church.announcements.find(a => a.id === offlineId);
                if (existing) {
                    existing.id = id;
                    existing.status = undefined;
                    existing.createdAt = now; // Update timestamp on sync
                    existing.updatedAt = now;
                    return existing;
                }
            }

            const newAnnouncement: Announcement = {
                ...announcementData,
                id,
                authorId: this.currentUser!.id,
                authorName: this.currentUser!.username,
                createdAt: now,
                updatedAt: now,
            };
            church.announcements.push(newAnnouncement);
            this.logAction('ADD_ANNOUNCEMENT', `Added announcement "${newAnnouncement.title}" to ${church.name}.`);
            return newAnnouncement;
        });
    }

    async updateAnnouncement(churchId: string, announcementData: Announcement): Promise<Announcement> {
        return this.modifyChurchData(churchId, (church) => {
            const index = church.announcements.findIndex(a => a.id === announcementData.id);
            if (index > -1) {
                church.announcements[index] = {
                    ...church.announcements[index],
                    ...announcementData,
                    updatedAt: new Date().toISOString(),
                };
                this.logAction('UPDATE_ANNOUNCEMENT', `Updated announcement "${announcementData.title}" in ${church.name}.`);
                return church.announcements[index];
            }
            throw new Error('Announcement not found');
        });
    }

    async deleteAnnouncement(churchId: string, announcementId: string): Promise<void> {
        await this.modifyChurchData(churchId, (church) => {
            const announcement = church.announcements.find(a => a.id === announcementId);
            church.announcements = church.announcements.filter(a => a.id !== announcementId);
            if(announcement) this.logAction('DELETE_ANNOUNCEMENT', `Deleted announcement "${announcement.title}" from ${church.name}.`);
        });
    }
    
    // ... BureauMember, BureauActivity ...
    private getBureauEntity(entityType: DataEntityType, entityId: string | null) {
        if (entityType === 'national') return this.data;
        if (entityType === 'region' && entityId) return this.data?.regions[entityId];
        if (entityType === 'church' && entityId) return this.data?.churches[entityId];
        throw new Error('Invalid entity for bureau operation');
    }

    async addBureauMember(entityType: DataEntityType, entityId: string | null, memberData: NewBureauMember): Promise<BureauMember> {
        await this.initPromise;
        const entity = this.getBureauEntity(entityType, entityId);
        if (!entity) throw new Error("Entity not found");
        const newMember: BureauMember = { ...memberData, id: this.generateId('bm') };
        entity.bureau.push(newMember);
        await this.saveData();
        await this.logAction('ADD_BUREAU_MEMBER', `Added bureau member ${newMember.name} to ${entityType} ${entityId || ''}.`);
        return newMember;
    }

    async updateBureauMember(entityType: DataEntityType, entityId: string | null, memberData: BureauMember): Promise<BureauMember> {
        await this.initPromise;
        const entity = this.getBureauEntity(entityType, entityId);
        if (!entity) throw new Error("Entity not found");
        const index = entity.bureau.findIndex(m => m.id === memberData.id);
        if (index > -1) {
            entity.bureau[index] = memberData;
            await this.saveData();
            await this.logAction('UPDATE_BUREAU_MEMBER', `Updated bureau member ${memberData.name} in ${entityType} ${entityId || ''}.`);
            return entity.bureau[index];
        }
        throw new Error('Bureau member not found');
    }

    async deleteBureauMember(entityType: DataEntityType, entityId: string | null, memberId: string): Promise<void> {
        await this.initPromise;
        const entity = this.getBureauEntity(entityType, entityId);
        if (!entity) throw new Error("Entity not found");
        entity.bureau = entity.bureau.filter(m => m.id !== memberId);
        await this.saveData();
        await this.logAction('DELETE_BUREAU_MEMBER', `Deleted bureau member (ID: ${memberId}) from ${entityType} ${entityId || ''}.`);
    }

    async addBureauActivity(entityType: DataEntityType, entityId: string | null, activityData: NewBureauActivity): Promise<BureauActivity> {
        await this.initPromise;
        const entity = this.getBureauEntity(entityType, entityId);
        if (!entity || !('activities' in entity)) throw new Error('Entity does not support bureau activities');
        const newActivity: BureauActivity = { ...activityData, id: this.generateId('ba') };
        (entity as any).activities.push(newActivity);
        await this.saveData();
        await this.logAction('ADD_BUREAU_ACTIVITY', `Added bureau activity "${newActivity.title}" to ${entityType} ${entityId || ''}.`);
        return newActivity;
    }

    async updateBureauActivity(entityType: DataEntityType, entityId: string | null, activityData: BureauActivity): Promise<BureauActivity> {
        await this.initPromise;
        const entity = this.getBureauEntity(entityType, entityId);
        if (!entity || !('activities' in entity)) throw new Error('Entity does not support bureau activities');
        const activities = (entity as any).activities as BureauActivity[];
        const index = activities.findIndex(a => a.id === activityData.id);
        if (index > -1) {
            activities[index] = activityData;
            await this.saveData();
            await this.logAction('UPDATE_BUREAU_ACTIVITY', `Updated bureau activity "${activityData.title}" in ${entityType} ${entityId || ''}.`);
            return activities[index];
        }
        throw new Error('Bureau activity not found');
    }

    async deleteBureauActivity(entityType: DataEntityType, entityId: string | null, activityId: string): Promise<void> {
        await this.initPromise;
        const entity = this.getBureauEntity(entityType, entityId);
        if (!entity || !('activities' in entity)) throw new Error('Entity does not support bureau activities');
        (entity as any).activities = (entity as any).activities.filter((a: BureauActivity) => a.id !== activityId);
        await this.saveData();
        await this.logAction('DELETE_BUREAU_ACTIVITY', `Deleted bureau activity (ID: ${activityId}) from ${entityType} ${entityId || ''}.`);
    }

    // --- Notifications ---
    async markNotificationAsRead(id: number): Promise<void> {
        await this.initPromise;
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            await this.saveNotifications();
        }
    }
    async markAllNotificationsAsRead(): Promise<void> {
        await this.initPromise;
        this.notifications.forEach(n => n.read = true);
        await this.saveNotifications();
    }
    
    // --- Offline Queue ---
    async getOfflineQueue(): Promise<OfflineQueueItem[]> {
        return db.offlineQueue.toArray();
    }

    async addWorshipServiceOffline(churchId: string, data: NewWorshipService, tempId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'ADD_WORSHIP_SERVICE', payload: { churchId, ...data, offlineId: tempId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async updateWorshipServiceOffline(churchId: string, data: WorshipService): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'UPDATE_WORSHIP_SERVICE', payload: { churchId, ...data }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async deleteWorshipServiceOffline(churchId: string, serviceId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'DELETE_WORSHIP_SERVICE', payload: { churchId, serviceId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }

    async addBaptizedMemberOffline(churchId: string, data: NewBaptizedMember, tempId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'ADD_BAPTIZED_MEMBER', payload: { churchId, ...data, offlineId: tempId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async updateBaptizedMemberOffline(churchId: string, data: BaptizedMember): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'UPDATE_BAPTIZED_MEMBER', payload: { churchId, ...data }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async deleteBaptizedMemberOffline(churchId: string, memberId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'DELETE_BAPTIZED_MEMBER', payload: { churchId, memberId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    
    async addChurchActivityOffline(churchId: string, data: NewChurchActivity, tempId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'ADD_CHURCH_ACTIVITY', payload: { churchId, ...data, offlineId: tempId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async updateChurchActivityOffline(churchId: string, data: ChurchActivity): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'UPDATE_CHURCH_ACTIVITY', payload: { churchId, ...data }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async deleteChurchActivityOffline(churchId: string, activityId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'DELETE_CHURCH_ACTIVITY', payload: { churchId, activityId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    
    async addAnnouncementOffline(churchId: string, data: NewAnnouncement, tempId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'ADD_ANNOUNCEMENT', payload: { churchId, ...data, offlineId: tempId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async updateAnnouncementOffline(churchId: string, data: Announcement): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'UPDATE_ANNOUNCEMENT', payload: { churchId, ...data }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }
    async deleteAnnouncementOffline(churchId: string, announcementId: string): Promise<void> {
        const item: OfflineQueueItem = { id: this.generateId('oq'), type: 'DELETE_ANNOUNCEMENT', payload: { churchId, announcementId }, timestamp: Date.now() };
        await db.offlineQueue.add(item);
    }

    async syncOfflineQueueForChurch(churchId: string): Promise<{ successCount: number, totalCount: number }> {
        const itemsToSync = await db.offlineQueue.where('payload.churchId').equals(churchId).toArray();
        if (itemsToSync.length === 0) return { successCount: 0, totalCount: 0 };
        
        let successCount = 0;
        const failedItems: string[] = [];

        for (const item of itemsToSync) {
            try {
                const { payload } = item;
                switch (item.type) {
                    // CREATE
                    case 'ADD_WORSHIP_SERVICE':
                        await this.addWorshipService(payload.churchId, payload, payload.offlineId);
                        break;
                    case 'ADD_BAPTIZED_MEMBER':
                         await this.addBaptizedMember(payload.churchId, payload, payload.offlineId);
                        break;
                    case 'ADD_CHURCH_ACTIVITY':
                         await this.addChurchActivity(payload.churchId, payload, payload.offlineId);
                        break;
                    case 'ADD_ANNOUNCEMENT':
                        await this.addAnnouncement(payload.churchId, payload, payload.offlineId);
                        break;
                    // UPDATE
                    case 'UPDATE_WORSHIP_SERVICE':
                        await this.updateWorshipService(payload.churchId, payload);
                        break;
                    case 'UPDATE_BAPTIZED_MEMBER':
                        await this.updateBaptizedMember(payload.churchId, payload);
                        break;
                    case 'UPDATE_CHURCH_ACTIVITY':
                        await this.updateChurchActivity(payload.churchId, payload);
                        break;
                    case 'UPDATE_ANNOUNCEMENT':
                        await this.updateAnnouncement(payload.churchId, payload);
                        break;
                    // DELETE
                    case 'DELETE_WORSHIP_SERVICE':
                        await this.deleteWorshipService(payload.churchId, payload.serviceId);
                        break;
                    case 'DELETE_BAPTIZED_MEMBER':
                        await this.deleteBaptizedMember(payload.churchId, payload.memberId);
                        break;
                    case 'DELETE_CHURCH_ACTIVITY':
                        await this.deleteChurchActivity(payload.churchId, payload.activityId);
                        break;
                    case 'DELETE_ANNOUNCEMENT':
                        await this.deleteAnnouncement(payload.churchId, payload.announcementId);
                        break;
                }
                successCount++;
            } catch (error) {
                console.error(`Failed to sync item ${item.id}`, error);
                failedItems.push(item.id);
            }
        }
        
        const syncedIds = itemsToSync.map(i => i.id).filter(id => !failedItems.includes(id));
        if (syncedIds.length > 0) {
            await db.offlineQueue.bulkDelete(syncedIds);
        }

        return { successCount, totalCount: itemsToSync.length };
    }
}

export default DataService;