import React, { useEffect, useState } from 'react';
import { getAllProgrammedSavings } from '@/services/savingsService';
import { ProgrammedSavingStatus, ProgrammedSaving } from '@/types';

export const SavingsReportPage: React.FC = () => {
    const [savings, setSavings] = useState<ProgrammedSaving[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getAllProgrammedSavings();
                // Sort by creation date descending (assuming numeroCartola proxy for age or use fechaCreacion if consistent)
                setSavings(data.sort((a, b) => {
                     const dateA = a.fechaCreacion && a.fechaCreacion.toMillis ? a.fechaCreacion.toMillis() : 0;
                     const dateB = b.fechaCreacion && b.fechaCreacion.toMillis ? b.fechaCreacion.toMillis() : 0;
                     return dateB - dateA;
                }));
            } catch (error) {
                console.error("Error fetching savings:", error);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filteredSavings = savings.filter(plan => {
        const matchesStatus = statusFilter === 'ALL' || plan.estadoPlan === statusFilter;
        const matchesSearch = 
            plan.nombrePlan.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.numeroCartola.toString().includes(searchTerm) ||
            (plan.advisorName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando reporte de ahorros...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Reporte de Ahorros Programados</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <input 
                    type="text" 
                    placeholder="Buscar por plan, # cartola o asesor..." 
                    className="border border-gray-300 rounded px-4 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                    className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="ALL">Todos los Estados</option>
                    <option value={ProgrammedSavingStatus.ACTIVO}>Activo</option>
                    <option value={ProgrammedSavingStatus.PAUSADO}>Pausado</option>
                    <option value={ProgrammedSavingStatus.COMPLETADO}>Completado</option>
                    <option value={ProgrammedSavingStatus.CANCELADO}>Cancelado</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-6 py-4"># Cartola</th>
                            <th className="px-6 py-4">Plan</th>
                            <th className="px-6 py-4 text-right">Saldo Actual</th>
                            <th className="px-6 py-4 text-right">Meta</th>
                            <th className="px-6 py-4 text-center">Progreso</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4">Asesor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredSavings.map((plan) => {
                            const progress = plan.montoMeta > 0 ? ((plan.saldoActual || 0) / plan.montoMeta) * 100 : 0;
                            return (
                                <tr key={plan.numeroCartola} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-500">#{plan.numeroCartola}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{plan.nombrePlan}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                                        ${(plan.saldoActual || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-500">
                                        ${plan.montoMeta.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-200 mt-1">
                                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                        </div>
                                        <span className="text-xs text-gray-500 mt-1 inline-block">{progress.toFixed(1)}%</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            plan.estadoPlan === ProgrammedSavingStatus.ACTIVO ? 'bg-green-100 text-green-800' :
                                            plan.estadoPlan === ProgrammedSavingStatus.COMPLETADO ? 'bg-blue-100 text-blue-800' :
                                            plan.estadoPlan === ProgrammedSavingStatus.CANCELADO ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {plan.estadoPlan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {plan.advisorName ? (
                                            <span className="text-indigo-600 font-medium">{plan.advisorName}</span>
                                        ) : (
                                            <span className="text-gray-400 italic">No asignado</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredSavings.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                                    No se encontraron planes de ahorro que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
