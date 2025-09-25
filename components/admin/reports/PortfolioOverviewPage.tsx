import React, { useEffect, useState } from 'react';
import { getPortfolioOverview } from '@/services/reportService';

export const PortfolioOverviewPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setData(await getPortfolioOverview());
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="p-6">Cargando resumen de cartera...</div>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Resumen de Cartera</h1>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded shadow">Total préstamos: <strong>{data.totalLoans}</strong></div>
                <div className="bg-white p-4 rounded shadow">Préstamos activos: <strong>{data.activeLoans}</strong></div>
                <div className="bg-white p-4 rounded shadow">Saldo pendiente: <strong>${data.totalOutstanding.toLocaleString()}</strong></div>
                <div className="bg-white p-4 rounded shadow">Saldo vencido: <strong>${data.totalOverdue.toLocaleString()}</strong></div>
                <div className="bg-white p-4 rounded shadow">Tasa promedio: <strong>{data.averageInterestRate ?? 'N/A'}%</strong></div>
                <div className="bg-white p-4 rounded shadow">Cuotas promedio/préstamo: <strong>{data.averageInstallmentsPerLoan ?? 'N/A'}</strong></div>
            </div>
        </div>
    );
};
