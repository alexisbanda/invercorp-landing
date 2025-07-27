// src/components/admin/NewClientPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClientProfile, NewClientData } from '../../services/clientService';

const NewClientPage: React.FC = () => {
    // --- MEJORA: Usar un solo objeto de estado para el formulario ---
    const [formData, setFormData] = useState<NewClientData & { serviceType: 'saving' | 'loan' }>({
        name: '',
        email: '',
        password: '', // Campo de contraseña añadido
        phone: '',
        cedula: '',
        comment: '',
        serviceType: 'saving',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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

        try {
            // 1. Crear el usuario de autenticación y el perfil del cliente en Firestore
            // Se pasa el objeto de estado completo, que ya coincide con la interfaz NewClientData
            const newClientId = await createClientProfile(formData);

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
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Crear Nuevo Cliente</h1>
            <form onSubmit={handleSubmit} className="max-w-lg bg-white p-8 rounded-lg shadow">
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
                
                <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                        Nombre Completo del Cliente
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>

                {/* --- CAMPO DE CONTRASEÑA AÑADIDO --- */}
                <div className="mb-4">
                    <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                        Contraseña Temporal
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="phone" className="block text-gray-700 text-sm font-bold mb-2">
                        Número de Teléfono
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="cedula" className="block text-gray-700 text-sm font-bold mb-2">
                        Cédula de Identidad o RUC
                    </label>
                    <input
                        type="text"
                        id="cedula"
                        name="cedula"
                        value={formData.cedula}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="comment" className="block text-gray-700 text-sm font-bold mb-2">
                        Comentario (Opcional)
                    </label>
                    <textarea
                        id="comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        rows={3}
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="serviceType" className="block text-gray-700 text-sm font-bold mb-2">
                        Servicio Inicial
                    </label>
                    <select
                        id="serviceType"
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                        <option value="saving">Ahorro Programado</option>
                        <option value="loan">Préstamo</option>
                    </select>
                </div>

                <div className="flex items-center justify-between">
                    <button type="submit" disabled={isLoading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300">
                        {isLoading ? 'Creando...' : 'Crear Cliente y Continuar'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewClientPage;