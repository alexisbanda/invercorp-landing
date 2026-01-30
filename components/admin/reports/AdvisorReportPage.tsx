// src/components/admin/reports/AdvisorReportPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { getAdvisorStats, AdvisorStats } from '@/services/reportService';
import { getAllProgrammedSavings } from '@/services/savingsService';
import { getAllServices, NonFinancialService } from '@/services/nonFinancialService';
import { getAllClients } from '@/services/userService'; 
import { ProgrammedSaving, ProgrammedSavingStatus } from '@/types';

export const AdvisorReportPage: React.FC = () => {
    const navigate = useNavigate();
    const [advisors, setAdvisors] = useState<AdvisorStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAdvisorName, setSelectedAdvisorName] = useState('');
    const [modalType, setModalType] = useState<'savings' | 'services' | null>(null);
    const [savingsData, setSavingsData] = useState<(ProgrammedSaving & { clientName?: string })[]>([]);
    const [servicesData, setServicesData] = useState<NonFinancialService[]>([]);
    const [loadingModal, setLoadingModal] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const data = await getAdvisorStats();
            setAdvisors(data);
            setLoading(false);
        })();
    }, []);

    const filteredAdvisors = advisors.filter(advisor => 
        advisor.advisorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleShowSavings = async (advisorId: string, advisorName: string) => {
        setLoadingModal(true);
        setSelectedAdvisorName(advisorName);
        setModalType('savings');
        setIsModalOpen(true);
        setSavingsData([]); // Clear previous
        
        try {
            const [allSavings, advisorClients] = await Promise.all([
                getAllProgrammedSavings(),
                getAllClients(advisorId)
            ]);

            // Create a map for quick access
            const clientMap = new Map(advisorClients.map(c => [c.id, c.name]));

            // Filter by advisor and active status
            const filtered = allSavings
                .filter(s => s.advisorId === advisorId && s.estadoPlan === ProgrammedSavingStatus.ACTIVO)
                .map(s => ({
                    ...s,
                    clientName: clientMap.get(s.clienteId) || 'Desconocido'
                }));
            
            setSavingsData(filtered);
        } catch (error) {
            console.error("Error fetching savings details:", error);
        } finally {
            setLoadingModal(false);
        }
    };

    const handleShowServices = async (advisorId: string, advisorName: string) => {
        setLoadingModal(true);
        setSelectedAdvisorName(advisorName);
        setModalType('services');
        setIsModalOpen(true);
        setServicesData([]); // Clear previous

        try {
            const all = await getAllServices();
             // Filter by advisor and active status
            const filtered = all.filter(s => 
                s.advisorId === advisorId && 
                (s.estadoGeneral === 'EN_EJECUCION' || s.estadoGeneral === 'SOLICITADO')
            );
            setServicesData(filtered);
        } catch (error) {
            console.error("Error fetching services details:", error);
        } finally {
            setLoadingModal(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType(null);
    };

    const handleExport = () => {
        if (!modalType) return;

        let csvData: Record<string, any>[] = [];
        let fileName = '';

        if (modalType === 'savings') {
            fileName = `Ahorros_${selectedAdvisorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            csvData = savingsData.map(s => ({
                'Plan': s.nombrePlan,
                'Cliente': s.clientName,
                'Saldo Actual': s.saldoActual,
                'Meta': s.montoMeta,
                'Número Cartola': s.numeroCartola,
                'Estado': s.estadoPlan,
                'Fecha Inicio': s.fechaInicioPlan ? new Date(s.fechaInicioPlan as any).toLocaleDateString() : ''
            }));
        } else if (modalType === 'services') {
            fileName = `Servicios_${selectedAdvisorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
            csvData = servicesData.map(s => ({
                'Servicio': s.tipoDeServicio,
                'Cliente': s.userName,
                'Estado': s.estadoGeneral,
                'Fecha Solicitud': s.fechaSolicitud && typeof (s.fechaSolicitud as any).toDate === 'function' 
                    ? (s.fechaSolicitud as any).toDate().toLocaleDateString() 
                    : new Date(s.fechaSolicitud as any).toLocaleDateString()
            }));
        }

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando reporte de asesores...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Reporte de Asesores</h1>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center">
                <input 
                    type="text" 
                    placeholder="Buscar asesor..." 
                    className="border border-gray-300 rounded px-4 py-2 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="text-gray-500 text-sm">
                    Total: {filteredAdvisors.length} asesores
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-6 py-4">Nombre del Asesor</th>
                            <th className="px-6 py-4 text-center">Ahorros Activos</th>
                            <th className="px-6 py-4 text-center">Capital Gestionado</th>
                            <th className="px-6 py-4 text-center">Servicios Activos</th>
                            <th className="px-6 py-4 text-center">Efectividad</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredAdvisors.map((advisor) => (
                            <tr key={advisor.advisorId} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{advisor.advisorName}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleShowSavings(advisor.advisorId, advisor.advisorName)}
                                        className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-bold hover:bg-green-200 focus:outline-none"
                                    >
                                        {advisor.activeSavingsCount}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center font-mono">
                                    ${advisor.totalCapitalManaged.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleShowServices(advisor.advisorId, advisor.advisorName)}
                                        className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold hover:bg-blue-200 focus:outline-none"
                                    >
                                        {advisor.activeServicesCount}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {/* Placeholder algorithm for effectiveness */}
                                    <span className="text-xs text-gray-400">N/A</span>
                                </td>
                            </tr>
                        ))}
                        {filteredAdvisors.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                    No se encontraron asesores.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                {modalType === 'savings' ? 'Ahorros Activos' : 'Servicios Activos'} - {selectedAdvisorName}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button onClick={handleExport} className="text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded flex items-center transition-colors">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Exportar
                                </button>
                                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {loadingModal ? (
                                <div className="text-center py-10">Cargando detalles...</div>
                            ) : (
                                <>
                                    {modalType === 'savings' && (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Meta</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Número Cartola</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {savingsData.map((s) => (
                                                    <tr 
                                                        key={s.numeroCartola}
                                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                        onClick={() => navigate(`/portal/admin/savings/${s.clienteId}/${s.numeroCartola}`)}
                                                    >
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.nombrePlan}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{s.clientName}</td> 
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">${(s.saldoActual || 0).toLocaleString()}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">${s.montoMeta.toLocaleString()}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">{s.numeroCartola}</td>
                                                    </tr>
                                                ))}
                                                {savingsData.length === 0 && <tr><td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">No hay ahorros activos.</td></tr>}
                                            </tbody>
                                        </table>
                                    )}

                                    {modalType === 'services' && (
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {servicesData.map((s) => (
                                                    <tr 
                                                        key={s.id} 
                                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                        onClick={() => navigate(`/portal/admin/services/${s.id}`)}
                                                    >
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{s.tipoDeServicio}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{s.userName}</td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                s.estadoGeneral === 'EN_EJECUCION' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {s.estadoGeneral}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                             {/* Handle Firestore Timestamp if exists or string date */}
                                                            {s.fechaSolicitud && typeof (s.fechaSolicitud as any).toDate === 'function' 
                                                                ? (s.fechaSolicitud as any).toDate().toLocaleDateString() 
                                                                : new Date(s.fechaSolicitud as any).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {servicesData.length === 0 && <tr><td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">No hay servicios activos.</td></tr>}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-medium">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
