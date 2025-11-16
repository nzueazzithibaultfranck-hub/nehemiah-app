import { User } from '../types';
import { Permission } from '../permissions';

export const hasPermission = (user: User | null, permission: Permission): boolean => {
    if (!user || !user.permissions) {
        return false;
    }
    return user.permissions.includes(permission);
};