// components/admin/SavingsManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { getAllProgrammedSavings } from '../../services/savingsService';
import { ProgrammedSaving } from '../../types';

const SavingsManagementPage: React.FC = () => {
    const [savings, setSavings] = useState<ProgrammedSaving[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSavings = async () => {
            try {
                const allSavings = await getAllProgrammedSavings();
                setSavings(allSavings);
            } catch (err) {
                setError('Error al cargar los planes de ahorro.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSavings();
    }, []);

    if (isLoading) {
        return <div className="p-6 text-center">Cargando planes de ahorro...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Gestión de Ahorros Programados</h1>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Cliente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Plan</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Meta</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Actual</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {savings.map((saving) => (
                            <tr key={saving.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{saving.clienteId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{saving.nombrePlan}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${saving.montoMeta.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${saving.saldoActual.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${saving.estadoPlan === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {saving.estadoPlan}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SavingsManagementPage;