import React, { useEffect, useState } from 'react';
import { getDashboardKPIs, getAdvisorStats, DashboardKPIs, AdvisorStats } from '@/services/reportService';

export const DashboardPage: React.FC = () => {
    const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
    const [advisorStats, setAdvisorStats] = useState<AdvisorStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [kpiData, advisorData] = await Promise.all([
                    getDashboardKPIs(),
                    getAdvisorStats()
                ]);
                setKpis(kpiData);
                // Sort advisors by total activity (savings + services) descending
                setAdvisorStats(advisorData.sort((a, b) => 
                    (b.activeSavingsCount + b.activeServicesCount) - (a.activeSavingsCount + a.activeServicesCount)
                ));
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando indicadores...</div>;
    if (!kpis) return <div className="p-8 text-center text-red-500">Error al cargar datos.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard General</h1>

            {/* Savings Section */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <i className="fas fa-piggy-bank mr-2 text-indigo-600"></i>
                    Ahorro Programado
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Planes Activos</p>
                        <p className="text-3xl font-bold text-gray-900">{kpis.savings.totalActivePlans}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Capital Total Ahorrado</p>
                        <p className="text-3xl font-bold text-green-600">
                            ${kpis.savings.totalCapitalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Promedio por Plan</p>
                        <p className="text-3xl font-bold text-blue-600">
                            ${kpis.savings.averageSavingsPerPlan.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <div className="mb-10">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                    <i className="fas fa-briefcase mr-2 text-indigo-600"></i>
                    Servicios (No Financieros)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Servicios Activos</p>
                        <p className="text-3xl font-bold text-gray-900">{kpis.services.totalActive}</p>
                        <p className="text-xs text-gray-400 mt-2">En ejecución o solicitados</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Completados (Este Mes)</p>
                        <p className="text-3xl font-bold text-indigo-600">{kpis.services.totalCompletedThisMonth}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1">Servicio Más Solicitado</p>
                        <p className="text-xl font-bold text-gray-800 break-words capitalize">
                            {kpis.services.topServiceType?.replace(/_/g, ' ')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Advisor Performance Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Rendimiento por Asesor</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs">
                            <tr>
                                <th className="px-6 py-3">Asesor</th>
                                <th className="px-6 py-3 text-center">Planes Ahorro Activos</th>
                                <th className="px-6 py-3 text-center">Capital Gestionado</th>
                                <th className="px-6 py-3 text-center">Servicios Activos</th>
                                <th className="px-6 py-3 text-center">Total Gestión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {advisorStats.length > 0 ? (
                                advisorStats.map((stat) => (
                                    <tr key={stat.advisorId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{stat.advisorName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-bold">
                                                {stat.activeSavingsCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono">
                                            ${stat.totalCapitalManaged.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                                                {stat.activeServicesCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {stat.activeSavingsCount + stat.activeServicesCount}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        No hay datos de asesores disponibles.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
