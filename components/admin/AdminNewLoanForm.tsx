// src/components/admin/AdminNewLoanForm.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { createLoan } from '../../services/loanService';
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

    const [formData, setFormData] = useState({
        loanAmount: 1000,
        interestRate: 15, // Tasa de interés anual
        termInMonths: 12, // Plazo en meses
        paymentFrequency: 'Mensual',
        disbursementDate: new Date().toISOString().split('T')[0], // Fecha de desembolso, formato YYYY-MM-DD
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
            [name]: ['loanAmount', 'interestRate', 'termInMonths'].includes(name) ? Number(value) : value,
        }));
    };

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newClientId = e.target.value;
        setSelectedClientId(newClientId);
        const url = newClientId ? `/portal/admin/loans/new?clientId=${newClientId}` : '/portal/admin/loans/new';
        navigate(url, { replace: true });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedClientId || !client) {
            toast.error('No hay un cliente válido seleccionado.');
            return;
        }

        if (formData.loanAmount <= 0 || formData.interestRate <= 0 || formData.termInMonths <= 0) {
            toast.error('Por favor, completa todos los campos con valores válidos.');
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading('Creando préstamo y generando cuotas...');

        try {
            const newLoanId = await createLoan({
                userId: selectedClientId,
                userName: client.name,
                userEmail: client.email,
                userCedula: client.cedula,
                ...formData,
            });

            toast.success(`Préstamo ${newLoanId} creado con éxito.`, { id: toastId });
            navigate(`/portal/admin/loans/${newLoanId}`);

        } catch (err) {
            toast.error((err as Error).message || 'Error al crear el préstamo.', { id: toastId });
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingClients) {
        return <div className="p-6 text-center">Cargando lista de clientes...</div>;
    }

    return (
        <div className="p-6">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold mb-4">Nuevo Préstamo</h1>

            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <div className="mb-6">
                    <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Seleccionar Cliente
                    </label>
                    <select
                        id="client-select"
                        value={selectedClientId}
                        onChange={handleClientSelect}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        disabled={allClients.length === 0}
                    >
                        <option value="">-- Elige un cliente --</option>
                        {allClients.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({c.cedula})
                            </option>
                        ))}
                    </select>
                    {allClients.length === 0 && !isLoadingClients && <p className="text-sm text-gray-500 mt-2">No hay clientes disponibles. <a href="/portal/admin/clients/new" className="text-blue-600 hover:underline">Crea uno nuevo</a>.</p>}
                </div>

                {isLoadingClientData && <div className="text-center p-4">Cargando datos del cliente...</div>}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                {!selectedClientId && !isLoadingClientData && (
                     <div className="text-center p-4 text-gray-500">
                        Por favor, selecciona un cliente para continuar.
                     </div>
                )}

                {client && !isLoadingClientData && (
                    <div className="animate-fade-in-up">
                        <div className="mb-6 border-b pb-4">
                            <h2 className="text-xl font-semibold">Datos del Préstamo para {client.name}</h2>
                            <p className="text-sm text-gray-500">Email: {client.email}</p>
                            <p className="text-sm text-gray-500">Cédula: {client.cedula}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="loanAmount" className="block text-sm font-medium text-gray-700">Monto del Préstamo ($)</label>
                                <input type="number" name="loanAmount" id="loanAmount" value={formData.loanAmount} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700">Tasa de Interés Anual (%)</label>
                                <input type="number" name="interestRate" id="interestRate" value={formData.interestRate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="termInMonths" className="block text-sm font-medium text-gray-700">Plazo (en meses)</label>
                                <input type="number" name="termInMonths" id="termInMonths" value={formData.termInMonths} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="paymentFrequency" className="block text-sm font-medium text-gray-700">Frecuencia de Pago</label>
                                <select name="paymentFrequency" id="paymentFrequency" value={formData.paymentFrequency} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="Mensual">Mensual</option>
                                    <option value="Quincenal">Quincenal</option>
                                    <option value="Semanal">Semanal</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="disbursementDate" className="block text-sm font-medium text-gray-700">Fecha de Desembolso</label>
                                <input type="date" name="disbursementDate" id="disbursementDate" value={formData.disbursementDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                            </div>
                            <div className="pt-4">
                                <button type="submit" disabled={isSubmitting || isLoadingClientData} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
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