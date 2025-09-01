// components/ClientSavingsList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProgrammedSavingsForUser } from '../services/savingsService';
import { ProgrammedSaving } from '../types';

// Icono para la sección de ahorros
const SavingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

// Componente para una tarjeta de plan de ahorro individual
const SavingPlanCard: React.FC<{ plan: ProgrammedSaving }> = ({ plan }) => {
    const progressPercentage = plan.montoMeta > 0 ? (plan.saldoActual / plan.montoMeta) * 100 : 0;

    return (
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200/80 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg text-gray-800">{plan.nombrePlan}</h4>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${plan.estadoPlan === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {plan.estadoPlan}
                </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">ID: {plan.numeroCartola}</p>

            {/* Barra de Progreso */}
            <div className="mb-3">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-gray-600">Progreso</span>
                    <span className="text-sm font-bold text-blue-600">{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>${plan.saldoActual.toLocaleString('es-EC')}</span>
                    <span>${plan.montoMeta.toLocaleString('es-EC')}</span>
                </div>
            </div>

            <div className="mt-5 text-right">
                <Link 
                    to={`/portal/ahorros/${plan.numeroCartola}`}
                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-md transition-colors duration-200"
                >
                    Ver Detalles
                </Link>
            </div>
        </div>
    );
};

export const ClientSavingsList: React.FC = () => {
    const { currentUser } = useAuth();
    const [savings, setSavings] = useState<ProgrammedSaving[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSavings = async () => {
            if (currentUser) {
                try {
                    setLoading(true);
                    const userSavings = await getProgrammedSavingsForUser(currentUser.uid);
                    setSavings(userSavings);
                } catch (err) {
                    console.error("Error al obtener los planes de ahorro:", err);
                    setError("No se pudo cargar tus planes de ahorro.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchSavings();
    }, [currentUser]);

    if (loading) {
        return <p className="text-center text-gray-500 py-6">Cargando tus ahorros...</p>;
    }

    if (error) {
        return <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>;
    }

    if (savings.length === 0) {
        return null; // No mostrar nada si no hay ahorros, el dashboard ya tiene un mensaje general.
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200/80">
            <div className="flex items-center mb-5">
                <SavingsIcon className="h-8 w-8 mr-3 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Mis Planes de Ahorro</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {savings.map(plan => (
                    <SavingPlanCard key={plan.numeroCartola} plan={plan} />
                ))}
            </div>
        </div>
    );
};
