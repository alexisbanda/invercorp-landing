// src/components/admin/AdminNewLoanForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { createLoan } from '../../services/loanService';
import { getUserProfile } from '../../services/userService'; // Asumiendo que getUserProfile existe
import { UserProfile } from '../../types';


// Hook para parsear query params de la URL
const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const AdminNewLoanForm: React.FC = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const clientId = query.get('clientId');

    const [client, setClient] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        loanAmount: 1000,
        interestRate: 15, // Tasa de interés anual
        termInMonths: 12, // Plazo en meses
        paymentFrequency: 'Mensual',
        disbursementDate: new Date().toISOString().split('T')[0], // Fecha de desembolso, formato YYYY-MM-DD
    });

    // Cargar datos del cliente al montar el componente
    const fetchClient = useCallback(async () => {
        if (clientId) {
            setIsLoading(true);
            try {
                const clientData = await getUserProfile(clientId);
                if (clientData) {
                    setClient(clientData);
                } else {
                    setError(`No se encontró un cliente con el ID: ${clientId}`);
                }
            } catch (err) {
                setError('Error al cargar los datos del cliente.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        } else {
            setError('No se ha especificado un ID de cliente. Por favor, crea un cliente primero o selecciónalo.');
            setIsLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'loanAmount' || name === 'interestRate' || name === 'termInMonths' ? Number(value) : value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!clientId || !client) {
            toast.error('No hay un cliente válido seleccionado.');
            return;
        }

        if (formData.loanAmount <= 0 || formData.interestRate <= 0 || formData.termInMonths <= 0) {
            toast.error('Por favor, completa todos los campos con valores válidos.');
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Creando préstamo y generando cuotas...');

        try {
            // Esta función se encargará de la lógica de amortización y creación en Firestore
            const newLoanId = await createLoan({
                userId: clientId,
                userName: client.name,
                userEmail: client.email,
                userCedula: client.cedula,
                ...formData,
            });

            toast.success(`Préstamo ${newLoanId} creado con éxito.`, { id: toastId });
            // En un futuro, redirigiremos a la página de detalle del nuevo préstamo
            // navigate(`/portal/admin/management/${newLoanId}`); 

        } catch (err) {
            toast.error((err as Error).message || 'Error al crear el préstamo.', { id: toastId });
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">Cargando información del cliente...</div>;
    }

    return (
        <div className="p-6">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold mb-4">Nuevo Préstamo</h1>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            )}

            {client && (
                <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                    <div className="mb-6 border-b pb-4">
                        <h2 className="text-xl font-semibold">Cliente Seleccionado</h2>
                        <p><strong>Nombre:</strong> {client.name}</p>
                        <p><strong>Email:</strong> {client.email}</p>
                        <p><strong>Cédula:</strong> {client.cedula}</p>
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
                                <option>Mensual</option>
                                <option>Quincenal</option>
                                <option>Semanal</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="disbursementDate" className="block text-sm font-medium text-gray-700">Fecha de Desembolso</label>
                            <input type="date" name="disbursementDate" id="disbursementDate" value={formData.disbursementDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                        <div className="pt-4">
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                                {isLoading ? 'Procesando...' : 'Crear Préstamo'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminNewLoanForm;