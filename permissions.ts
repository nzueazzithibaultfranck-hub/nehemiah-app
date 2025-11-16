// This file is now the single source of truth for permissions to avoid circular dependencies.

export const PERMISSIONS = {
    MANAGE_USERS: 'manage_users',
    VALIDATE_REPORTS: 'validate_reports',
    VIEW_FINANCES: 'view_finances',
    MANAGE_REPORTS: 'manage_reports',
    MANAGE_MEMBERS: 'manage_members',
    MANAGE_ACTIVITIES: 'manage_activities',
    MANAGE_BUREAU: 'manage_bureau',
    MANAGE_ANNOUNCEMENTS: 'manage_announcements',
} as const;

// The Permission type is now derived directly from the constant object above.
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

export const ROLES: { [key: string]: Role } = {
    'national_admin': {
        id: 'national_admin',
        name: 'Administrateur National',
        permissions: [
            PERMISSIONS.MANAGE_USERS,
            PERMISSIONS.VALIDATE_REPORTS,
            PERMISSIONS.VIEW_FINANCES,
            PERMISSIONS.MANAGE_BUREAU,
            PERMISSIONS.MANAGE_ACTIVITIES,
        ],
    },
    'region_admin': {
        id: 'region_admin',
        name: 'Administrateur Régional',
        permissions: [
            PERMISSIONS.VALIDATE_REPORTS,
            PERMISSIONS.VIEW_FINANCES,
            PERMISSIONS.MANAGE_BUREAU,
            PERMISSIONS.MANAGE_ACTIVITIES,
        ],
    },
    'church_admin': {
        id: 'church_admin',
        name: 'Administrateur d\'Église',
        permissions: [
            PERMISSIONS.MANAGE_REPORTS,
            PERMISSIONS.MANAGE_MEMBERS,
            PERMISSIONS.MANAGE_ACTIVITIES,
            PERMISSIONS.MANAGE_BUREAU,
            PERMISSIONS.VIEW_FINANCES,
            PERMISSIONS.MANAGE_ANNOUNCEMENTS,
        ],
    },
};