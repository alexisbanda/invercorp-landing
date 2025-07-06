// src/components/admin/LoanInstallmentsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
// Importamos las funciones correctas del servicio
import { getLoanById, approvePayment, rejectPayment } from '@/services/loanService';
import { Loan, Installment } from '@/types';

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
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{status}</span>;
};

// --- Componente principal de la página ---
export const LoanInstallmentsPage = () => {
    const { loanId } = useParams<{ loanId: string }>();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Guardamos la cuota completa seleccionada
    const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);

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
                // Ordenamos las cuotas por su número para asegurar el orden en la UI
                loanData.installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
                setLoan(loanData);
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

    // Usamos el número de la cuota como identificador
    const handleApprove = async (installmentNumber: number) => {
        if (!loanId) return;
        const toastId = toast.loading('Aprobando pago...');
        try {
            await approvePayment(loanId, installmentNumber);
            toast.success('Pago aprobado con éxito.', { id: toastId });
            fetchLoanDetails(); // Recargamos los datos para ver el cambio
        } catch (err) {
            toast.error('Error al aprobar el pago.', { id: toastId });
        }
    };

    // Guardamos la cuota entera para abrir el modal
    const handleOpenRejectModal = (installment: Installment) => {
        setSelectedInstallment(installment);
        setIsModalOpen(true);
    };

    const handleRejectSubmit = async (reason: string) => {
        if (!loanId || !selectedInstallment) return;

        const { installmentNumber } = selectedInstallment;
        setIsModalOpen(false);
        const toastId = toast.loading('Rechazando pago...');
        try {
            // Pasamos los parámetros correctos a la función del servicio
            await rejectPayment(loanId, installmentNumber, reason);
            toast.success('Pago rechazado correctamente.', { id: toastId });
            fetchLoanDetails(); // Recargamos los datos
        } catch (err) {
            toast.error((err as Error).message || 'Error al rechazar el pago.', { id: toastId });
        } finally {
            setSelectedInstallment(null); // Limpiamos la selección
        }
    };

    if (isLoading) return <div className="p-6 text-center">Cargando detalles del préstamo...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!loan) return <div className="p-6 text-center">Préstamo no disponible.</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            <RejectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleRejectSubmit}
            />

            <div className="max-w-7xl mx-auto">
                <Link to="/portal/admin/management" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver a Gestión</Link>

                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h1 className="text-2xl font-bold mb-2">Detalles del Préstamo: {loan.id}</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><strong>Cliente:</strong> {loan.userName}</div>
                        <div><strong>Email:</strong> {loan.userEmail}</div>
                        <div><strong>Monto:</strong> ${loan.loanAmount.toFixed(2)} {loan.currency}</div>
                        <div><strong>Estado Préstamo:</strong> <StatusBadge status={loan.status} /></div>
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
                        {/* Corregimos la iteración: usamos .map directamente sobre el array */}
                        {loan.installments.map((inst) => (
                            <tr key={inst.installmentNumber} className="hover:bg-gray-50">
                                <td className="py-4 px-4 text-sm font-medium text-gray-900">{inst.installmentNumber}</td>
                                <td className="py-4 px-4 text-sm text-gray-700">${inst.amount.toFixed(2)}</td>
                                <td className="py-4 px-4 text-sm text-gray-500">{formatDate(inst.dueDate)}</td>
                                <td className="py-4 px-4 text-center"><StatusBadge status={inst.status} /></td>
                                <td className="py-4 px-4 text-sm text-gray-600">
                                    {inst.status === 'EN VERIFICACIÓN' && (
                                        <div>
                                            <p><strong>Fecha Reporte:</strong> {formatDate(inst.paymentReportDate)}</p>
                                            <p><strong>Notas Cliente:</strong> {inst.paymentReportNotes || 'N/A'}</p>
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    {inst.status === 'EN VERIFICACIÓN' && (
                                        <div className="flex gap-2 justify-center">
                                            {/* Pasamos el número de la cuota a los handlers */}
                                            <button onClick={() => handleApprove(inst.installmentNumber)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">Aprobar</button>
                                            <button onClick={() => handleOpenRejectModal(inst)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">Rechazar</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};