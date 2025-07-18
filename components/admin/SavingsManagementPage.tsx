// components/admin/SavingsManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllProgrammedSavings } from '../../services/savingsService';
import { ProgrammedSaving } from '../../types';

const SavingsManagementPage: React.FC = () => {
    const [savings, setSavings] = useState<ProgrammedSaving[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSavings = async () => {
            try {
                setLoading(true);
                // Esta función necesitará ser creada en savingsService.ts
                const allSavings = await getAllProgrammedSavings();
                setSavings(allSavings);
                setError(null);
            } catch (err) {
                setError("Error al cargar los planes de ahorro.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSavings();
    }, []);

    if (loading) {
        return <div className="text-center p-8">Cargando todos los planes de ahorro...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Ahorros Programados</h1>
                <Link 
                    to="/portal/admin/ahorros/nuevo" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300"
                >
                    + Crear Nuevo Plan
                </Link>
            </div>

            {savings.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No hay planes de ahorro registrados en el sistema.</p>
            ) : (
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente ID</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre del Plan</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto Meta</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo Actual</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {savings.map((plan) => (
                                <tr key={`${plan.clienteId}-${plan.numeroCartola}`} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{plan.clienteId}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{plan.nombrePlan}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">${plan.montoMeta.toLocaleString()}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm font-semibold">${plan.saldoActual.toLocaleString()}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">
                                        <span className={`font-semibold ${plan.estadoPlan === 'Activo' ? 'text-green-600' : 'text-yellow-600'}`}>{plan.estadoPlan}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default SavingsManagementPage;
