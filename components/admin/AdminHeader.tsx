// src/components/admin/AdminHeader.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase-config';
import NewEntryButton from './NewEntryButton';

export const AdminHeader: React.FC = () => {
    const { currentUser } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        signOut(auth);
    };

    // Cierra el menú si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-green-700 text-white'
                : 'text-gray-300 hover:bg-green-600 hover:text-white'
        }`;

    return (
        <header className="bg-gray-800 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/portal/admin" className="flex-shrink-0 flex items-center">
                            <img className="h-8 w-auto" src="/assets/images/invercoorp_logo.png" alt="INVERCOP Logo" />
                            <span className="ml-3 text-xl font-bold">INVERCOP</span>
                        </Link>
                        <nav className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                <NavLink to="/portal/admin/management" className={navLinkClass}>Gestión</NavLink>
                                <NavLink to="/portal/admin/reports" className={navLinkClass}>Reportes</NavLink>
                                <NavLink to="/portal/admin/pending-deposits" className={navLinkClass}>Depósitos</NavLink>
                            </div>
                        </nav>
                    </div>
                    <div className="flex items-center">
                        <NewEntryButton />
                        <div className="relative ml-4" ref={menuRef}>
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                            >
                                <span className="mr-2 hidden sm:inline">{currentUser?.email}</span>
                                <i className="fas fa-user-circle fa-2x"></i>
                            </button>
                            {isMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-20">
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};