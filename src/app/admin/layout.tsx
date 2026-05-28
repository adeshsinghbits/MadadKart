'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  LayoutDashboard, Users, FolderOpen,
  Heart, Shield, ChevronRight,
} from 'lucide-react';

const NAV = [
  { href: '/admin',          label: 'Overview',  icon: <LayoutDashboard size={16} />, exact: true },
  { href: '/admin/users',    label: 'Users',     icon: <Users size={16} /> },
  { href: '/admin/projects', label: 'Projects',  icon: <FolderOpen size={16} /> },
  { href: '/admin/donations',label: 'Donations', icon: <Heart size={16} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-muted/30 flex">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Shield size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Admin Panel</p>
                <p className="text-[10px] text-white/40">MadadKart</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {NAV.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                  }`}>
                  <span className={active ? 'text-white' : 'text-white/40'}>{item.icon}</span>
                  {item.label}
                  {active && <ChevronRight size={12} className="ml-auto text-white/40" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-white/10">
            <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">
              ← Back to site
            </Link>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
