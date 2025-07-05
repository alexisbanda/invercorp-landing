// src/components/admin/LoanInstallmentsPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase-config.ts';
import { Loan, Installment, StatusChange } from '@/types.ts';

// Componente de utilidad para formatear fechas de forma segura
const formatDate = (date: Date | undefined): string => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Fecha no disponible';
    }
    return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

// --- MEJORA: Componente de estado unificado para préstamos y cuotas ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const baseClasses = "inline-block px-2 py-1 text-xs font-semibold rounded-full leading-tight";
    let colorClasses = "bg-gray-100 text-gray-800";

    switch (status) {
        // Loan Statuses
        case 'APROBADO':
        case 'DESEMBOLSADO':
            colorClasses = "bg-blue-100 text-blue-800";
            break;
        case 'COMPLETADO':
        case 'PAGADO': // Combined
            colorClasses = "bg-green-100 text-green-800";
            break;
        case 'RECHAZADO':
        case 'VENCIDO': // Combined
            colorClasses = "bg-red-100 text-red-800";
            break;
        case 'EN_REVISION':
        case 'SOLICITADO':
        case 'PENDIENTE': // Combined
            colorClasses = "bg-yellow-100 text-yellow-800";
            break;
        default:
            colorClasses = "bg-gray-100 text-gray-800";
            break;
    }
    // Reemplaza guiones bajos para una mejor visualización
    return <span className={`${baseClasses} ${colorClasses}`}>{status.replace(/_/g, ' ')}</span>;
};


export const LoanInstallmentsPage = () => {
    const { loanId } = useParams<{ loanId: string }>();
    const [loan, setLoan] = useState<Loan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loanId) {
            setError('No se proporcionó un ID de préstamo.');
            setIsLoading(false);
            return;
        }

        const fetchLoanDetails = async () => {
            setIsLoading(true);
            try {
                const loanDocRef = doc(db, 'loans', loanId);
                const loanDocSnap = await getDoc(loanDocRef);

                if (loanDocSnap.exists()) {
                    const data = loanDocSnap.data();

                    // --- CORRECCIÓN: Convertimos TODAS las fechas, incluyendo el historial ---
                    const loanData: Loan = {
                        id: loanDocSnap.id,
                        ...data,
                        applicationDate: (data.applicationDate as Timestamp).toDate(),
                        disbursementDate: data.disbursementDate ? (data.disbursementDate as Timestamp).toDate() : undefined,
                        statusHistory: (data.statusHistory || []).map((hist: any) => ({
                            ...hist,
                            date: (hist.date as Timestamp).toDate(),
                        })),
                        installments: (data.installments || []).map((inst: any) => ({
                            ...inst,
                            dueDate: (inst.dueDate as Timestamp).toDate(),
                            paymentDate: inst.paymentDate ? (inst.paymentDate as Timestamp).toDate() : undefined,
                        })),
                    } as Loan;

                    setLoan(loanData);
                } else {
                    setError('El préstamo solicitado no fue encontrado.');
                }
            } catch (err) {
                console.error("Error al obtener detalles del préstamo:", err);
                setError('Ocurrió un error al cargar los detalles del préstamo.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLoanDetails();
    }, [loanId]);

    if (isLoading) {
        return <div className="p-6 text-center">Cargando detalles del préstamo...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    if (!loan) {
        return <div className="p-6 text-center">No hay datos del préstamo para mostrar.</div>;
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link to="/portal/admin/management" className="text-blue-600 hover:text-blue-800 hover:underline">
                        &larr; Volver a Gestión de Préstamos
                    </Link>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Detalle del Préstamo</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                        <p><strong>Cliente:</strong> {loan.userName}</p>
                        <p><strong>Email:</strong> {loan.userEmail}</p>
                        <p><strong>Monto Solicitado:</strong> ${loan.loanAmount.toFixed(2)}</p>
                        <p><strong>Estado del Préstamo:</strong> <StatusBadge status={loan.status} /></p>
                        <p><strong>Fecha de Solicitud:</strong> {formatDate(loan.applicationDate)}</p>
                        <p><strong>Fecha de Desembolso:</strong> {formatDate(loan.disbursementDate)}</p>
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-gray-700 mb-4">Plan de Pagos</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    {/* ... (la tabla del plan de pagos no cambia) ... */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># Cuota</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Vencimiento</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {loan.installments.length > 0 ? (
                            loan.installments.map((installment) => (
                                <tr key={installment.installmentNumber}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{installment.installmentNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(installment.dueDate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${installment.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <StatusBadge status={installment.status} />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    No hay cuotas asociadas a este préstamo.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* --- NUEVA SECCIÓN: HISTORIAL DE ESTADOS --- */}
                {loan.statusHistory && loan.statusHistory.length > 0 && (
                    <>
                        <h2 className="text-xl font-semibold text-gray-700 mt-8 mb-4">Historial de Estados</h2>
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <ul className="space-y-4">
                                {loan.statusHistory
                                    .slice()
                                    .sort((a, b) => b.date.getTime() - a.date.getTime())
                                    .map((historyItem: StatusChange, index) => (
                                        <li key={index} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                                {loan.statusHistory.length - index}
                                            </div>
                                            <div className="flex-grow">
                                                <p className="font-semibold text-gray-800">
                                                    <StatusBadge status={historyItem.status} />
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatDate(historyItem.date)}
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