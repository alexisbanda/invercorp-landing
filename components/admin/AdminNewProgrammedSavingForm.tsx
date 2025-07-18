// components/admin/AdminNewProgrammedSavingForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createProgrammedSaving } from '../../services/savingsService';
import { useNavigate } from 'react-router-dom';
import { ProgrammedSaving } from '../../types';

const AdminNewProgrammedSavingForm: React.FC = () => {
    const [clienteId, setClienteId] = useState('');
    const [formData, setFormData] = useState<Omit<ProgrammedSaving, 'numeroCartola' | 'clienteId' | 'saldoActual' | 'estadoPlan' | 'fechaCreacion' | 'ultimaActualizacion'>>({
        nombrePlan: '',
        montoMeta: 0,
        frecuenciaDepositoSugerida: 'Mensual',
        montoDepositoSugerido: 0,
        fechaInicioPlan: new Date(),
        fechaFinEstimada: new Date(),
        adminCreadorId: '', // Se seteará desde currentUser
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'montoMeta' || name === 'montoDepositoSugerido' ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            setError("Debes estar autenticado.");
            return;
        }
        if (!clienteId) {
            setError("Debes especificar el ID del cliente.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const planData = {
                ...formData,
                adminCreadorId: currentUser.uid,
            };
            await createProgrammedSaving(clienteId, planData);
            navigate('/portal/admin/ahorros');
        } catch (err) {
            setError("Error al crear el plan de ahorro. Verifica que el ID del cliente sea correcto.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-2xl">
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Crear Plan de Ahorro para Cliente</h1>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700 mb-1">ID del Cliente (User ID)</label>
                        <input
                            type="text"
                            id="clienteId"
                            name="clienteId"
                            value={clienteId}
                            onChange={(e) => setClienteId(e.target.value)}
                            placeholder='ID de Firebase del usuario cliente'
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <hr/>

                    <div>
                        <label htmlFor="nombrePlan" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Plan</label>
                        <input
                            type="text"
                            id="nombrePlan"
                            name="nombrePlan"
                            value={formData.nombrePlan}
                            onChange={handleChange}
                            placeholder='Ej: Ahorro para la universidad'
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="montoMeta" className="block text-sm font-medium text-gray-700 mb-1">Monto Meta ($)</label>
                        <input
                            type="number"
                            id="montoMeta"
                            name="montoMeta"
                            value={formData.montoMeta}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="frecuenciaDepositoSugerida" className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de Depósito</label>
                        <select
                            id="frecuenciaDepositoSugerida"
                            name="frecuenciaDepositoSugerida"
                            value={formData.frecuenciaDepositoSugerida}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Semanal">Semanal</option>
                            <option value="Quincenal">Quincenal</option>
                            <option value="Mensual">Mensual</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="montoDepositoSugerido" className="block text-sm font-medium text-gray-700 mb-1">Monto de Depósito Sugerido ($)</label>
                        <input
                            type="number"
                            id="montoDepositoSugerido"
                            name="montoDepositoSugerido"
                            value={formData.montoDepositoSugerido}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="button" 
                            onClick={() => navigate('/portal/admin/ahorros')} 
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg mr-4 transition duration-300"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition duration-300 disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Creando Plan...' : 'Crear Plan para Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminNewProgrammedSavingForm;
