// src/components/admin/AdminHeader.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase-config';
import NewEntryButton from './NewEntryButton';

export const AdminHeader: React.FC = () => {
    const { currentUser } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        signOut(auth);
    };

    // Cierra el menú de usuario si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
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

    const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
            isActive
                ? 'bg-green-700 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    const handleLogoutAndCloseMenu = () => {
        handleLogout();
        setIsMobileMenuOpen(false);
    };

    return (
        <header className="bg-gray-800 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Lado Izquierdo: Logo y Navegación de Escritorio */}
                    <div className="flex items-center">
                        <Link to="/portal/admin" className="flex-shrink-0 flex items-center">
                            <img className="h-8 w-auto" src="/assets/images/invercoorp_logo.png" alt="INVERCOP Logo" />
                            <span className="ml-3 text-xl font-bold hidden sm:block">INVERCOP</span>
                        </Link>
                        <nav className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                                <NavLink to="/portal/admin/management" className={navLinkClass}>Préstamos</NavLink>
                                <NavLink to="/portal/admin/savings" className={navLinkClass}>Planes de Ahorro</NavLink>
                                <NavLink to="/portal/admin/clients" className={navLinkClass}>Clientes</NavLink>
                                <NavLink to="/portal/admin/reports" className={navLinkClass}>Reportes</NavLink>
                            </div>
                        </nav>
                    </div>

                    {/* Lado Derecho: Controles */}
                    <div className="flex items-center">
                        <div className="hidden md:block">
                            <NewEntryButton />
                        </div>
                        {/* Menú de Usuario */}
                        <div className="relative ml-3" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                                id="user-menu-button"
                                aria-expanded={isUserMenuOpen}
                                aria-haspopup="true"
                            >
                                <span className="sr-only">Abrir menú de usuario</span>
                                <span className="mr-2 hidden sm:inline">{currentUser?.email}</span>
                                <i className="fas fa-user-circle fa-2x"></i>
                            </button>
                            {isUserMenuOpen && (
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
                        {/* Botón de Menú Móvil */}
                        <div className="ml-2 flex items-center md:hidden">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                                aria-controls="mobile-menu"
                                aria-expanded={isMobileMenuOpen}
                            >
                                <span className="sr-only">Abrir menú principal</span>
                                {isMobileMenuOpen ? (
                                    <i className="fas fa-times fa-lg"></i> // Icono de 'X'
                                ) : (
                                    <i className="fas fa-bars fa-lg"></i> // Icono de hamburguesa
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel de Menú Móvil */}
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden border-t border-gray-700`} id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <NavLink to="/portal/admin/management" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Préstamos</NavLink>
                    <NavLink to="/portal/admin/savings" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Planes de Ahorro</NavLink>
                    <NavLink to="/portal/admin/clients" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Clientes</NavLink>
                    <NavLink to="/portal/admin/services" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Servicios</NavLink>
                    <NavLink to="/portal/admin/reports" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>Reportes</NavLink>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-700">
                    <div className="px-5 mb-3">
                        <NewEntryButton />
                    </div>
                    <button
                        onClick={handleLogoutAndCloseMenu}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </header>
    );
};