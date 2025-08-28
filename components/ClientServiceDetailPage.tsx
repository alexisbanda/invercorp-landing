
// src/components/ClientServiceDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getServiceById, NonFinancialService } from '../services/nonFinancialService';
import { formatServiceType } from '../services/serviceDefinitions';
import { useAuth } from '../contexts/AuthContext';
import { WorkflowTimeline } from './shared/WorkflowTimeline';
import { StatusHistory } from './shared/StatusHistory';

const ClientServiceDetailPage: React.FC = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const { currentUser } = useAuth();
    const [service, setService] = useState<NonFinancialService | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchService = useCallback(async () => {
        if (!serviceId || !currentUser) return;

        setIsLoading(true);
        try {
            const data = await getServiceById(serviceId);
            // --- Verificación de Seguridad ---
            if (data && data.clienteId === currentUser.uid) {
                setService(data);
            } else if (data) {
                setError('No tienes permiso para ver este servicio.');
            } else {
                setError('El servicio solicitado no fue encontrado.');
            }
        } catch (err) {
            setError('Ocurrió un error al cargar el servicio.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [serviceId, currentUser]);

    useEffect(() => {
        fetchService();
    }, [fetchService]);

    if (isLoading) return <div className="p-8 text-center">Cargando detalles del servicio...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!service) return <div className="p-8 text-center">Servicio no disponible.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <Link to="/portal/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver al Dashboard</Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna principal de información */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{formatServiceType(service.tipoDeServicio)}</h1>
                                <p className="text-sm text-gray-500">ID de Solicitud: {service.id}</p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${service.estadoGeneral === 'FINALIZADO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {service.estadoGeneral.replace('_', ' ')}
                            </span>
                        </div>

                        {service.descripcionCliente && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-md">
                                <h3 className="font-semibold text-gray-700">Tu Requerimiento</h3>
                                <p className="text-gray-600 mt-1">{service.descripcionCliente}</p>
                            </div>
                        )}

                        <div className="border-t pt-6 text-center bg-blue-50 p-4 rounded-md">
                            <h3 className="text-lg font-semibold text-blue-800">Estado Actual: {service.estadoActual}</h3>
                            <p className="text-blue-700">Estamos trabajando en tu solicitud. Aquí puedes ver el progreso y el historial de cambios.</p>
                        </div>
                    </div>

                    {/* Columna de Flujo e Historial */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <WorkflowTimeline service={service} />
                        <StatusHistory history={service.historialDeEstados} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientServiceDetailPage;
