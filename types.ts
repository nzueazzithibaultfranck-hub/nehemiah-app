import { Permission } from './permissions';

// --- Core Data Structures ---

export interface User {
    id: string;
    username: string;
    password?: string; // Only used for creation/update, not stored long-term
    roleId: string;
    level: 'national' | 'region' | 'church';
    permissions: Permission[];
    regionId?: string;
    churchId?: string;
    forcePasswordChange?: boolean;
}

export interface NationalData {
    bureau: BureauMember[];
    activities: BureauActivity[];
    regions: { [id: string]: Region };
    churches: { [id: string]: Church };
}

export interface Region {
    id: string;
    name: string;
    churches: string[]; // Array of church IDs
    bureau: BureauMember[];
    activities: BureauActivity[];
}

export interface Church {
    id: string;
    name: string;
    regionId: string;
    worshipServices: WorshipService[];
    baptizedMembers: BaptizedMember[];
    activities: ChurchActivity[];
    bureau: BureauMember[];
    announcements: Announcement[];
}

// --- Component-specific Data Structures ---

export type DataEntityType = 'national' | 'region' | 'church';

export interface BureauMember {
    id: string;
    name: string;
    position: string;
    contact: string;
}
export type NewBureauMember = Omit<BureauMember, 'id'>;

export interface BureauActivity {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: string;
    description: string;
}
export type NewBureauActivity = Omit<BureauActivity, 'id'>;


export interface WorshipService {
    id: string;
    date: string; // YYYY-MM-DD
    speaker: string;
    president: string;
    attendance: {
        men: number;
        women: number;
        children: number;
    };
    offering: {
        tithes: number;
        regular: number;
        special: number;
    };
    status: 'pending' | 'validated' | 'rejected' | 'offline' | 'offline-modified';
    rejectionReason?: string;
}
export type NewWorshipService = Omit<WorshipService, 'id' | 'status' | 'rejectionReason'>;

export interface BaptizedMember {
    id: string;
    fullName: string;
    gender: 'male' | 'female' | 'unknown';
    dateOfBirth?: string; // YYYY-MM-DD
    dateOfBaptism?: string; // YYYY-MM-DD
    address?: string;
    phone: string;
    email: string;
    notes?: string;
    status?: 'offline' | 'offline-modified';
}
export type NewBaptizedMember = Omit<BaptizedMember, 'id' | 'status'>;

export interface ChurchActivity {
    id: string;
    title: string;
    date: string; // YYYY-MM-DD
    type: string;
    description: string;
    status?: 'offline' | 'offline-modified';
}
export type NewChurchActivity = Omit<ChurchActivity, 'id' | 'status'>;

export interface Announcement {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
    status?: 'offline' | 'offline-modified';
}
export type NewAnnouncement = Omit<Announcement, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'updatedAt' | 'status'>;


// --- UI & System Types ---

export interface Notification {
    id: number;
    message: string;
    read: boolean;
    timestamp: string;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    actorUsername: string;
    action: string;
    details: string;
}

// --- Offline Sync Types ---
export type OfflineActionType = 
    'ADD_WORSHIP_SERVICE' | 'UPDATE_WORSHIP_SERVICE' | 'DELETE_WORSHIP_SERVICE' |
    'ADD_BAPTIZED_MEMBER' | 'UPDATE_BAPTIZED_MEMBER' | 'DELETE_BAPTIZED_MEMBER' |
    'ADD_CHURCH_ACTIVITY' | 'UPDATE_CHURCH_ACTIVITY' | 'DELETE_CHURCH_ACTIVITY' |
    'ADD_ANNOUNCEMENT' | 'UPDATE_ANNOUNCEMENT' | 'DELETE_ANNOUNCEMENT';

export interface OfflineQueueItem {
    id: string; // unique ID for the queue item
    type: OfflineActionType;
    payload: any; // The data needed for the action
    timestamp: number;
}

// --- Global Search Types ---
export interface GlobalSearchResult {
    type: 'region' | 'church' | 'user';
    id: string;
    name: string;
    context: string; // e.g. "Région", "Église de la région X", "Utilisateur"
}