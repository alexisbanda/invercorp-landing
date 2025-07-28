// components/admin/AdminNewProgrammedSavingForm.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { createProgrammedSaving } from '../../services/savingsService';
import { getAllClients, getUserProfile } from '../../services/userService';
import { UserProfile } from '../../types';


// Hook para parsear query params de la URL
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const AdminNewProgrammedSavingForm: React.FC = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const clientIdFromUrl = query.get('clientId');

    const [allClients, setAllClients] = useState<UserProfile[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(clientIdFromUrl || '');
    const [client, setClient] = useState<UserProfile | null>(null);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [isLoadingClientData, setIsLoadingClientData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nombrePlan: '',
        montoMeta: 1000,
        frecuenciaDepositoSugerida: 'Mensual',
        montoDepositoSugerido: 100,
        fechaInicioPlan: new Date().toISOString().split('T')[0],
    });

    // Cargar lista de todos los clientes al montar el componente
    useEffect(() => {
        const fetchClients = async () => {
            setIsLoadingClients(true);
            try {
                const clients = await getAllClients();
                setAllClients(clients);
            } catch (err) {
                console.error("Error fetching clients:", err);
                setError('Error al cargar la lista de clientes.');
            } finally {
                setIsLoadingClients(false);
            }
        };
        fetchClients();
    }, []);

    // Cargar datos del cliente seleccionado
    useEffect(() => {
        const fetchClientData = async () => {
            if (selectedClientId) {
                setIsLoadingClientData(true);
                setError(null);
                try {
                    const clientData = await getUserProfile(selectedClientId);
                    if (clientData) {
                        setClient(clientData);
                    } else {
                        setError(`No se encontró un cliente con el ID: ${selectedClientId}`);
                        setClient(null);
                    }
                } catch (err) {
                    setError('Error al cargar los datos del cliente.');
                    setClient(null);
                    console.error(err);
                } finally {
                    setIsLoadingClientData(false);
                }
            } else {
                setClient(null);
            }
        };

        fetchClientData();
    }, [selectedClientId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            // Convertir a número solo si el campo lo requiere
            [name]: ['montoMeta', 'montoDepositoSugerido'].includes(name) ? Number(value) : value,
        }));
    };

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClientId = e.target.value;
        setSelectedClientId(newClientId);
        // Actualizar la URL para reflejar el cliente seleccionado
        const url = newClientId ? `/portal/admin/savings/new?clientId=${newClientId}` : '/portal/admin/savings/new';
        navigate(url, { replace: true });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedClientId || !client) {
            toast.error('No hay un cliente válido seleccionado.');
            return;
        }

        // Validaciones básicas del formulario
        if (formData.nombrePlan.trim() === '' || formData.montoMeta <= 0 || formData.montoDepositoSugerido <= 0) {
            toast.error('Por favor, completa todos los campos con valores válidos.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Creando el plan de ahorro...');

        try {
            // Se asume que createProgrammedSaving manejará la generación de numeroCartola
            // y la asignación de adminCreadorId desde el contexto de autenticación.
            // La fechaFinEstimada y saldoActual se inicializan en el servicio.
            await createProgrammedSaving(selectedClientId, {
                nombrePlan: formData.nombrePlan,
                montoMeta: formData.montoMeta,
                frecuenciaDepositoSugerida: formData.frecuenciaDepositoSugerida,
                montoDepositoSugerido: formData.montoDepositoSugerido,
                fechaInicioPlan: new Date(formData.fechaInicioPlan), // Convertir a Date object
                // Otros campos como saldoActual, estadoPlan, fechaCreacion, ultimaActualizacion,
                // fechaFinEstimada, adminCreadorId deben ser manejados en el servicio createProgrammedSaving
            });

            toast.success(`Plan de ahorro creado con éxito para ${client.name}.`, { id: toastId });
            navigate(`/portal/admin/ahorros`); // Navega a la lista de ahorros o al detalle del nuevo plan

        } catch (err) {
            toast.error((err as Error).message || 'Error al crear el plan de ahorro.', { id: toastId });
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Muestra un estado de carga mientras se obtienen los clientes
    if (isLoadingClients) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center text-gray-700">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    Cargando lista de clientes...
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
            <Toaster position="top-right" />
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-xl border border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Nuevo Plan de Ahorro Programado</h1>

                {/* Sección de Selección de Cliente */}
                <div className="mb-6 border-b pb-6">
                    <label htmlFor="client-select" className="block text-sm font-semibold text-gray-700 mb-2">
                        Seleccionar Cliente
                    </label>
                    <select
                        id="client-select"
                        value={selectedClientId}
                        onChange={handleClientSelect}
                        className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                        disabled={allClients.length === 0}
                    >
                        <option value="">-- Elige un cliente --</option>
                        {allClients.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.cedula})
                            </option>
                        ))}
                    </select>
                    {allClients.length === 0 && !isLoadingClients && (
                        <p className="text-sm text-gray-500 mt-3 text-center">
                            No hay clientes disponibles. <a href="/portal/admin/clients/new" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">Crea uno nuevo aquí</a>.
                        </p>
                    )}
                </div>

                {/* Mensajes de estado: cargando cliente o error */}
                {isLoadingClientData && (
                    <div className="text-center p-4 text-blue-600">
                        <div className="animate-pulse">Cargando datos del cliente...</div>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-4 text-center">
                        {error}
                    </div>
                )}

                {/* Mensaje si no hay cliente seleccionado */}
                {!selectedClientId && !isLoadingClientData && (
                    <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
                        <p className="text-lg">👋 Por favor, selecciona un cliente para continuar con la creación del plan de ahorro.</p>
                    </div>
                )}

                {/* Formulario de Plan de Ahorro si hay cliente seleccionado */}
                {client && !isLoadingClientData && (
                    <div className="animate-fade-in-up">
                        <div className="mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Datos del Plan para <span className="text-blue-600">{client.name}</span></h2>
                            <p className="text-sm text-gray-600 mt-1">Email: {client.email} | Cédula: {client.cedula}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Nombre del Plan */}
                            <div>
                                <label htmlFor="nombrePlan" className="block text-sm font-medium text-gray-700">Nombre del Plan</label>
                                <input
                                    type="text"
                                    name="nombrePlan"
                                    id="nombrePlan"
                                    value={formData.nombrePlan}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    required
                                />
                            </div>

                            {/* Monto Meta */}
                            <div>
                                <label htmlFor="montoMeta" className="block text-sm font-medium text-gray-700">Monto Meta ($)</label>
                                <input
                                    type="number"
                                    name="montoMeta"
                                    id="montoMeta"
                                    value={formData.montoMeta}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>

                            {/* Monto de Depósito Sugerido */}
                            <div>
                                <label htmlFor="montoDepositoSugerido" className="block text-sm font-medium text-gray-700">Monto de Depósito Sugerido ($)</label>
                                <input
                                    type="number"
                                    name="montoDepositoSugerido"
                                    id="montoDepositoSugerido"
                                    value={formData.montoDepositoSugerido}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>

                            {/* Frecuencia de Depósito Sugerida */}
                            <div>
                                <label htmlFor="frecuenciaDepositoSugerida" className="block text-sm font-medium text-gray-700">Frecuencia de Depósito Sugerida</label>
                                <select
                                    name="frecuenciaDepositoSugerida"
                                    id="frecuenciaDepositoSugerida"
                                    value={formData.frecuenciaDepositoSugerida}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                >
                                    <option value="Mensual">Mensual</option>
                                    <option value="Quincenal">Quincenal</option>
                                    <option value="Semanal">Semanal</option>
                                </select>
                            </div>

                            {/* Fecha de Inicio del Plan */}
                            <div>
                                <label htmlFor="fechaInicioPlan" className="block text-sm font-medium text-gray-700">Fecha de Inicio del Plan</label>
                                <input
                                    type="date"
                                    name="fechaInicioPlan"
                                    id="fechaInicioPlan"
                                    value={formData.fechaInicioPlan}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    required
                                />
                            </div>

                            {/* Botón de Envío */}
                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isLoadingClientData}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                                >
                                    {isSubmitting ? 'Procesando...' : 'Crear Plan de Ahorro'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminNewProgrammedSavingForm;