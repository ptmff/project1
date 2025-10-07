export const Roles = {
MANAGER: 'manager',
ENGINEER: 'engineer',
OBSERVER: 'observer',
}


export function canAccess(user, allowedRoles = []) {
if (!user) return false
if (!allowedRoles || allowedRoles.length === 0) return true
return allowedRoles.includes(user.role)
}