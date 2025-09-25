import React, { useEffect, useState } from 'react';
import { getPortfolioOverview, getDelinquencyAging, getPaymentActivity } from '@/services/reportService';

const MiniBarChart: React.FC<{ buckets: any[] }> = ({ buckets }) => {
    if (!buckets || buckets.length === 0) return <div>N/A</div>;
    const max = Math.max(...buckets.map(b => b.amount));
    const width = 320;
    const barWidth = width / buckets.length - 10;

    return (
        <svg width={width} height={160} className="block">
            {buckets.map((b, i) => {
                const h = max ? (b.amount / max) * 100 : 0;
                const x = i * (barWidth + 10) + 20;
                const y = 120 - h;
                return (
                    <g key={b.label}>
                        <rect x={x} y={y} width={barWidth} height={h} fill="#4F46E5" rx={4} />
                        <text x={x + barWidth / 2} y={140} fontSize={12} fill="#374151" textAnchor="middle">{b.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

export const DashboardPage: React.FC = () => {
    const [overview, setOverview] = useState<any>(null);
    const [buckets, setBuckets] = useState<any[]>([]);
    const [activity, setActivity] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const [ov, db, pa] = await Promise.all([getPortfolioOverview(), getDelinquencyAging(), getPaymentActivity()]);
            setOverview(ov);
            setBuckets(db);
            setActivity(pa);
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="p-6">Cargando dashboard...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Dashboard de KPIs</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded shadow">Préstamos totales<br/><strong className="text-2xl">{overview.totalLoans}</strong></div>
                <div className="bg-white p-4 rounded shadow">Saldo pendiente<br/><strong className="text-2xl">${overview.totalOutstanding.toLocaleString()}</strong></div>
                <div className="bg-white p-4 rounded shadow">Saldo vencido<br/><strong className="text-2xl">${overview.totalOverdue.toLocaleString()}</strong></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-semibold mb-2">Morosidad por antigüedad</h2>
                    <MiniBarChart buckets={buckets} />
                    <div className="mt-3">
                        {buckets.map(b => (
                            <div key={b.label} className="flex justify-between text-sm py-1">
                                <div>{b.label}</div>
                                <div>${b.amount.toLocaleString()} ({b.count})</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-semibold mb-2">Actividad de Pagos (30d)</h2>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between"><span>Reportes</span><strong>{activity.reportedCount}</strong></div>
                        <div className="flex justify-between"><span>Aprobados</span><strong>{activity.approvedCount}</strong></div>
                        <div className="flex justify-between"><span>Rechazados</span><strong>{activity.rejectedCount}</strong></div>
                        <div className="flex justify-between"><span>Tiempo medio</span><strong>{activity.averageResolutionHours ?? 'N/A'} hrs</strong></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
