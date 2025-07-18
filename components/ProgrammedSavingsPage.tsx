// components/ProgrammedSavingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProgrammedSaving } from '../types';
import { getProgrammedSavingsForUser } from '../services/savingsService';
import { Link } from 'react-router-dom';

const ProgrammedSavingsPage: React.FC = () => {
    const [savings, setSavings] = useState<ProgrammedSaving[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchSavings = async () => {
            if (!currentUser) {
                setError("Usuario no autenticado.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const userSavings = await getProgrammedSavingsForUser(currentUser.uid);
                setSavings(userSavings);
                setError(null);
            } catch (err) {
                setError("Error al cargar los planes de ahorro. Inténtelo de nuevo más tarde.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSavings();
    }, [currentUser]);

    if (loading) {
        return <div className="text-center p-8">Cargando planes de ahorro...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Mis Ahorros Programados</h1>
                <Link 
                    to="/portal/ahorros/nuevo" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
                >
                    + Nuevo Plan de Ahorro
                </Link>
            </div>

            {savings.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 rounded-lg shadow-inner">
                    <p className="text-gray-600">Aún no tienes ningún plan de ahorro programado.</p>
                    <p className="text-gray-500 mt-2">¡Crea uno para empezar a alcanzar tus metas!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savings.map((plan) => (
                        <div key={plan.numeroCartola} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-1 transition duration-300">
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 truncate">{plan.nombrePlan}</h2>
                                <p className="text-sm text-gray-500 mb-4">ID del Plan: {plan.numeroCartola}</p>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-sm font-medium text-gray-600">Progreso</span>
                                        <span className="text-sm font-bold text-blue-600">{((plan.saldoActual / plan.montoMeta) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                            className="bg-blue-500 h-2.5 rounded-full"
                                            style={{ width: `${(plan.saldoActual / plan.montoMeta) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="flex justify-between text-sm text-gray-700">
                                    <span>Actual: ${plan.saldoActual.toLocaleString()}</span>
                                    <span className="font-medium">Meta: ${plan.montoMeta.toLocaleString()}</span>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                                    <p>Estado: <span className={`font-semibold ${plan.estadoPlan === 'Activo' ? 'text-green-600' : 'text-yellow-600'}`}>{plan.estadoPlan}</span></p>
                                    <p>Próximo depósito sugerido: ${plan.montoDepositoSugerido.toLocaleString()} ({plan.frecuenciaDepositoSugerida})</p>
                                </div>

                                <Link 
                                    to={`/portal/ahorros/${plan.numeroCartola}`}
                                    className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg mt-5 transition duration-300"
                                >
                                    Ver Detalles
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProgrammedSavingsPage;
