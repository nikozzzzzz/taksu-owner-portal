'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BarChart3,
  Droplets,
  Receipt,
  MessageSquare,
  FolderOpen,
  Settings,
  ShieldCheck,
  Building2,
  Waves,
  Calculator,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/statements',
    label: 'Statements',
    icon: FileText,
  },
  {
    href: '/calendar',
    label: 'Booking Calendar',
    icon: Calendar,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
  {
    href: '/pool-position',
    label: 'Pool Position',
    icon: Droplets,
  },
  {
    href: '/tax-documents',
    label: 'Tax Documents',
    icon: Receipt,
  },
  {
    href: '/requests',
    label: 'Requests',
    icon: MessageSquare,
  },
  {
    href: '/documents',
    label: 'Documents',
    icon: FolderOpen,
  },
];

interface PortalSidebarProps {
  role?: string;
  onClose?: () => void;
}

export function PortalSidebar({ role = 'guest', onClose }: PortalSidebarProps) {
  const pathname = usePathname();

  // Filter nav items based on role
  const filteredNavItems = navItems.filter((item) => {
    if (role === 'guest') {
      return ['/dashboard', '/requests'].includes(item.href);
    }
    if (role === 'accountant') {
      return ['/dashboard', '/statements', '/analytics', '/tax-documents'].includes(item.href);
    }
    // Investor, Admin, Root, Service see everything for now
    return true;
  });

  const isAdmin = ['admin', 'root'].includes(role);

  return (
    <aside className="flex h-full flex-col bg-taksu-forest text-white">
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          {/* Logo placeholder — replace with actual SVG */}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-taksu-jungle">
            <span className="text-xs font-bold text-white">TL</span>
          </div>
          <div>
            <p className="font-serif text-base font-semibold leading-none text-white">Taksu Living</p>
            <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">Owner Portal</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-0.5">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-taksu-bamboo' : 'text-white/40'
                    )}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-taksu-terracotta px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Settings separator */}
        <div className="my-4 border-t border-white/10" />

        <ul className="space-y-0.5">
          {isAdmin && (
            <>
              <li>
                <Link
                  href="/admin/users"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    pathname.startsWith('/admin/users')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      'h-4 w-4 shrink-0',
                      pathname.startsWith('/admin/users') ? 'text-taksu-bamboo' : 'text-white/40'
                    )}
                  />
                  <span>Admin: Users</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/villas"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    pathname.startsWith('/admin/villas')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Building2
                    className={cn(
                      'h-4 w-4 shrink-0',
                      pathname.startsWith('/admin/villas') ? 'text-taksu-bamboo' : 'text-white/40'
                    )}
                  />
                  <span>Admin: Villas</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/pools"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    pathname.startsWith('/admin/pools')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Waves
                    className={cn(
                      'h-4 w-4 shrink-0',
                      pathname.startsWith('/admin/pools') ? 'text-taksu-bamboo' : 'text-white/40'
                    )}
                  />
                  <span>Admin: Pools</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/formulas"
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    pathname.startsWith('/admin/formulas')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Calculator
                    className={cn(
                      'h-4 w-4 shrink-0',
                      pathname.startsWith('/admin/formulas') ? 'text-taksu-bamboo' : 'text-white/40'
                    )}
                  />
                  <span>Admin: Formulas</span>
                </Link>
              </li>
            </>
          )}
          <li>
            <Link
              href="/settings"
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150',
                pathname.startsWith('/settings')
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )}
            >
              <Settings
                className={cn(
                  'h-4 w-4 shrink-0',
                  pathname.startsWith('/settings') ? 'text-taksu-bamboo' : 'text-white/40'
                )}
              />
              <span>Settings</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-center text-[10px] text-white/30">
          © 2026 PT Taksu Living Management
        </p>
      </div>
    </aside>
  );
}
