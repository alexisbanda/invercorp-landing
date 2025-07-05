// src/components/admin/DashboardReports.tsx

import React, { useState, useMemo } from 'react';
import { useLoanDataForReports } from '@/hooks/useLoanDataForReports.ts';
import { LoanStatusChart } from './LoanStatusChart';
import { LoanDetailsGrid } from './LoanDetailsGrid';
import { LoanStatus } from '@/types.ts';

export const DashboardReports: React.FC = () => {
    const { stats, loans, isLoading, error } = useLoanDataForReports();
    const [selectedStatus, setSelectedStatus] = useState<LoanStatus | null>(null);

    const handleBarClick = (status: LoanStatus) => {
        setSelectedStatus(prevStatus => (prevStatus === status ? null : status));
    };

    const filteredLoansForGrid = useMemo(() => {
        if (!selectedStatus || !loans) return [];
        return loans.filter(loan => loan.status === selectedStatus);
    }, [loans, selectedStatus]);

    if (isLoading) {
        return <div className="p-8 text-center">Cargando dashboard...</div>;
    }

    if (error) {
        return <div className="p-8 text-red-500 text-center">Error al cargar los datos: {error.message}</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center">No hay datos para mostrar.</div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 px-4 sm:px-0">Dashboard de KPIs</h1>

            {/* Fila de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-4 sm:px-0">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Monto Total Prestado</h3>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">${stats.totalLoanAmount.toLocaleString('es-EC')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Monto Total Recaudado</h3>
                    <p className="mt-1 text-3xl font-semibold text-green-600">${stats.totalCollected.toLocaleString('es-EC')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Monto en Mora</h3>
                    <p className="mt-1 text-3xl font-semibold text-red-600">${stats.totalOverdue.toLocaleString('es-EC')}</p>
                </div>
            </div>

            {/* Fila de Charts y Grids */}
            <div className="grid grid-cols-1 gap-8 px-4 sm:px-0">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Estado de la Cartera (por Nº de Préstamos)</h2>
                    <p className="text-sm text-gray-500 mb-4">Haz clic en una barra para ver el detalle.</p>
                    <LoanStatusChart data={stats.loansByStatus} onBarClick={handleBarClick} />
                </div>

                {selectedStatus && (
                    <LoanDetailsGrid
                        title={`Detalle de Préstamos: ${selectedStatus}`}
                        loans={filteredLoansForGrid}
                    />
                )}
            </div>
        </div>
    );
};