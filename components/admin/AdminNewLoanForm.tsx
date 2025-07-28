// src/components/admin/AdminNewLoanForm.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { createLoan } from '../../services/loanService'; // Assuming createLoan can handle termValue and paymentFrequency
import { getAllClients, getUserProfile } from '../../services/userService';
import { UserProfile } from '../../types';

// Hook para parsear query params de la URL
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const AdminNewLoanForm: React.FC = () => {
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

    // Estado del formulario ajustado para la nueva lógica de plazo
    const [formData, setFormData] = useState({
        loanAmount: 1000,
        interestRate: 15, // Tasa de interés anual
        paymentFrequency: 'Mensual', // Frecuencia de pago seleccionada
        termValue: 12, // Valor del plazo (ej. 12 meses, 24 quincenas, 48 semanas)
        disbursementDate: new Date().toISOString().split('T')[0], // Fecha de desembolso, formato YYYY-MM-DD
    });

    // Estado derivado para la unidad de plazo a mostrar en la UI
    const getTermUnit = (frequency: string) => {
        switch (frequency) {
            case 'Semanal':
                return 'semanas';
            case 'Quincenal':
                return 'quincenas';
            case 'Mensual':
            default:
                return 'meses';
        }
    };

    const [termUnit, setTermUnit] = useState<string>(getTermUnit(formData.paymentFrequency));

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

    // Actualizar la unidad de plazo cuando cambia la frecuencia de pago
    useEffect(() => {
        setTermUnit(getTermUnit(formData.paymentFrequency));
    }, [formData.paymentFrequency]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let newValue: string | number = value;
            if (['loanAmount', 'interestRate', 'termValue'].includes(name)) {
                newValue = Number(value);
            }
            return {
                ...prev,
                [name]: newValue,
            };
        });
    };

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClientId = e.target.value;
        setSelectedClientId(newClientId);
        // Actualizar la URL para reflejar el cliente seleccionado
        const url = newClientId ? `/portal/admin/loans/new?clientId=${newClientId}` : '/portal/admin/loans/new';
        navigate(url, { replace: true });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedClientId || !client) {
            toast.error('No hay un cliente válido seleccionado.');
            return;
        }

        // Validaciones básicas del formulario
        if (formData.loanAmount <= 0 || formData.interestRate <= 0 || formData.termValue <= 0) {
            toast.error('Por favor, completa todos los campos con valores válidos.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Creando préstamo y generando cuotas...');

        try {
            // Se asume que createLoan ahora acepta termValue y paymentFrequency
            // y que la lógica para calcular el número total de períodos se manejará en el servicio.
            const newLoanId = await createLoan({
                userId: selectedClientId,
                userName: client.name,
                userEmail: client.email,
                userCedula: client.cedula,
                loanAmount: formData.loanAmount,
                interestRate: formData.interestRate,
                paymentFrequency: formData.paymentFrequency, // Pasa la frecuencia
                termValue: formData.termValue, // Pasa el valor del plazo
                disbursementDate: formData.disbursementDate,
            });

            toast.success(`Préstamo ${newLoanId} creado con éxito.`, { id: toastId });
            navigate(`/portal/admin/loans/${newLoanId}`); // Navega al detalle del nuevo préstamo

        } catch (err) {
            toast.error((err as Error).message || 'Error al crear el préstamo.', { id: toastId });
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
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Nuevo Préstamo</h1>

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
                        <p className="text-lg">👋 Por favor, selecciona un cliente para continuar con la creación del préstamo.</p>
                    </div>
                )}

                {/* Formulario de Préstamo si hay cliente seleccionado */}
                {client && !isLoadingClientData && (
                    <div className="animate-fade-in-up">
                        <div className="mb-6 border-b pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Datos del Préstamo para <span className="text-blue-600">{client.name}</span></h2>
                            <p className="text-sm text-gray-600 mt-1">Email: {client.email} | Cédula: {client.cedula}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Monto del Préstamo */}
                            <div>
                                <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">Monto del Préstamo ($)</label>
                                <input
                                    type="number"
                                    name="loanAmount"
                                    id="loanAmount"
                                    value={formData.loanAmount}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>

                            {/* Tasa de Interés Anual */}
                            <div>
                                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">Tasa de Interés Anual (%)</label>
                                <input
                                    type="number"
                                    name="interestRate"
                                    id="interestRate"
                                    value={formData.interestRate}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>

                            {/* Frecuencia de Pago */}
                            <div>
                                <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700">Frecuencia de Pago</label>
                                <select
                                    name="paymentFrequency"
                                    id="paymentFrequency"
                                    value={formData.paymentFrequency}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                >
                                    <option value="Mensual">Mensual</option>
                                    <option value="Quincenal">Quincenal</option>
                                    <option value="Semanal">Semanal</option>
                                </select>
                            </div>

                            {/* Plazo (adaptativo según la frecuencia) */}
                            <div>
                                <label htmlFor="termValue" className="block text-sm font-medium text-gray-700">Plazo (en {termUnit})</label>
                                <input
                                    type="number"
                                    name="termValue"
                                    id="termValue"
                                    value={formData.termValue}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                                    required
                                    min="1"
                                />
                            </div>

                            {/* Fecha de Desembolso */}
                            <div>
                                <label htmlFor="disbursementDate" className="block text-sm font-medium text-gray-700">Fecha de Desembolso</label>
                                <input
                                    type="date"
                                    name="disbursementDate"
                                    id="disbursementDate"
                                    value={formData.disbursementDate}
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
                                    {isSubmitting ? 'Procesando...' : 'Crear Préstamo'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminNewLoanForm;