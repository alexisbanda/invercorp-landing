import React, { useEffect, useState } from 'react';
import { getAdvisorStats, AdvisorStats } from '@/services/reportService';

export const AdvisorReportPage: React.FC = () => {
    const [advisors, setAdvisors] = useState<AdvisorStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getAdvisorStats();
            setAdvisors(data);
            setLoading(false);
        })();
    }, []);

    const filteredAdvisors = advisors.filter(advisor => 
        advisor.advisorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando reporte de asesores...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Reporte de Asesores</h1>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                <input 
                    type="text" 
                    placeholder="Buscar asesor..." 
                    className="border border-gray-300 rounded px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="text-gray-500 text-sm">
                    Total: {filteredAdvisors.length} asesores
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-6 py-4">Nombre del Asesor</th>
                            <th className="px-6 py-4 text-center">Ahorros Activos</th>
                            <th className="px-6 py-4 text-center">Capital Gestionado</th>
                            <th className="px-6 py-4 text-center">Servicios Activos</th>
                            <th className="px-6 py-4 text-center">Efectividad</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredAdvisors.map((advisor) => (
                            <tr key={advisor.advisorId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{advisor.advisorName}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-bold">
                                        {advisor.activeSavingsCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-mono">
                                    ${advisor.totalCapitalManaged.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                                        {advisor.activeServicesCount}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {/* Placeholder algorithm for effectiveness */}
                                    <span className="text-xs text-gray-400">N/A</span>
                                </td>
                            </tr>
                        ))}
                        {filteredAdvisors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    No se encontraron asesores.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
