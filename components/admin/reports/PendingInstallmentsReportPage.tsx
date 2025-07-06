// components/admin/reports/PendingInstallmentsReportPage.tsx

import React, { useState, useEffect, useMemo } from 'react'; // Importamos useMemo
import { Link } from 'react-router-dom';
import { getPendingAdminInstallments } from '@/services/loanService';
import { Installment } from '@/types';
import { Toaster } from 'react-hot-toast';

// Tipos y componentes de utilidad (sin cambios)
type ReportInstallment = Installment & {
    loanId: string;
    userName: string;
    userEmail: string;
};

const formatDate = (date: Date | undefined | null): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const baseClasses = "inline-block px-2 py-1 text-xs font-semibold rounded-full leading-tight";
    let colorClasses = "bg-gray-200 text-gray-800";

    switch (status) {
        case 'PAGADO': colorClasses = "bg-green-200 text-green-800"; break;
        case 'VENCIDO': colorClasses = "bg-red-200 text-red-800"; break;
        case 'EN VERIFICACIÓN': colorClasses = "bg-yellow-200 text-yellow-800"; break;
        case 'PENDIENTE': colorClasses = "bg-blue-200 text-blue-800"; break;
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};


// --- Componente principal del reporte con filtros ---
export const PendingInstallmentsReportPage = () => {
    // Estado para los datos originales
    const [installments, setInstallments] = useState<ReportInstallment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- NUEVOS ESTADOS PARA LOS FILTROS ---
    const [statusFilter, setStatusFilter] = useState<string>('TODOS');
    const [clientFilter, setClientFilter] = useState<string>('');

    useEffect(() => {
        const fetchInstallments = async () => {
            setIsLoading(true);
            try {
                const data = await getPendingAdminInstallments();
                setInstallments(data);
            } catch (err) {
                console.error("Error fetching pending installments:", err);
                setError("No se pudo cargar el reporte de cuotas.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInstallments();
    }, []);

    // --- LÓGICA DE FILTRADO CON useMemo PARA OPTIMIZACIÓN ---
    const filteredInstallments = useMemo(() => {
        return installments.filter(inst => {
            // Filtro por estado
            const statusMatch = statusFilter === 'TODOS' || inst.status === statusFilter;

            // Filtro por nombre de cliente (insensible a mayúsculas/minúsculas)
            const clientMatch = clientFilter === '' || inst.userName.toLowerCase().includes(clientFilter.toLowerCase());

            return statusMatch && clientMatch;
        });
    }, [installments, statusFilter, clientFilter]); // Se recalcula solo si estos valores cambian

    if (isLoading) return <div className="p-6 text-center">Cargando reporte...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-2">Reporte de Cuotas con Atención Requerida</h1>
                <p className="text-gray-600 mb-6">
                    Cuotas en estado 'Pendiente', 'Vencido' o 'En Verificación' de todos los préstamos.
                </p>

                {/* --- SECCIÓN DE FILTROS --- */}
                <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-auto">
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Estado</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="TODOS">Todos los Estados</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="VENCIDO">Vencido</option>
                            <option value="EN VERIFICACIÓN">En Verificación</option>
                        </select>
                    </div>
                    <div className="w-full md:w-1/3">
                        <label htmlFor="client-filter" className="block text-sm font-medium text-gray-700 mb-1">Buscar por Cliente</label>
                        <input
                            type="text"
                            id="client-filter"
                            value={clientFilter}
                            onChange={(e) => setClientFilter(e.target.value)}
                            placeholder="Escriba el nombre del cliente..."
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* --- LÓGICA DE VISUALIZACIÓN MEJORADA --- */}
                {installments.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        <h3 className="text-lg font-semibold">¡Excelente!</h3>
                        <p>No hay cuotas que requieran atención en este momento.</p>
                    </div>
                ) : filteredInstallments.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                        <h3 className="text-lg font-semibold">Sin Resultados</h3>
                        <p>No se encontraron cuotas que coincidan con los filtros seleccionados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Cuota #</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {/* Se itera sobre la lista FILTRADA */}
                            {filteredInstallments.map(inst => (
                                <tr key={`${inst.loanId}-${inst.installmentNumber}`} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{inst.userName}</td>
                                    <td className="py-4 px-4 text-sm text-gray-700">{inst.installmentNumber}</td>
                                    <td className="py-4 px-4 text-sm text-gray-700">${inst.amount.toFixed(2)}</td>
                                    <td className="py-4 px-4 text-sm text-gray-500">{formatDate(inst.dueDate)}</td>
                                    <td className="py-4 px-4 text-center"><StatusBadge status={inst.status} /></td>
                                    <td className="py-4 px-4 text-center">
                                        <Link to={`/portal/admin/loan/${inst.loanId}`} className="text-blue-600 hover:underline text-sm font-semibold">
                                            Gestionar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};