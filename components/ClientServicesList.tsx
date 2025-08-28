// src/components/ClientServicesList.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getServicesByClientId, NonFinancialService } from '../services/nonFinancialService';
import { formatServiceType } from '../services/serviceDefinitions';

// Componente para la insignia de estado (similar al de admin)
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const formattedStatus = status.replace(/_/g, ' ');
    let colorClasses = 'bg-gray-100 text-gray-800';
    switch (status) {
        case 'SOLICITADO': colorClasses = 'bg-yellow-100 text-yellow-800'; break;
        case 'EN_EJECUCION': colorClasses = 'bg-blue-100 text-blue-800'; break;
        case 'FINALIZADO': colorClasses = 'bg-green-100 text-green-800'; break;
        case 'CANCELADO': colorClasses = 'bg-red-100 text-red-800'; break;
    }
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full leading-tight ${colorClasses}`}>{formattedStatus}</span>;
};

export const ClientServicesList: React.FC = () => {
    const { currentUser } = useAuth();
    const [services, setServices] = useState<NonFinancialService[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        const fetchServices = async () => {
            setIsLoading(true);
            try {
                // Usaremos una nueva función para obtener solo los servicios del cliente
                const clientServices = await getServicesByClientId(currentUser.uid);
                clientServices.sort((a, b) => b.fechaSolicitud.toMillis() - a.fechaSolicitud.toMillis());
                setServices(clientServices);
            } catch (err) {
                setError('No se pudieron cargar tus servicios.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchServices();
    }, [currentUser]);

    if (isLoading) {
        return <div className="p-4 text-center">Cargando tus servicios...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mis Servicios Contratados</h2>
            {services.length === 0 ? (
                <p className="text-gray-500">Aún no tienes servicios contratados.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {services.map(service => (
                                <tr key={service.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatServiceType(service.tipoDeServicio)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap"><StatusBadge status={service.estadoGeneral} /></td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{service.fechaSolicitud.toDate().toLocaleDateString('es-EC')}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        <Link 
                                            to={`/portal/services/${service.id}`}
                                            className="text-blue-600 hover:underline text-sm font-semibold"
                                        >
                                            Ver Detalle
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};