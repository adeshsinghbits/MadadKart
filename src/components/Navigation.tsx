'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import logo from "../../public/logo.png"
import Image from 'next/image';

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
              <Image
                src={logo}
                alt="MadadKart Logo"
                width={200}
                height={60}
                priority
                className="group-hover:scale-105 transition-transform duration-300"
              />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/map"
              className="text-gray-700 hover:text-purple-600 font-medium transition"
            >
              Map
            </Link>
            {isAuthenticated && (
              <Link
                href="/projects/create"
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Create
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href={`/profile/${user?._id}`}
                  className="flex items-center space-x-2 text-gray-700 hover:text-purple-600"
                >
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{user?.name?.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/map" className="block px-4 py-2 text-gray-700 hover:bg-purple-50">
              Map
            </Link>
            {isAuthenticated && (
              <Link
                href="/projects/create"
                className="block px-4 py-2 text-gray-700 hover:bg-purple-50"
              >
                Create
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}