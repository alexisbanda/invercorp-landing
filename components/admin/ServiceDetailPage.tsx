
// src/components/admin/ServiceDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getServiceById, updateServiceStatus, NonFinancialService, StatusHistoryEntry } from '../../services/nonFinancialService';
import { getUserProfile } from '../../services/userService';
import { UserProfile } from '../../types';
import { formatServiceType } from '../../services/serviceDefinitions';
import { Timestamp } from 'firebase/firestore';

// Helper para formatear fechas
const formatDate = (date: Timestamp): string => {
    if (!date || typeof date.toDate !== 'function') return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit'
    }).format(date.toDate());
};

import { WorkflowTimeline } from '../shared/WorkflowTimeline';
import { StatusHistory } from '../shared/StatusHistory';

const ServiceDetailPage: React.FC = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const [service, setService] = useState<NonFinancialService | null>(null);
    const [client, setClient] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    const fetchService = useCallback(async () => {
        if (!serviceId) return;
        setIsLoading(true);
        try {
            const data = await getServiceById(serviceId);
            if (data) {
                setService(data);
                const clientData = await getUserProfile(data.clienteId);
                setClient(clientData);
            } else {
                setError('El servicio solicitado no fue encontrado.');
            }
        } catch (err) {
            setError('Ocurrió un error al cargar el servicio.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [serviceId]);

    useEffect(() => {
        fetchService();
    }, [fetchService]);

    const handleAdvanceState = async () => {
        if (!serviceId || !service) return;

        const currentIndex = service.flujoCompleto.indexOf(service.estadoActual);
        if (currentIndex >= service.flujoCompleto.length - 1) {
            toast.info('El servicio ya se encuentra en su último estado.');
            return;
        }

        const nextStatus = service.flujoCompleto[currentIndex + 1];

        setIsUpdating(true);
        const toastId = toast.loading(`Avanzando estado a "${nextStatus}"...`);

        try {
            await updateServiceStatus(serviceId, nextStatus, notes);
            toast.success('Estado actualizado con éxito.', { id: toastId });
            setNotes('');
            fetchService(); // Recargar los datos del servicio
        } catch (err) {
            toast.error('No se pudo actualizar el estado.', { id: toastId });
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Cargando detalles del servicio...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!service) return <div className="p-8 text-center">Servicio no disponible.</div>;

    const isLastStep = service.flujoCompleto.indexOf(service.estadoActual) === service.flujoCompleto.length - 1;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <Link to="/portal/admin/services" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver a Gestión de Servicios</Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna principal de información y acciones */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{formatServiceType(service.tipoDeServicio)}</h1>
                                <p className="text-sm text-gray-500">Cliente: {service.userName}</p>
                                <p className="text-sm text-gray-500">No. Cartola: {client?.numeroCartola}</p>
                                <p className="text-sm text-gray-500">Asesor: {service.advisorName}</p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${service.estadoGeneral === 'FINALIZADO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {service.estadoGeneral.replace('_', ' ')}
                            </span>
                        </div>

                        {service.descripcionCliente && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-md">
                                <h3 className="font-semibold text-gray-700">Requerimiento del Cliente</h3>
                                <p className="text-gray-600 mt-1">{service.descripcionCliente}</p>
                            </div>
                        )}

                        {/* Sección de Avance de Estado */}
                        {!isLastStep && (
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-700">Avanzar Flujo</h3>
                                <div className="mt-4">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        placeholder="Añade un comentario sobre este cambio de estado..."
                                    />
                                </div>
                                <button
                                    onClick={handleAdvanceState}
                                    disabled={isUpdating}
                                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-blue-300"
                                >
                                    {isUpdating ? 'Actualizando...' : `Avanzar a: ${service.flujoCompleto[service.flujoCompleto.indexOf(service.estadoActual) + 1]}`}
                                </button>
                            </div>
                        )}
                        {isLastStep && (
                             <div className="border-t pt-6 text-center bg-green-50 p-4 rounded-md">
                                <h3 className="text-lg font-semibold text-green-800">¡Servicio Finalizado!</h3>
                                <p className="text-green-700">Este servicio ha completado todos los pasos de su flujo.</p>
                            </div>
                        )}
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

export default ServiceDetailPage;
