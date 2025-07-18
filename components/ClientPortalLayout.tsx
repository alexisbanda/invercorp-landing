// components/ClientPortalLayout.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { Toaster, toast } from 'react-hot-toast';
import { getLoansForCurrentUser } from '../services/loanService';
import { Loan } from '../types';

const ClientHeader: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('Has cerrado sesión.');
            navigate('/portal/login');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            toast.error('No se pudo cerrar la sesión.');
        }
    };

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`;

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center gap-10">
                        <Link to="/portal/dashboard" className="text-xl font-bold text-gray-800 flex items-center">
                            <img src="/assets/images/invercoorp_logo.png" alt="INVERCOP Logo" className="h-8 w-auto mr-3"/>
                            <span className="font-light text-gray-600">Portal de Cliente</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-4">
                            <NavLink to="/portal/dashboard" className={navLinkClass}>Dashboard</NavLink>
                            <NavLink to="/portal/ahorros" className={navLinkClass}>Ahorros</NavLink>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                         <span className="text-sm text-gray-600 hidden sm:inline">
                            {currentUser?.displayName || currentUser?.email}
                        </span>
                        <button 
                            onClick={handleLogout} 
                            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export const ClientPortalLayout: React.FC = () => {
    const { currentUser } = useAuth();
    const [loans, setLoans] = useState<Loan[]>([]);

    useEffect(() => {
        const fetchLoanData = async () => {
            if (currentUser) {
                try {
                    const userLoans = await getLoansForCurrentUser(currentUser.uid);
                    setLoans(userLoans);
                } catch (err) {
                    console.error("Error al obtener los préstamos:", err);
                    toast.error('Error al cargar los datos de los préstamos.');
                }
            }
        };

        fetchLoanData();
    }, [currentUser]);

    const totalPendingBalance = useMemo(() => {
        return loans.reduce((total, loan) => {
            const pendingAmount = loan.installments
                .filter(inst => inst.status === 'POR VENCER' || inst.status === 'VENCIDO')
                .reduce((sum, inst) => sum + inst.amount, 0);
            return total + pendingAmount;
        }, 0);
    }, [loans]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-center" reverseOrder={false} />
            <ClientHeader />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8 p-6 bg-white rounded-lg shadow grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Bienvenido de nuevo,</h2>
                        <p className="text-lg text-gray-600 mt-1">{currentUser?.displayName || currentUser?.email}</p>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg flex flex-col justify-center">
                        <p className="text-sm font-medium text-yellow-800">Saldo Pendiente Total</p>
                        <p className="text-2xl font-bold text-yellow-900">
                            {totalPendingBalance.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
                        </p>
                    </div>
                    <Link to="/portal/ahorros" className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg flex flex-col justify-center hover:bg-blue-100 transition-colors text-center">
                        <p className="text-sm font-medium text-blue-800">Ahorro Programado</p>
                        <p className="text-xl font-bold text-blue-900">
                           Gestionar Ahorros
                        </p>
                    </Link>
                </div>
                <Outlet />
            </main>
        </div>
    );
};
