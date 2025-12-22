// components/admin/SavingsManagementPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast'; // Add toast import
import { getAllProgrammedSavings, deleteProgrammedSaving } from '../../services/savingsService'; // Add delete function import
import { getAllClients } from '../../services/userService';
import { ProgrammedSaving, UserProfile, ProgrammedSavingStatus } from '../../types';

const SavingsManagementPage: React.FC = () => {
    const [savings, setSavings] = useState<ProgrammedSaving[]>([]);
    const [clients, setClients] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
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

    const clientNameMap = useMemo(() => {
        return new Map(clients.map(client => [client.id, client.name]));
    }, [clients]);

    const filteredSavings = useMemo(() => {
        return savings.filter(saving => {
            const clientName = clientNameMap.get(saving.clienteId) || '';
            const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter ? saving.estadoPlan === statusFilter : true;
            return matchesSearch && matchesStatus;
        });
    }, [savings, searchTerm, statusFilter, clientNameMap]);

    // Handle Delete Function
    const handleDelete = async (saving: ProgrammedSaving) => {
        if (window.confirm('¿Está seguro de eliminar este plan de ahorro? Se eliminarán también todos sus depósitos y retiros. Esta acción no se puede deshacer.')) {
            const loadingId = toast.loading('Eliminando plan de ahorro...');
            try {
                await deleteProgrammedSaving(saving.clienteId, saving.numeroCartola);
                setSavings(prev => prev.filter(s => !(s.clienteId === saving.clienteId && s.numeroCartola === saving.numeroCartola)));
                toast.success('Plan de ahorro eliminado', { id: loadingId });
            } catch (err) {
                console.error(err);
                toast.error('Error al eliminar el plan', { id: loadingId });
            }
        }
    };

    // Helper to format date safely
    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        if (date.toDate) return date.toDate().toLocaleDateString('es-EC');
        if (date instanceof Date) return date.toLocaleDateString('es-EC');
        return 'N/A';
    };

    if (isLoading) {
        return <div className="p-6 text-center">Cargando datos...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold mb-4">Gestión de Ahorros Programados</h1>

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

            <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Plan</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asesor</th>
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(saving.fechaCreacion)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{saving.advisorName || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${saving.montoMeta.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${saving.saldoActual.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${saving.estadoPlan === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {saving.estadoPlan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex justify-center gap-2">
                                        <Link to={`/portal/admin/savings/${saving.clienteId}/${saving.numeroCartola}`} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-xs transition-colors duration-200" title="Ver detalle del ahorro">
                                            Ver Detalle
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(saving)}
                                            className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded-md text-xs transition-colors duration-200 flex items-center"
                                            title="Eliminar Plan"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredSavings.map((saving) => (
                    <div key={`${saving.clienteId}-${saving.numeroCartola}-mobile`} className="bg-white p-4 rounded-lg shadow-md space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-800">{saving.nombrePlan}</p>
                                <p className="text-sm text-gray-600">{clientNameMap.get(saving.clienteId) || 'Cliente no encontrado'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Creado: {formatDate(saving.fechaCreacion)} | Asesor: {saving.advisorName || 'N/A'}
                                </p>
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
                        <div className="text-right pt-2 flex justify-end gap-2">
                             <Link to={`/portal/admin/savings/${saving.clienteId}/${saving.numeroCartola}`} className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200" title="Ver detalle del ahorro">
                                    Ver Detalle
                                </Link>
                             <button
                                onClick={() => handleDelete(saving)}
                                className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200 flex items-center"
                                title="Eliminar Plan"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavingsManagementPage;