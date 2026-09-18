import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, FolderTree, Users, FileText, ClipboardList, CalendarClock, Activity, Flag, Pencil, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

// "Tài liệu" is temporarily hidden from navigation (feature paused, not
// removed — routes still work, just not linked) while the Timeline view
// takes its place as the project-level overview.
const ADMIN_LINKS = [
  { to: '/admin/overview', label: 'Tổng quan', icon: LayoutGrid },
  { to: '/admin', label: 'Cơ cấu tổ chức', end: true, icon: FolderTree },
  { to: '/admin/employees', label: 'Nhân viên', icon: Users },
  { to: '/admin/timeline', label: 'Timeline', icon: Activity },
  { to: '/admin/documents', label: 'Tài liệu', icon: FileText, hidden: true },
  { to: '/admin/reports', label: 'Báo cáo', icon: ClipboardList },
];

// A manager gets the same scoped management tools as admin (under
// /manager/*) PLUS their own personal reporting tabs (shared paths with
// employee) — they manage their department but also log work like anyone.
const MANAGER_LINKS = [
  { to: '/manager/overview', label: 'Tổng quan', icon: LayoutGrid },
  { to: '/manager', label: 'Dự án của tôi', end: true, icon: FolderTree },
  { to: '/manager/employees', label: 'Nhân viên', icon: Users },
  { to: '/manager/timeline', label: 'Timeline', icon: Activity },
  { to: '/manager/reports', label: 'Báo cáo nhóm', icon: ClipboardList },
  { to: '/reports', label: 'Báo cáo của tôi', icon: Pencil },
  { to: '/plan', label: 'Kế hoạch của tôi', icon: CalendarClock },
];

const EMPLOYEE_LINKS = [
  { to: '/documents', label: 'Tài liệu được gửi', icon: FileText, hidden: true },
  { to: '/reports', label: 'Báo cáo hàng ngày', icon: ClipboardList },
  { to: '/plan', label: 'Kế hoạch ngày mai', icon: CalendarClock },
  { to: '/milestones', label: 'Timeline', icon: Flag },
];

const ROLE_LABEL = { admin: 'Quản trị viên', manager: 'Quản lý', employee: 'Nhân viên' };

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const links = user?.role === 'admin' ? ADMIN_LINKS : user?.role === 'manager' ? MANAGER_LINKS : EMPLOYEE_LINKS;

  async function handleLogout() {
    const ok = await confirm({ title: 'Đăng xuất', message: 'Đăng xuất khỏi hệ thống?' });
    if (!ok) return;
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              W
            </div>
            <span className="font-semibold text-gray-900 tracking-tight">Quản lý & Báo cáo công việc</span>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/profile" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold ring-2 ring-white group-hover:ring-brand-200 transition-all">
                {initials(user?.name) || '?'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-sm font-medium text-gray-800 group-hover:text-brand-600 transition-colors">{user?.name}</div>
                <div className="text-xs text-gray-400">{ROLE_LABEL[user?.role] || ''}</div>
              </div>
            </NavLink>
            <button onClick={handleLogout} title="Đăng xuất" className="btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut size={15} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {links.filter((link) => !link.hidden).map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={15} />
                    {link.label}
                    <span
                      className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full transition-all ${
                        isActive ? 'bg-brand-600' : 'bg-transparent'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
