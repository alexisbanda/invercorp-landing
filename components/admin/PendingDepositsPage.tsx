// components/admin/PendingDepositsPage.tsx
import React, { useState, useEffect } from 'react';
import { getPendingDeposits, confirmDeposit, rejectDeposit } from '../../services/savingsService';
import { useAuth } from '../../contexts/AuthContext';

interface PendingDeposit {
    depositId: string;
    clienteId: string;
    numeroCartola: number;
    nombrePlan: string;
    montoDeposito: number;
    fechaDeposito: any; // Firestore timestamp
    notaCliente?: string;
}

const PendingDepositsPage: React.FC = () => {
    const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { currentUser } = useAuth();

    const fetchPendingDeposits = async () => {
        try {
            setLoading(true);
            const pending = await getPendingDeposits();
            setDeposits(pending);
            setError(null);
        } catch (err) {
            setError("Error al cargar los depósitos pendientes.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingDeposits();
    }, []);

    const handleConfirm = async (deposit: PendingDeposit) => {
        if (!currentUser) return;
        if (window.confirm(`¿Seguro que quieres confirmar el depósito de $${deposit.montoDeposito}?`)) {
            try {
                await confirmDeposit(deposit.clienteId, deposit.numeroCartola, deposit.depositId, currentUser.uid);
                fetchPendingDeposits(); // Refresh list
            } catch (error) {
                console.error("Error al confirmar:", error);
                alert("No se pudo confirmar el depósito.");
            }
        }
    };

    const handleReject = async (deposit: PendingDeposit) => {
        if (!currentUser) return;
        const reason = prompt("Por favor, ingresa el motivo del rechazo:");
        if (reason) {
            try {
                await rejectDeposit(deposit.clienteId, deposit.numeroCartola, deposit.depositId, currentUser.uid, reason);
                fetchPendingDeposits(); // Refresh list
            } catch (error) {
                console.error("Error al rechazar:", error);
                alert("No se pudo rechazar el depósito.");
            }
        }
    };

    if (loading) return <div className="text-center p-8">Cargando depósitos...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Depósitos Pendientes de Verificación</h1>

            {deposits.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No hay depósitos pendientes por verificar.</p>
            ) : (
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <table className="min-w-full leading-normal">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente ID</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan de Ahorro</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Reporte</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deposits.map((dep) => (
                                <tr key={dep.depositId} className="hover:bg-gray-50">
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{dep.clienteId}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{dep.nombrePlan} ({dep.numeroCartola})</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm font-semibold">${dep.montoDeposito.toLocaleString()}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm">{new Date(dep.fechaDeposito.seconds * 1000).toLocaleString()}</td>
                                    <td className="px-5 py-4 border-b border-gray-200 bg-white text-sm space-x-2">
                                        <button onClick={() => handleConfirm(dep)} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded">Confirmar</button>
                                        <button onClick={() => handleReject(dep)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded">Rechazar</button>
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

export default PendingDepositsPage;
