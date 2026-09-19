import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth.jsx';
import { Button } from './components/ui.jsx';

const NAV = [
  { to: '/', label: 'Overview', roles: ['ADMIN', 'MENTOR', 'STUDENT', 'GATE_SECURITY'] },
  { to: '/students', label: 'Students', roles: ['ADMIN'] },
  { to: '/hostels', label: 'Hostels', roles: ['ADMIN'] },
  { to: '/residencies', label: 'Residencies', roles: ['ADMIN'] },
  { to: '/mentors', label: 'Mentorship', roles: ['ADMIN', 'MENTOR'] },
  { to: '/leaves', label: 'Leave', roles: ['ADMIN', 'STUDENT', 'MENTOR'] },
  { to: '/gate', label: 'Gate desk', roles: ['ADMIN', 'GATE_SECURITY'] },
  { to: '/complaints', label: 'Complaints', roles: ['ADMIN', 'STUDENT', 'MENTOR'] },
  { to: '/notices', label: 'Notices', roles: ['ADMIN', 'STUDENT', 'MENTOR', 'GATE_SECURITY'] },
  { to: '/mess', label: 'Mess registry', roles: ['ADMIN', 'STUDENT', 'MENTOR'] },
  { to: '/reports', label: 'Reports', roles: ['ADMIN'] },
  { to: '/audit', label: 'Audit log', roles: ['ADMIN'] },
  { to: '/profile', label: 'My profile', roles: ['STUDENT', 'MENTOR'] },
];

export default function AppLayout() {
  const { user, institution, refresh } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api.post('/auth/logout');
    await refresh();
    navigate('/login');
  }

  const items = NAV.filter((item) => item.roles.includes(user.role));
  const primary = institution?.primaryColour || '#2563EB';

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[260px_1fr]">
      <aside
        className={`fixed inset-y-0 z-20 w-64 border-r border-line bg-card p-4 lg:static ${open ? 'block' : 'hidden lg:block'}`}
      >
        <div className="mb-8 flex items-center gap-3">
          {institution?.logoUrl ? (
            <img src={institution.logoUrl} alt={`${institution.shortName} logo`} className="h-10 w-10 rounded object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-sm font-bold text-white">UH</div>
          )}
          <div>
            <p className="text-sm font-semibold text-heading">UniHostel</p>
            <p className="text-xs">{institution?.shortName}</p>
          </div>
        </div>
        <nav className="space-y-1" aria-label="Main">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-50 font-semibold text-heading' : 'text-body hover:bg-slate-50'}`
              }
              style={({ isActive }) => (isActive ? { boxShadow: `inset 3px 0 0 ${primary}` } : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-line bg-card px-4 py-3">
          <button className="rounded-lg border border-line px-3 py-1 text-sm lg:hidden" onClick={() => setOpen((v) => !v)}>
            Menu
          </button>
          <p className="text-sm">
            {user.firstName} {user.lastName} · {user.role.replace('_', ' ')}
          </p>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
