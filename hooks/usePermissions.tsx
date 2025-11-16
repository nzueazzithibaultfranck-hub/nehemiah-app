import { useCallback } from 'react';
import { useAuth } from './useAuth';
// Fix: Correctly import ROLES and Permission type from the centralized permissions file.
import { ROLES, Permission } from '../permissions';

export const usePermissions = () => {
    const { user } = useAuth();

    const can = useCallback((permission: Permission): boolean => {
        if (!user || !user.roleId) return false;
        
        const role = ROLES[user.roleId];
        if (!role) return false;

        return role.permissions.includes(permission);
    }, [user]);

    return { user, can };
};