// src/components/admin/LoanInstallmentsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
// Importamos las funciones correctas del servicio
import { getLoanById, approvePayment, rejectPayment, reportPaymentForInstallment } from '@/services/loanService';
import { getUserProfile } from '../../services/userService';
import { Loan, Installment, UserProfile } from '@/types';
import { Timestamp } from 'firebase/firestore'; // Es una buena práctica importar el tipo

// --- Definición de tipo para el historial de estados ---
// Para mayor precisión, el tipo de la fecha que viene de Firestore es Timestamp.
interface StatusChange {
    status: string;
    date: Timestamp;
    notes?: string;
    updatedBy?: string;
}

// --- Modal para reportar pago (inspirado en DashboardPage) ---
const ReportPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (notes: string) => void;
    installmentNumber: number | null;
    isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, installmentNumber, isSubmitting }) => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNotes('');
        }
    }, [isOpen]);

    if (!isOpen || installmentNumber === null) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(notes);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all duration-300 scale-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Reportar Pago de Cuota #{installmentNumber}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">
                            Comentario (Opcional)
                        </label>
                        <textarea
                            id="paymentNotes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Ej: Cliente pagó en efectivo en la oficina."
                        />
                        <p className="text-xs text-gray-500 mt-1">Añade una nota para registrar el método o detalles del pago.</p>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-wait">
                            {isSubmitting ? 'Enviando...' : 'Confirmar Reporte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Componente para el modal de rechazo (sin cambios) ---
const RejectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) {
            toast.error('Debes ingresar un motivo de rechazo.');
            return;
        }
        onSubmit(reason);
        setReason('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Motivo del Rechazo</h3>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Ej: Comprobante ilegible, monto incorrecto..."
                />
                <div className="mt-4 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirmar Rechazo</button>
                </div>
            </div>
        </div>
    );
};

// --- Componente de utilidad para formatear fechas (sin cambios) ---
const formatDate = (date: Date | undefined | null): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
};

// --- Componente para las insignias de estado (sin cambios) ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const baseClasses = "inline-block px-2 py-1 text-xs font-semibold rounded-full leading-tight";
    let colorClasses = "bg-gray-200 text-gray-800";

    switch (status) {
        case 'PAGADO': colorClasses = "bg-green-200 text-green-800"; break;
        case 'VENCIDO': colorClasses = "bg-red-200 text-red-800"; break;
        case 'EN VERIFICACIÓN': colorClasses = "bg-yellow-200 text-yellow-800"; break;
        case 'PENDIENTE': colorClasses = "bg-blue-200 text-blue-800"; break;
        case 'POR VENCER': colorClasses = "bg-blue-200 text-blue-800"; break;
        case 'SOLICITADO': colorClasses = "bg-gray-200 text-gray-800"; break;
        case 'DESEMBOLSADO': colorClasses = "bg-purple-200 text-purple-800"; break;
        case 'RECHAZADO': colorClasses = "bg-red-200 text-red-800"; break;
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};

