'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, Search, Map, LayoutDashboard, PlusCircle, Shield, ChevronDown, LocateFixed } from 'lucide-react';
import logo from '../../public/logo.png';

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('authToken');
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setNotifications(d.unreadCount || 0))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const avatar = user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}&backgroundColor=6366f1`;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border' : 'bg-white/90 backdrop-blur-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image src={logo} alt="MadadKart" width={160} height={48} priority className="h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/explore" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Search size={15} /> Explore
            </Link>
            <Link href="/nearby-projects" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <LocateFixed size={15} /> Nearby
            </Link>
            <Link href="/map" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <Map size={15} /> Map
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <Link href="/projects/create" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <PlusCircle size={15} /> Create
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors">
                <Shield size={15} /> Admin
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-accent transition-colors">
                  <Bell size={18} className="text-muted-foreground" />
                  {notifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notifications > 9 ? '9+' : notifications}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={dropRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
                    <img src={avatar} alt={user?.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-primary/20" />
                    <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={14} className={`text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-semibold truncate">{user?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href={`/profile/${user?._id}`} onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">Profile</Link>
                          <Link href="/profile/edit" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">Edit Profile</Link>
                          <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors">Dashboard</Link>
                          <div className="border-t border-border my-1" />
                          <button onClick={() => { setDropdownOpen(false); logout(); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors">Log in</Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">Sign up</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg hover:bg-accent">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-white">
            <div className="px-4 py-3 space-y-1">
              <Link href="/explore" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent">
                <Search size={16} /> Explore
              </Link>
              <Link href="/map" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent">
                <Map size={16} /> Map
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link href="/projects/create" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent">
                    <PlusCircle size={16} /> Create Project
                  </Link>
                  <Link href={`/profile/${user?._id}`} onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent">
                    Profile
                  </Link>
                  <button onClick={() => { setIsOpen(false); logout(); }} className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-accent">Log in</Link>
                  <Link href="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium bg-primary text-white text-center">Sign up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
