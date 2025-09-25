import React, { useEffect, useState } from 'react';
import { getPaymentActivity } from '@/services/reportService';

export const PaymentActivityPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setData(await getPaymentActivity());
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="p-6">Cargando actividad de pagos...</div>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Actividad de Pagos (últimos 30 días)</h1>
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded shadow">Reportes: <strong>{data.reportedCount}</strong></div>
                <div className="bg-white p-4 rounded shadow">Aprobados: <strong>{data.approvedCount}</strong></div>
                <div className="bg-white p-4 rounded shadow">Rechazados: <strong>{data.rejectedCount}</strong></div>
            </div>
            <div className="mt-4 bg-white p-4 rounded shadow">Tiempo medio de resolución: <strong>{data.averageResolutionHours ?? 'N/A'} horas</strong></div>
        </div>
    );
};
