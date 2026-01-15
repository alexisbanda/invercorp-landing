// src/components/admin/ServiceManagementPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getAllServices, getServicesByAdvisorId, NonFinancialService, deleteService } from '../../services/nonFinancialService';
import { serviceTypeNames, formatServiceType, ServiceType } from '../../services/serviceDefinitions';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

// Componente para el badge de estado
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const formattedStatus = status.replace(/_/g, ' ');
    let colorClasses = 'bg-gray-100 text-gray-800';

    switch (status) {
        case 'SOLICITADO':
            colorClasses = 'bg-yellow-100 text-yellow-800';
            break;
        case 'EN_EJECUCION':
            colorClasses = 'bg-blue-100 text-blue-800';
            break;
        case 'FINALIZADO':
            colorClasses = 'bg-green-100 text-green-800';
            break;
        case 'CANCELADO':
            colorClasses = 'bg-red-100 text-red-800';
            break;
    }

    return <span className={`px-2 py-1 text-xs font-semibold rounded-full leading-tight ${colorClasses}`}>{formattedStatus}</span>;
};

const ServiceManagementPage: React.FC = () => {
    const { userProfile } = useAuth();
    // Estados del componente
    const [services, setServices] = useState<NonFinancialService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<ServiceType | '' | 'TODOS'>('TODOS');

    // Cargar servicios según el rol
    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                let data: NonFinancialService[] = [];
                
                if (userProfile?.role === UserRole.ADVISOR && userProfile.advisorCollectionId) {
                    // Si es asesor, cargar solo sus servicios asignados
                    data = await getServicesByAdvisorId(userProfile.advisorCollectionId);
                } else {
                    // Si es admin (o cualquier otro por defecto), cargar todos
                    data = await getAllServices();
                }

                // Ordenar por fecha de solicitud más reciente
                data.sort((a, b) => b.fechaSolicitud.toMillis() - a.fechaSolicitud.toMillis());
                setServices(data);
            } catch (err) {
                setError('Error al cargar los servicios.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (userProfile) {
            fetchServices();
        }
    }, [userProfile]);

    // Lógica de filtrado con useMemo para optimización
    const filteredServices = useMemo(() => {
        return services.filter(service => {
            const matchesSearch = service.userName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'TODOS' || service.tipoDeServicio === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [services, searchTerm, typeFilter]);

    // Renderizado condicional
    if (isLoading) {
        return <div className="p-6 text-center">Cargando servicios...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Servicios</h1>

            {/* UI de filtros */}
            <div className="mb-4 p-4 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Buscar por nombre de cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md"
                />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as ServiceType | 'TODOS')}
                    className="w-full sm:w-auto p-2 border border-gray-300 rounded-md"
                >
                    <option value="TODOS">Todos los tipos</option>
                    {serviceTypeNames.map(type => (
                        <option key={type} value={type}>{formatServiceType(type)}</option>
                    ))}
                </select>
                <button
                    onClick={() => { setSearchTerm(''); setTypeFilter('TODOS'); }}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Limpiar Filtros
                </button>
            </div>

            {/* Tabla de servicios */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Servicio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado General</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Actual</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Solicitud</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredServices.length > 0 ? filteredServices.map((service) => (
                                <tr key={service.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{service.userName}</div>
                                        <div className="text-sm text-gray-500">ID: {service.clienteId}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatServiceType(service.tipoDeServicio)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <StatusBadge status={service.estadoGeneral} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.estadoActual}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {service.fechaSolicitud.toDate().toLocaleDateString('es-EC')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center gap-2">
                                            <Link
                                                to={`/portal/admin/services/${service.id}`}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-xs transition-colors duration-200"
                                                title="Gestionar Servicio"
                                            >
                                                Gestionar
                                            </Link>
                                            {userProfile?.role === UserRole.ADMIN && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('¿Está seguro de eliminar este servicio? Esta acción no se puede deshacer.')) {
                                                            const loadingId = toast.loading('Eliminando servicio...');
                                                            
                                                            deleteService(service.id)
                                                                .then(() => {
                                                                    toast.success('Servicio eliminado', { id: loadingId });
                                                                    setServices(prev => prev.filter(s => s.id !== service.id));
                                                                })
                                                                .catch(err => {
                                                                    console.error(err);
                                                                    toast.error('Error al eliminar', { id: loadingId });
                                                                });
                                                        }
                                                    }}
                                                    className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded-md text-xs transition-colors duration-200 flex items-center"
                                                    title="Eliminar Servicio"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
                                        No se encontraron servicios que coincidan con los filtros.
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

export default ServiceManagementPage;