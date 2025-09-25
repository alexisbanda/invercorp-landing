import React, { useEffect, useState } from 'react';
import { getDelinquencyAging } from '@/services/reportService';

export const DelinquencyAgingPage: React.FC = () => {
    const [buckets, setBuckets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setBuckets(await getDelinquencyAging());
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="p-6">Cargando reporte de morosidad...</div>;

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">Morosidad por antigüedad</h1>
            <div className="bg-white rounded shadow p-4">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left"><th>Rango</th><th>Monto</th><th>Cantidad Cuotas</th></tr>
                    </thead>
                    <tbody>
                        {buckets.map(b => (
                            <tr key={b.label}>
                                <td className="py-2">{b.label}</td>
                                <td className="py-2">${b.amount.toLocaleString()}</td>
                                <td className="py-2">{b.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
