// src/components/admin/LoanManagementPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { db } from '../../firebase-config';
import { Loan, LoanStatus, Installment } from '../../types'; // Asegúrate de importar Installment
import { ChangeStatusModal } from './ChangeStatusModal';

// --- Componente para el modal de confirmación de eliminación ---
const DeleteConfirmationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loanId: string | null;
    isDeleting: boolean;
}> = ({ isOpen, onClose, onConfirm, loanId, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-red-700 mb-4">Confirmar Eliminación</h3>
                <p className="text-gray-700 mb-2">
                    ¿Estás absolutamente seguro de que quieres eliminar el préstamo <strong>{loanId}</strong>?
                </p>
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    <strong>¡Atención!</strong> Esta acción es irreversible y eliminará permanentemente todos los datos asociados al préstamo.
                </p>
                <div className="flex justify-end gap-4 mt-6">
                    <button 
                        onClick={onClose} 
                        disabled={isDeleting}
                        className="px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// (El componente StatusBadge no cambia)
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full leading-tight";
    let colorClasses = "bg-gray-100 text-gray-800";

    switch (status) {
        case 'APROBADO':
        case 'DESEMBOLSADO':
            colorClasses = "bg-blue-100 text-blue-800";
            break;
        case 'COMPLETADO':
            colorClasses = "bg-green-100 text-green-800";
            break;
        case 'RECHAZADO':
            colorClasses = "bg-red-100 text-red-800";
            break;
        case 'EN_REVISION':
        case 'SOLICITADO':
            colorClasses = "bg-yellow-100 text-yellow-800";
            break;
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status.replace('_', ' ')}</span>;
};

// --- 1. (NUEVO) Componente para el badge de verificación, igual que en el otro archivo ---
const VerificationPendingBadge: React.FC = () => (
    <span
        className="ml-2 px-2 py-1 text-xs font-bold text-yellow-800 bg-yellow-200 rounded-full animate-pulse"
        title="Este préstamo tiene una o más cuotas pendientes de verificación"
    >
        REQUIERE ATENCIÓN
    </span>
);


export const LoanManagementPage = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
    const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchLoans = async () => {
        setIsLoading(true);
        try {
            const loansCollection = collection(db, 'loans');
            const loansSnapshot = await getDocs(loansCollection);

            // --- LÓGICA DE MAPEO MEJORADA PARA INCLUIR CUOTAS ---
            const loansData = loansSnapshot.docs.map(doc => {
                const data = doc.data();

                // Procesamos el array de cuotas para convertir Timestamps a Dates
                const installmentsSource = Array.isArray(data.installments) ? data.installments : [];
                const formattedInstallments = installmentsSource.map((inst: any) => ({
                    ...inst,
                    dueDate: inst.dueDate?.toDate(),
                    paymentDate: inst.paymentDate?.toDate(),
                    paymentReportDate: inst.paymentReportDate?.toDate(),
                    paymentConfirmationDate: inst.paymentConfirmationDate?.toDate(),
                }));

                return {
                    id: doc.id,
                    ...data,
                    applicationDate: (data.applicationDate as Timestamp)?.toDate(),
                    disbursementDate: (data.disbursementDate as Timestamp)?.toDate(),
                    installments: formattedInstallments, // Usamos las cuotas formateadas
                } as Loan;
            });
            setLoans(loansData);
        } catch (error) {
            console.error("Error al cargar los préstamos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLoans();
    }, []);

    const handleOpenStatusModal = (loan: Loan) => {
        setSelectedLoan(loan);
    };

    const handleOpenDeleteModal = (loan: Loan) => {
        setLoanToDelete(loan);
    };

    const handleConfirmDelete = async () => {
        if (!loanToDelete) return;

        setIsDeleting(true);
        const toastId = toast.loading('Eliminando préstamo...');

        try {
            const loanDocRef = doc(db, 'loans', loanToDelete.id);
            await deleteDoc(loanDocRef);

            setLoans(prevLoans => prevLoans.filter(l => l.id !== loanToDelete.id));
            
            toast.success('Préstamo eliminado con éxito.', { id: toastId });
            setLoanToDelete(null);
        } catch (error) {
            console.error("Error al eliminar el préstamo:", error);
            toast.error('No se pudo eliminar el préstamo.', { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            const matchesSearch =
                loan.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                loan.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter ? loan.status === statusFilter : true;
            return matchesSearch && matchesStatus;
        });
    }, [loans, searchTerm, statusFilter]);

    if (isLoading) {
        return <div className="p-6 text-center">Cargando préstamos...</div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <Toaster position="top-right" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Préstamos</h1>

            {/* --- UI de filtros (sin cambios) --- */}
            <div className="mb-4 p-4 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Buscar por cliente o email..."
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
                    {Object.values(LoanStatus).map(status => (
                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                </select>
                <button
                    onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                    className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Limpiar Filtros
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Solicitud</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLoans.map((loan) => {
                            // --- 2. (NUEVO) Lógica de verificación, igual que en el otro archivo ---
                            const hasPendingVerification = loan.installments?.some(
                                (inst) => inst.status?.trim().toUpperCase() === 'EN VERIFICACIÓN'
                            );

                            return (
                                <tr key={loan.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{loan.userName}</div>
                                        <div className="text-sm text-gray-500">{loan.userEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${loan.loanAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {loan.applicationDate?.toLocaleDateString('es-EC') ?? 'N/A'}
                                    </td>
                                    {/* --- 3. (MODIFICADO) Celda de estado con el badge condicional --- */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center">
                                            <StatusBadge status={loan.status} />
                                            {hasPendingVerification && <VerificationPendingBadge />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* El link ahora apunta a la página de detalle de cuotas */}
                                            <Link
                                                to={`/portal/admin/management/${loan.id}`}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-xs transition-colors duration-200"
                                                title="Ver detalle de cuotas"
                                            >
                                                Ver Cuotas
                                            </Link>
                                            <button
                                                onClick={() => handleOpenStatusModal(loan)}
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-md text-xs transition-colors duration-200"
                                                title="Cambiar estado del préstamo"
                                            >
                                                Cambiar Estado
                                            </button>
                                            <button
                                                onClick={() => handleOpenDeleteModal(loan)}
                                                className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md text-xs transition-colors duration-200"
                                                title="Eliminar préstamo"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedLoan && (
                <ChangeStatusModal
                    loan={selectedLoan}
                    onClose={() => setSelectedLoan(null)}
                    onStatusChange={() => {
                        fetchLoans();
                    }}
                />
            )}

            {loanToDelete && (
                <DeleteConfirmationModal
                    isOpen={!!loanToDelete}
                    onClose={() => setLoanToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    loanId={loanToDelete.id}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
};