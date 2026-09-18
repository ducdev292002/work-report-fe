// Where each role lands after login / when redirected away from a page it
// can't access. Kept in one place since three pages need it.
export function getHomePath(role) {
  if (role === 'admin') return '/admin/overview';
  if (role === 'manager') return '/manager/overview';
  return '/reports';
}