// --- Componente principal de la página ---
export const LoanInstallmentsPage = () => {
    const { loanId } = useParams<{ loanId: string }>();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [client, setClient] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados para los modales
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [installmentToReject, setInstallmentToReject] = useState<Installment | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [installmentToReport, setInstallmentToReport] = useState<Installment | null>(null);
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);


    const fetchLoanDetails = useCallback(async () => {
        if (!loanId) {
            setError('No se proporcionó un ID de préstamo.');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const loanData = await getLoanById(loanId);
            if (loanData) {
                loanData.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
                setLoan(loanData);
                const clientData = await getUserProfile(loanData.userId);
                setClient(clientData);
            }
            else setError('El préstamo solicitado no fue encontrado.');
        } catch (err) {
            console.error("Error al obtener detalles del préstamo:", err);
            setError('Ocurrió un error al cargar los detalles del préstamo.');
        } finally {
            setIsLoading(false);
        }
    }, [loanId]);

    useEffect(() => {
        fetchLoanDetails();
    }, [fetchLoanDetails]);

    const handleApprove = async (installmentNumber: number) => {
        if (!loanId) return;
        const toastId = toast.loading('Aprobando pago...');
        try {
            await approvePayment(loanId, installmentNumber);
            toast.success('Pago aprobado con éxito.', { id: toastId });
            fetchLoanDetails();
        } catch (err) {
            toast.error('Error al aprobar el pago.', { id: toastId });
        }
    };

    const handleOpenRejectModal = (installment: Installment) => {
        setInstallmentToReject(installment);
        setIsRejectionModalOpen(true);
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!loanId || !installmentToReject) return;
        const { installmentNumber } = installmentToReject;
        setIsRejectionModalOpen(false);
        const toastId = toast.loading('Rechazando pago...');
        try {
            await rejectPayment(loanId, installmentNumber, reason);
            toast.success('Pago rechazado correctamente.', { id: toastId });
            fetchLoanDetails();
        } catch (err) {
            toast.error((err as Error).message || 'Error al rechazar el pago.', { id: toastId });
        } finally {
            setInstallmentToReject(null);
        }
    };

    // --- Handlers para reportar pago ---
    const handleOpenReportModal = (installment: Installment) => {
        setInstallmentToReport(installment);
        setIsReportModalOpen(true);
    };

    const handleReportSubmit = async (notes: string) => {
        if (!loanId || !installmentToReport) return;

        setIsSubmittingReport(true);
        const toastId = toast.loading('Reportando pago...');

        try {
            await reportPaymentForInstallment(loanId, installmentToReport.installmentNumber, { paymentReportNotes: notes });
            toast.success('Pago reportado con éxito.', { id: toastId });
            fetchLoanDetails(); // Recargar datos para ver el cambio de estado
        } catch (err) {
            console.error("Error al reportar el pago:", err);
            toast.error('Hubo un error al reportar el pago.', { id: toastId });
            throw err;
        } finally {
            setIsSubmittingReport(false);
            setIsReportModalOpen(false);
            setInstallmentToReport(null);
        }
    };


    if (isLoading) return <div className="p-6 text-center">Cargando detalles del préstamo...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!loan) return <div className="p-6 text-center">Préstamo no disponible.</div>;

    // Helper para convertir fechas de forma segura
    const safeFormatDate = (date: any): string => {
        if (date && typeof date.toDate === 'function') {
            return formatDate(date.toDate());
        }
        // Si ya es un objeto Date, también funcionará
        return formatDate(date);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                onSubmit={handleRejectSubmit}
            />
            <ReportPaymentModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                onSubmit={handleReportSubmit}
                installmentNumber={installmentToReport?.installmentNumber || null}
                isSubmitting={isSubmittingReport}
            />

            <div className="max-w-7xl mx-auto">
                <Link to="/portal/admin/management" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver a Gestión</Link>

                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h1 className="text-2xl font-bold mb-2">Detalles del Préstamo: {loan.id}</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><strong>Cliente:</strong> {loan.userName}</div>
                        <div><strong>No. Cartola:</strong> {client?.numeroCartola}</div>
                        <div><strong>Email:</strong> {loan.userEmail}</div>
                        <div><strong>Monto:</strong> ${loan.loanAmount.toFixed(2)} {loan.currency}</div>
                        <div><strong>Estado Préstamo:</strong> <StatusBadge status={loan.status} /></div>
                        <div><strong>Asesor:</strong> {loan.advisorName}</div>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-4">Cuotas</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                        <tr>
                            {['#', 'Monto', 'Vencimiento', 'Estado', 'Info de Pago Reportado', 'Acciones'].map(header => (
                                <th key={header} className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loan.installments.map((inst) => (
                            <tr key={inst.installmentNumber} className="hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm font-medium text-gray-900">{inst.installmentNumber}</td>
                                <td className="py-4 px-4 text-sm text-gray-700">${inst.amount.toFixed(2)}</td>
                                {/* CORRECCIÓN APLICADA AQUÍ */}
                                <td className="py-4 px-4 text-sm text-gray-500">{safeFormatDate(inst.dueDate)}</td>
                                <td className="py-4 px-4 text-center"><StatusBadge status={inst.status} /></td>
                                <td className="py-4 px-4 text-sm text-gray-600">
                                    {inst.status === 'EN VERIFICACIÓN' && (
                                        <div>
                                            {/* CORRECCIÓN APLICADA AQUÍ */}
                                            <p><strong>Fecha Reporte:</strong> {safeFormatDate(inst.paymentReportDate)}</p>
                                            <p><strong>Notas Cliente:</strong> {inst.paymentReportNotes || 'N/A'}</p>
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <div className="flex gap-2 justify-center">
                                        {inst.status === 'EN VERIFICACIÓN' && (
                                            <>
                                                <button onClick={() => handleApprove(inst.installmentNumber)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">Aprobar</button>
                                                <button onClick={() => handleOpenRejectModal(inst)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Rechazar</button>
                                            </>
                                        )}
                                        {(inst.status === 'POR VENCER' || inst.status === 'VENCIDO' || inst.status === 'PENDIENTE') && (
                                            <button
                                                onClick={() => handleOpenReportModal(inst)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                            >
                                                Reportar Pago
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* --- SECCIÓN DE HISTORIAL DE ESTADOS --- */}
                {loan.statusHistory && loan.statusHistory.length > 0 && (
                    <>
                        <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4">Historial de Estados</h2>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <ul className="space-y-4">
                                {loan.statusHistory
                                    .slice()
                                    .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
                                    .map((historyItem, index) => (
                                        <li key={index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                                {loan.statusHistory.length - index}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800">
                                                    <StatusBadge status={historyItem.status} />
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {/* CORRECCIÓN APLICADA AQUÍ */}
                                                    {safeFormatDate(historyItem.date)}
                                                </p>
                                                {historyItem.notes && (
                                                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-md">
                                                        <strong>Nota:</strong> {historyItem.notes}
                                                    </p>
                                                )}
                                                {historyItem.updatedBy && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Actualizado por: {historyItem.updatedBy}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};