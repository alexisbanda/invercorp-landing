
// src/components/admin/NewServiceForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getAllClients, UserProfile } from '../../services/userService';
import { getAllAdvisors } from '../../services/advisorService';
import { createService, NewServiceData } from '../../services/nonFinancialService';
import { serviceTypeNames, formatServiceType, ServiceType } from '../../services/serviceDefinitions';
import { Advisor } from '../../types';

const NewServiceForm: React.FC = () => {
    const navigate = useNavigate();

    // Estados del componente
    const [clients, setClients] = useState<UserProfile[]>([]);
    const [advisors, setAdvisors] = useState<Advisor[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estado del formulario
    const [formData, setFormData] = useState<{
        clienteId: string;
        tipoDeServicio: ServiceType | '';
        descripcionCliente: string;
        advisorId: string;
    }>({ 
        clienteId: '',
        tipoDeServicio: '',
        descripcionCliente: '',
        advisorId: '',
    });

    // Cargar clientes al montar el componente
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const clientList = await getAllClients();
                setClients(clientList);
            } catch (err) {
                toast.error('Error al cargar la lista de clientes.');
                console.error(err);
            } finally {
                setIsLoadingClients(false);
            }
        };
        fetchClients();

        const fetchAdvisors = async () => {
            try {
                const advisorsData = await getAllAdvisors();
                setAdvisors(advisorsData);
            } catch (err) {
                toast.error('Error al cargar la lista de asesores.');
                console.error(err);
            }
        };
        fetchAdvisors();
    }, []);

    // Manejador de cambios en el formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Manejador del envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const { clienteId, tipoDeServicio, descripcionCliente } = formData;

        // Validaciones
        if (!clienteId || !tipoDeServicio) {
            toast.error('Por favor, selecciona un cliente y un tipo de servicio.');
            return;
        }

        const selectedClient = clients.find(c => c.id === clienteId);
        if (!selectedClient) {
            toast.error('El cliente seleccionado no es válido.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Creando solicitud de servicio...');

        const selectedAdvisor = advisors.find(a => a.id === formData.advisorId);

        try {
            const newServiceData: NewServiceData = {
                clienteId,
                userName: selectedClient.name,
                tipoDeServicio,
                descripcionCliente,
                advisorId: selectedAdvisor?.id,
                advisorName: selectedAdvisor?.nombre,
            };

            const newServiceId = await createService(newServiceData);
            toast.success('Servicio creado con éxito.', { id: toastId });

            // Redirigir a la página de detalle del nuevo servicio
            navigate(`/portal/admin/services/${newServiceId}`);

        } catch (err) {
            const errorMessage = (err instanceof Error) ? err.message : 'Ocurrió un error desconocido.';
            toast.error(errorMessage, { id: toastId });
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
            <Toaster position="top-right" />
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-xl border border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Nueva Solicitud de Servicio</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Selección de Cliente */}
                    <div>
                        <label htmlFor="clienteId" className="block text-sm font-semibold text-gray-700 mb-2">
                            Seleccionar Cliente
                        </label>
                        <select
                            id="clienteId"
                            name="clienteId"
                            value={formData.clienteId}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={isLoadingClients || clients.length === 0}
                            required
                        >
                            <option value="">{isLoadingClients ? 'Cargando clientes...' : '-- Elige un cliente --'}</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.cedula})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selección de Asesor */}
                    <div>
                        <label htmlFor="advisor-select" className="block text-sm font-semibold text-gray-700 mb-2">
                            Seleccionar Asesor
                        </label>
                        <select
                            id="advisor-select"
                            name="advisorId"
                            value={formData.advisorId}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={advisors.length === 0}
                        >
                            <option value="">-- Elige un asesor --</option>
                            {advisors.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.nombre}
                                </option>
                            ))}
                        </select>
                        {advisors.length === 0 && (
                            <p className="text-sm text-gray-500 mt-3 text-center">
                                No hay asesores disponibles. <a href="/portal/admin/advisors" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">Crea uno nuevo aquí</a>.
                            </p>
                        )}
                    </div>

                    {/* Selección de Tipo de Servicio */}
                    <div>
                        <label htmlFor="tipoDeServicio" className="block text-sm font-semibold text-gray-700 mb-2">
                            Tipo de Servicio
                        </label>
                        <select
                            id="tipoDeServicio"
                            name="tipoDeServicio"
                            value={formData.tipoDeServicio}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">-- Elige un servicio --</option>
                            {serviceTypeNames.map(type => (
                                <option key={type} value={type}>
                                    {formatServiceType(type)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Descripción del Cliente */}
                    <div>
                        <label htmlFor="descripcionCliente" className="block text-sm font-medium text-gray-700">Descripción o Requerimiento del Cliente</label>
                        <textarea
                            id="descripcionCliente"
                            name="descripcionCliente"
                            rows={4}
                            value={formData.descripcionCliente}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Añade cualquier detalle relevante proporcionado por el cliente..."
                        />
                    </div>

                    {/* Botón de Envío */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoadingClients}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Procesando...' : 'Crear Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewServiceForm;
