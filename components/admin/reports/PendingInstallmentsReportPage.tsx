// src/components/admin/reports/PendingInstallmentsReportPage.tsx
import React, { useMemo, useState } from 'react';
import { useLoanDataForReports } from '@/hooks/useLoanDataForReports.ts';
import { Installment } from '@/types.ts';
import Papa from 'papaparse';

// --- Componente de Badge para reutilizar ---
const InstallmentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const base = 'px-2 py-1 text-xs font-semibold rounded-full inline-block';
    const colors: Record<string, string> = {
        PAGADO: 'bg-green-100 text-green-800',
        PENDIENTE: 'bg-yellow-100 text-yellow-800',
        VENCIDO: 'bg-red-100 text-red-800',
        'EN VERIFICACIÓN': 'bg-blue-100 text-blue-800',
        RECHAZADO: 'bg-pink-100 text-pink-800',
    };
    return <span className={`${base} ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
};

// Componente de la tabla de datos
const InstallmentsTable: React.FC<{ installments: (Installment & { userName: string })[] }> = ({ installments }) => {
    const handleExport = () => {
        const csv = Papa.unparse(installments.map(inst => ({
            "Cliente": inst.userName,
            "Nº Cuota": inst.installmentNumber,
            "Fecha Vencimiento": new Date(inst.dueDate).toLocaleDateString('es-EC'),
            "Monto": inst.amount,
            "Estado": inst.status,
        })));
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'reporte_cuotas_pendientes.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Resultados ({installments.length})</h3>
                <button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">
                    <i className="fas fa-file-csv mr-2"></i>Exportar
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nº Cuota</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {installments.length > 0 ? (
                        installments.map(inst => (
                            <tr key={`${(inst as any).loanId}-${inst.installmentNumber}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inst.userName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inst.installmentNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${inst.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(inst.dueDate).toLocaleDateString('es-EC')}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><InstallmentStatusBadge status={inst.status} /></td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-500">No hay datos que coincidan con los filtros.</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const PendingInstallmentsReportPage: React.FC = () => {
    const { loans, installments, isLoading, error } = useLoanDataForReports();

    const [statusFilter, setStatusFilter] = useState('all');

    const pendingInstallments = useMemo(() => {
        if (!installments || !loans) return [];
        return installments
            .filter(inst => ['PENDIENTE', 'VENCIDO', 'EN VERIFICACIÓN'].includes(inst.status))
            .map(inst => {
                const loan = loans.find(l => l.id === (inst as any).loanId);
                return { ...inst, userName: loan?.userName || 'N/A' };
            });
    }, [installments, loans]);

    const filteredData = useMemo(() => {
        if (statusFilter === 'all') return pendingInstallments;
        return pendingInstallments.filter(inst => inst.status === statusFilter);
    }, [pendingInstallments, statusFilter]);

    if (isLoading) return <div className="p-8 text-center">Cargando reporte...</div>;
    if (error) return <div className="p-8 text-red-500 text-center">Error: {error.message}</div>;

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 px-4 sm:px-0">Reporte de Cuotas Pendientes</h1>
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 mx-4 sm:mx-0">
                <h2 className="font-semibold mb-2">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="all">Todos los Pendientes</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="VENCIDO">Vencido</option>
                            <option value="EN VERIFICACIÓN">En Verificación</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="px-4 sm:px-0">
                <InstallmentsTable installments={filteredData} />
            </div>
        </div>
    );
};