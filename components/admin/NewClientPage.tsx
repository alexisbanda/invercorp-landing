// src/components/admin/NewClientPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClientProfile, NewClientData } from '../../services/clientService';
import { getAllAdvisors } from '../../services/advisorService';
import { Advisor, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const NewClientPage: React.FC = () => {
    // --- MEJORA: Usar un solo objeto de estado para el formulario ---
    const [formData, setFormData] = useState<NewClientData & { serviceType: 'saving' | 'loan', advisorId?: string }>({
        name: '',
        email: '',
        password: '', // Campo de contraseña añadido
        phone: '',
        cedula: '',
        numeroCartola: '',
        comment: '',
        serviceType: 'saving',
        advisorId: '',
    });

    const [advisors, setAdvisors] = useState<Advisor[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const isAdvisor = userProfile?.role === UserRole.ADVISOR;

    useEffect(() => {
        const fetchAdvisors = async () => {
            try {
                const advisorsData = await getAllAdvisors();
                setAdvisors(advisorsData);
            } catch (err) {
                console.error("Error fetching advisors:", err);
            }
        };
        fetchAdvisors();
    }, []);

    // Set default advisor if the user is an advisor
    useEffect(() => {
        if (isAdvisor && userProfile?.advisorCollectionId) {
            setFormData(prev => ({
                ...prev,
                advisorId: userProfile.advisorCollectionId
            }));
        }
    }, [isAdvisor, userProfile]);

    // --- MEJORA: Un solo manejador para todos los inputs ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        // Validation for Admin: Must select an advisor
        if (!isAdvisor && !formData.advisorId) {
            setError("Por favor, selecciona un asesor responsable para este cliente.");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Crear el usuario de autenticación y el perfil del cliente en Firestore
            // Se pasa el objeto de estado completo, que ya coincide con la interfaz NewClientData
            // Nota: createClientProfile debe ser actualizado para aceptar advisorId
            const newClientId = await createClientProfile({
                ...formData,
                advisorCollectionId: formData.advisorId
            } as any); 

            console.log(`Perfil de cliente creado en Firestore con ID: ${newClientId}`);

            // 2. Redirigir al formulario del servicio correspondiente con el ID del nuevo cliente
            if (formData.serviceType === 'saving') {
                navigate(`/portal/admin/savings/new?clientId=${newClientId}`);
            } else {
                navigate(`/portal/admin/loans/new?clientId=${newClientId}`);
            }

        } catch (err) {
            setError((err as Error).message || 'Hubo un error al crear el perfil del cliente. Por favor, inténtalo de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen flex items-center justify-center">
            <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-xl border border-gray-200">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Crear Nuevo Cliente</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Nombre Completo del Cliente
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Correo Electrónico
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                            Contraseña Temporal
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                            Número de Teléfono
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="cedula" className="block text-sm font-semibold text-gray-700 mb-2">
                            Cédula de Identidad o RUC
                        </label>
                        <input
                            type="text"
                            id="cedula"
                            name="cedula"
                            value={formData.cedula}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="numeroCartola" className="block text-sm font-semibold text-gray-700 mb-2">
                            Número de Cartola
                        </label>
                        <input
                            type="text"
                            id="numeroCartola"
                            name="numeroCartola"
                            value={formData.numeroCartola}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {/* Selector de Asesor */}
                    <div>
                        <label htmlFor="advisorId" className="block text-sm font-semibold text-gray-700 mb-2">
                            Asesor Responsable
                        </label>
                        <select
                            id="advisorId"
                            name="advisorId"
                            value={formData.advisorId}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                            required={!isAdvisor}
                            disabled={isAdvisor || advisors.length === 0}
                        >
                            <option value="">-- Selecciona un asesor --</option>
                            {advisors.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.nombre}
                                </option>
                            ))}
                        </select>
                        {advisors.length === 0 && !isAdvisor && (
                            <p className="text-sm text-red-500 mt-1">No hay asesores disponibles. Crea uno primero.</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
                            Comentario (Opcional)
                        </label>
                        <textarea
                            id="comment"
                            name="comment"
                            value={formData.comment}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                        />
                    </div>

                    <div>
                        <label htmlFor="serviceType" className="block text-sm font-semibold text-gray-700 mb-2">
                            Servicio Inicial
                        </label>
                        <select
                            id="serviceType"
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleChange}
                            className="mt-1 block w-full px-4 py-2 text-base border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="saving">Ahorro Programado</option>
                            <option value="loan">Préstamo</option>
                        </select>
                    </div>

                    <div className="pt-6">
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed">
                            {isLoading ? 'Creando...' : 'Crear Cliente y Continuar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewClientPage;