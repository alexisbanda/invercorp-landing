import React, { useEffect, useState } from 'react';
import { getAllServices, NonFinancialService } from '@/services/nonFinancialService';
import { formatServiceType } from '@/services/serviceDefinitions';

export const ServicesReportPage: React.FC = () => {
    const [services, setServices] = useState<NonFinancialService[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getAllServices();
            // Sort by date descending
            setServices(data.sort((a, b) => b.fechaSolicitud.toMillis() - a.fechaSolicitud.toMillis()));
            setLoading(false);
        })();
    }, []);

    const filteredServices = services.filter(service => {
        const matchesStatus = statusFilter === 'ALL' || service.estadoGeneral === statusFilter;
        const matchesSearch = 
            service.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.tipoDeServicio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (service.advisorName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesStatus && matchesSearch;
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando reporte de servicios...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Reporte de Servicios</h1>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <input 
                    type="text" 
                    placeholder="Buscar por cliente, tipo o asesor..." 
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
                    <option value="SOLICITADO">Solicitado</option>
                    <option value="EN_EJECUCION">En Ejecución</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="CANCELADO">Cancelado</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Cliente</th>
                            <th className="px-6 py-4">Tipo de Servicio</th>
                            <th className="px-6 py-4">Estado General</th>
                            <th className="px-6 py-4">Paso Actual</th>
                            <th className="px-6 py-4">Asesor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredServices.map((service) => (
                            <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {service.fechaSolicitud.toDate().toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{service.userName}</td>
                                <td className="px-6 py-4 text-gray-800 font-semibold">{formatServiceType(service.tipoDeServicio)}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        service.estadoGeneral === 'FINALIZADO' ? 'bg-green-100 text-green-800' :
                                        service.estadoGeneral === 'CANCELADO' ? 'bg-red-100 text-red-800' :
                                        service.estadoGeneral === 'SOLICITADO' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {service.estadoGeneral.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">{service.estadoActual}</td>
                                <td className="px-6 py-4">
                                    {service.advisorName ? (
                                        <span className="text-indigo-600 font-medium">{service.advisorName}</span>
                                    ) : (
                                        <span className="text-gray-400 italic">No asignado</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredServices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                    No se encontraron servicios que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
