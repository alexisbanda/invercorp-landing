// /components/DashboardPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import { getLoansForCurrentUser, reportPaymentForInstallment } from '../services/loanService';
import { Loan, LoanStatus } from '../types';
import { Toaster, toast } from 'react-hot-toast'; // NUEVO: Importaciones para toasts

// --- Iconos para una UI más visual ---
const DollarSignIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 8v1m0-6.95V4.5m0 15v-2.55" />
    </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

// NUEVO: Icono para la fecha de desembolso
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// --- Componentes de Badges ---
const InstallmentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-block';
    const statusClasses: Record<string, string> = {
        PAGADO: 'bg-green-100 text-green-800',
        PENDIENTE: 'bg-yellow-100 text-yellow-800',
        VENCIDO: 'bg-red-100 text-red-800',
        'EN VERIFICACIÓN': 'bg-blue-100 text-blue-800',
        'EN ESPERA': 'bg-purple-100 text-purple-800',
    };
    const typedStatus = status as keyof typeof statusClasses;
    return <span className={`${baseClasses} ${statusClasses[typedStatus] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};

const LoanStatusBadge: React.FC<{ status: LoanStatus }> = ({ status }) => {
    const base = 'px-3 py-1 text-sm font-bold rounded-full inline-block';
    const colors: Record<LoanStatus, string> = {
        [LoanStatus.SOLICITADO]: 'bg-gray-200 text-gray-800',
        [LoanStatus.EN_REVISION]: 'bg-yellow-200 text-yellow-900',
        [LoanStatus.APROBADO]: 'bg-blue-200 text-blue-900',
        [LoanStatus.DESEMBOLSADO]: 'bg-green-200 text-green-900',
        [LoanStatus.COMPLETADO]: 'bg-teal-200 text-teal-900',
        [LoanStatus.RECHAZADO]: 'bg-red-200 text-red-900',
        [LoanStatus.EN_MORA]: 'bg-orange-300 text-orange-900',
    };
    return <span className={`${base} ${colors[status] || 'bg-gray-100'}`}>{status}</span>;
};

// --- Modal para reportar pago (con mejoras de UX) ---
const ReportPaymentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (notes: string) => void;
    installmentNumber: number | null;
    isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, installmentNumber, isSubmitting }) => {
    const [notes, setNotes] = useState('');

    // NUEVO: Limpiar el campo de notas cada vez que el modal se abre.
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
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4CAF50] focus:border-[#4CAF50] transition"
                            placeholder="Ej: Pago realizado desde la cuenta de ahorros de Banco Pichincha."
                        />
                        <p className="text-xs text-gray-500 mt-1">Puedes añadir una nota para el administrador.</p>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-[#4CAF50] rounded-md hover:bg-[#45a049] transition disabled:opacity-50 disabled:cursor-wait">
                            {isSubmitting ? 'Enviando...' : 'Confirmar Reporte'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente LoanCard rediseñado ---
const LoanCard: React.FC<{ loan: Loan; onReportPayment: (loanId: string, installmentNumber: number, notes: string) => Promise<void>; }> = ({ loan, onReportPayment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReportClick = (installmentNumber: number) => {
        setSelectedInstallment(installmentNumber);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedInstallment(null);
    };

    const handleConfirmReport = async (notes: string) => {
        if (selectedInstallment === null) return;
        setIsSubmitting(true);
        try {
            await onReportPayment(loan.id, selectedInstallment, notes);
            handleCloseModal();
        } catch (error) {
            // El toast de error ya es manejado por el componente padre.
            console.error("Error en la confirmación del reporte", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Esta es la condición clave que determina si se muestra el plan de pagos
    const showPaymentPlan = [LoanStatus.DESEMBOLSADO, LoanStatus.COMPLETADO, LoanStatus.EN_MORA].includes(loan.status);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200/80">
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b border-gray-200 pb-6 gap-4">
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Resumen de Préstamo</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                        <DollarSignIcon className="h-5 w-5 mr-2 text-green-600" />
                        <span>Monto Total: <strong>{loan.loanAmount.toLocaleString('es-EC', { style: 'currency', currency: loan.currency })}</strong></span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                        <span>Fecha de Solicitud: {loan.applicationDate?.toLocaleDateString('es-EC') ?? 'N/A'}</span>
                    </div>
                    {loan.disbursementDate && showPaymentPlan && (
                        <div className="flex items-center text-gray-600 mt-2">
                            <CheckCircleIcon className="h-5 w-5 mr-2 text-teal-600" />
                            <span>Fecha de Desembolso: {loan.disbursementDate?.toLocaleDateString('es-EC')}</span>
                        </div>
                    )}
                </div>
                <div className="text-left md:text-right w-full md:w-auto">
                    <p className="text-sm font-medium text-gray-500 mb-1">Estado del Préstamo</p>
                    <LoanStatusBadge status={loan.status} />
                    <p className="text-xs text-gray-400 mt-2">ID: {loan.id}</p>
                </div>
            </div>

            {showPaymentPlan && (
                <div>
                    <h4 className="text-xl font-semibold mb-4 text-gray-700">Plan de Pagos</h4>
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuota</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Venc.</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {loan.installments.map((inst, index) => (
                                <tr key={`${loan.id}-${inst.installmentNumber}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                    <td className="px-4 py-4 font-medium text-gray-900">{inst.installmentNumber}</td>

                                    {/* --- COMENTARIO ELIMINADO --- */}
                                    <td className="px-4 py-4 text-gray-600">{inst.dueDate?.toLocaleDateString('es-EC') ?? 'N/A'}</td>
                                    <td className="px-4 py-4 text-gray-600">{inst.amount.toLocaleString('es-EC', { style: 'currency', currency: loan.currency })}</td>

                                    <td className="px-4 py-4">
                                        <InstallmentStatusBadge status={inst.status} />
                                        {inst.adminNotes && (
                                            <p className="text-xs text-red-600 mt-1 italic" title="Nota del administrador">{inst.adminNotes}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        {inst.status === 'PENDIENTE' && (
                                            <button onClick={() => handleReportClick(inst.installmentNumber)} className="px-3 py-1 text-xs font-semibold text-white bg-[#4CAF50] rounded-md hover:bg-[#45a049] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4CAF50]">
                                                Reportar Pago
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <ReportPaymentModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleConfirmReport} installmentNumber={selectedInstallment} isSubmitting={isSubmitting} />
        </div>
    );
};

// --- Componente DashboardPage rediseñado ---
export const DashboardPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLoanData = async () => {
            if (currentUser) {
                try {
                    setLoading(true);
                    setError(null);
                    const userLoans = await getLoansForCurrentUser(currentUser.uid);
                    setLoans(userLoans);
                } catch (err) {
                    console.error("Error al obtener los préstamos:", err);
                    setError('No se pudo cargar la información de tus préstamos. Por favor, recarga la página.');
                    toast.error('Error al cargar los datos. Intenta recargar.');
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchLoanData();
    }, [currentUser]);

    const totalPendingBalance = useMemo(() => {
        return loans.reduce((total, loan) => {
            const pendingAmount = loan.installments
                .filter(inst => inst.status === 'PENDIENTE' || inst.status === 'VENCIDO')
                .reduce((sum, inst) => sum + inst.amount, 0);
            return total + pendingAmount;
        }, 0);
    }, [loans]);

    const handleReportPayment = async (loanId: string, installmentNumber: number, notes: string) => {
        try {
            await reportPaymentForInstallment(loanId, installmentNumber, { paymentReportNotes: notes });

            setLoans(currentLoans =>
                currentLoans.map(loan => {
                    if (loan.id === loanId) {
                        const updatedInstallments = loan.installments.map(inst => {
                            if (inst.installmentNumber === installmentNumber) {
                                return {
                                    ...inst,
                                    status: 'EN VERIFICACIÓN',
                                    paymentReportDate: new Date(),
                                    paymentReportNotes: notes,
                                    adminNotes: '',
                                };
                            }
                            return inst;
                        });
                        return { ...loan, installments: updatedInstallments };
                    }
                    return loan;
                })
            );
            toast.success('¡Pago reportado con éxito! Será verificado pronto.');
        } catch (err) {
            console.error("Error al reportar el pago:", err);
            toast.error('Hubo un error al reportar tu pago. Por favor, inténtalo de nuevo.');
            throw err;
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.success('Has cerrado sesión.');
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            toast.error('No se pudo cerrar la sesión.');
        }
    };

    const renderContent = () => {
        if (loading) {
            return <p className="text-center text-gray-500 py-10">Cargando información de tus préstamos...</p>;
        }

        if (error && loans.length === 0) {
            return <p className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</p>;
        }

        if (loans.length === 0) {
            return (
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">No tienes préstamos activos</h3>
                    <p className="text-gray-500 mt-2">Cuando solicites un préstamo, aparecerá aquí.</p>
                </div>
            );
        }

        return (
            <div>
                {loans.map(loan => (
                    <LoanCard key={loan.id} loan={loan} onReportPayment={handleReportPayment} />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-center" reverseOrder={false} />

            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-xl font-bold text-gray-800">
                            <span className="text-[#4CAF50]">INVERCOP</span>
                            <span className="font-light text-gray-600"> | Portal de Cliente</span>
                        </h1>
                        <button onClick={handleLogout} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-8 p-6 bg-white rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Bienvenido de nuevo,</h2>
                        <p className="text-lg text-gray-600 mt-1">{currentUser?.displayName || currentUser?.email}</p>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg flex flex-col justify-center">
                        <p className="text-sm font-medium text-yellow-800">Saldo Pendiente Total</p>
                        <p className="text-2xl font-bold text-yellow-900">
                            {totalPendingBalance.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}
                        </p>
                    </div>
                </div>
                {renderContent()}
            </main>
        </div>
    );
};