// components/admin/SavingsManagementPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllProgrammedSavings } from '../../services/savingsService';
import { getAllClients } from '../../services/userService'; // Importar la función para obtener clientes
import { ProgrammedSaving, UserProfile, ProgrammedSavingStatus } from '../../types';

const SavingsManagementPage: React.FC = () => {
    const [savings, setSavings] = useState<ProgrammedSaving[]>([]);
    const [clients, setClients] = useState<UserProfile[]>([]); // Estado para los clientes
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // --- 1. Estado para los filtros ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Obtener los ahorros y los clientes en paralelo
                const [allSavings, allClients] = await Promise.all([
                    getAllProgrammedSavings(),
                    getAllClients()
                ]);
                setSavings(allSavings);
                setClients(allClients);
            } catch (err) {
                setError('Error al cargar los datos.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Crear un mapa de ID de cliente a nombre de cliente para una búsqueda eficiente
    const clientNameMap = useMemo(() => {
        return new Map(clients.map(client => [client.id, client.name]));
    }, [clients]);

    // --- 2. Lógica de filtrado ---
    const filteredSavings = useMemo(() => {
        return savings.filter(saving => {
            // Filtrado por término de búsqueda (nombre del cliente)
            const clientName = clientNameMap.get(saving.clienteId) || '';
            const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtrado por estado del plan
            const matchesStatus = statusFilter ? saving.estadoPlan === statusFilter : true;

            return matchesSearch && matchesStatus;
        });
    }, [savings, searchTerm, statusFilter, clientNameMap]);

    if (isLoading) {
        return <div className="p-6 text-center">Cargando datos...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Gestión de Ahorros Programados</h1>

            {/* --- 3. UI de filtros --- */}
            <div className="mb-4 p-4 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Buscar por nombre de cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto p-2 border border-gray-300 rounded-md"
                >
                    <option value="">Todos los estados</option>
                    {Object.values(ProgrammedSavingStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <button
                    onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Limpiar Filtros
                </button>
            </div>

            {/* --- Vista de Tabla para Escritorio (md y superior) --- */}
            <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* ... Thead se mantiene igual ... */}
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Plan</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Meta</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Actual</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSavings.map((saving) => (
                            <tr key={`${saving.clienteId}-${saving.numeroCartola}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{clientNameMap.get(saving.clienteId) || saving.clienteId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{saving.nombrePlan}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${saving.montoMeta.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${saving.saldoActual.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${saving.estadoPlan === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {saving.estadoPlan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <Link to={`/portal/admin/savings/${saving.clienteId}/${saving.numeroCartola}`} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-xs transition-colors duration-200" title="Ver detalle del ahorro">
                                        Ver Detalle
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- Vista de Tarjetas para Móviles (hasta md) --- */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredSavings.map((saving) => (
                    <div key={`${saving.clienteId}-${saving.numeroCartola}-mobile`} className="bg-white p-4 rounded-lg shadow-md space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-800">{saving.nombrePlan}</p>
                                <p className="text-sm text-gray-600">{clientNameMap.get(saving.clienteId) || 'Cliente no encontrado'}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${saving.estadoPlan === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {saving.estadoPlan}
                            </span>
                        </div>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Saldo Actual:</span>
                                <span className="font-medium">${saving.saldoActual.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Monto Meta:</span>
                                <span className="font-medium">${saving.montoMeta.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="text-right pt-2">
                            <Link to={`/portal/admin/savings/${saving.clienteId}/${saving.numeroCartola}`} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200" title="Ver detalle del ahorro">
                                Ver Detalle
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavingsManagementPage;