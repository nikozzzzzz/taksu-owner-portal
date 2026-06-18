'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/cn';

interface PortalHeaderProps {
  ownerName: string;
  villaName?: string;
  onMenuToggle?: () => void;
}

export function PortalHeader({ ownerName, villaName, onMenuToggle }: PortalHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = ownerName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-taksu-cream/95 px-4 backdrop-blur-sm md:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="mr-4 rounded-md p-2 text-taksu-sage hover:bg-taksu-parchment hover:text-taksu-forest lg:hidden"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Villa name (breadcrumb style) */}
      <div className="flex-1">
        {villaName && (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-taksu-sage sm:block">Your villa</span>
            <span className="hidden text-xs text-taksu-sage/50 sm:block">/</span>
            <span className="text-sm font-medium text-taksu-forest">{villaName}</span>
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications button */}
        <button
          className="relative rounded-md p-2 text-taksu-sage hover:bg-taksu-parchment hover:text-taksu-forest"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {/* Notification dot */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-taksu-terracotta" />
        </button>

        <Separator orientation="vertical" className="h-6" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-taksu-parchment',
              userMenuOpen && 'bg-taksu-parchment'
            )}
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-taksu-jungle text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="hidden font-medium text-taksu-forest sm:block">{ownerName.split(' ')[0]}</span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-taksu-sage transition-transform',
                userMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-white shadow-card-lg">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-taksu-forest">{ownerName}</p>
                  <p className="text-xs text-taksu-sage">Villa Owner</p>
                </div>
                <Separator />
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-taksu-sage hover:bg-taksu-parchment hover:text-taksu-forest"
                  >
                    <User className="h-4 w-4" />
                    Profile & Settings
                  </Link>
                </div>
                <Separator />
                <div className="py-1">
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-taksu-terracotta hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
