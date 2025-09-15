// ...existing code...
// components/admin/AdminProgrammedSavingDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { ProgrammedSaving, Deposit, UserProfile, DepositStatus } from '../../types';
import { getProgrammedSavingById, getDepositsForSavingPlan, confirmDeposit, rejectDeposit, addManualDepositByAdmin, deleteDeposit } from '../../services/savingsService'; // Importar la nueva función
import { getUserProfile } from '../../services/userService';

// Helper para formatear fechas
const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    // Firestore Timestamps tienen un método toDate()
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
};

// Componente para la insignia de estado del depósito
const DepositStatusBadge: React.FC<{ status: DepositStatus }> = ({ status }) => {
    const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-block';
    const statusClasses: Record<DepositStatus, string> = {
        [DepositStatus.CONFIRMADO]: 'bg-green-100 text-green-800',
        [DepositStatus.EN_VERIFICACION]: 'bg-yellow-100 text-yellow-800',
        [DepositStatus.RECHAZADO]: 'bg-red-100 text-red-800',
    };
    return <span className={`${baseClasses} ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
};


const AdminProgrammedSavingDetailPage: React.FC = () => {
    // ...existing code...

    // Handler para registrar retiro solicitado
    const handleWithdrawalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !clienteId || isNaN(numeroCartola) || withdrawalAmount <= 0) {
            toast.error("El monto del retiro debe ser mayor a cero.");
            return;
        }

        setIsSubmittingWithdrawal(true);
        const toastId = toast.loading('Registrando retiro...');
        try {
            // Llama al servicio para registrar el retiro
            // registerWithdrawalByAdmin(userId, numeroCartola, withdrawalData, adminId)
            // withdrawalData: { montoRetiro, notaAdmin }
            // adminId: currentUser.uid
            // @ts-ignore
            await import('../../services/savingsService').then(({ registerWithdrawalByAdmin }) =>
                registerWithdrawalByAdmin(clienteId, numeroCartola, {
                    montoRetiro: withdrawalAmount,
                    notaAdmin: withdrawalNotes || 'Retiro procesado por administrador.'
                }, currentUser.uid)
            );
            toast.success('Retiro registrado y procesado.', { id: toastId });
            setIsWithdrawalModalOpen(false);
            setWithdrawalAmount(0);
            setWithdrawalNotes('');
            fetchData();
        } catch (err) {
            toast.error('Error al registrar el retiro.', { id: toastId });
            console.error(err);
        } finally {
            setIsSubmittingWithdrawal(false);
        }
    };
    const { clienteId, numeroCartola: numeroCartolaStr } = useParams<{ clienteId: string; numeroCartola: string }>();
    const { currentUser } = useAuth();

    const [plan, setPlan] = useState<ProgrammedSaving | null>(null);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [client, setClient] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Estado para el modal de depósito manual
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [manualDepositAmount, setManualDepositAmount] = useState<number>(0);
    const [manualDepositNotes, setManualDepositNotes] = useState<string>('');
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);

    // Estado para el modal de retiro solicitado
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
    const [withdrawalNotes, setWithdrawalNotes] = useState<string>('');
    const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

    const numeroCartola = numeroCartolaStr ? parseInt(numeroCartolaStr, 10) : NaN;

    const fetchData = useCallback(async () => {
        if (!currentUser || !clienteId || isNaN(numeroCartola)) {
            setError("Información insuficiente para cargar el plan.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const [fetchedPlan, fetchedDeposits, fetchedWithdrawals, fetchedClient] = await Promise.all([
                getProgrammedSavingById(clienteId, numeroCartola),
                getDepositsForSavingPlan(clienteId, numeroCartola),
                import('../../services/savingsService').then(({ getWithdrawalsForSavingPlan }) => getWithdrawalsForSavingPlan(clienteId, numeroCartola)),
                getUserProfile(clienteId)
            ]);

            if (fetchedPlan) {
                setPlan(fetchedPlan);
                setDeposits(fetchedDeposits.sort((a, b) => new Date(b.fechaDeposito).getTime() - new Date(a.fechaDeposito).getTime())); // Ordenar por fecha
                setWithdrawals(fetchedWithdrawals.sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()));
                setClient(fetchedClient);
            } else {
                setError("Plan de ahorro no encontrado.");
            }
        } catch (err) {
            setError("Error al cargar los detalles del plan.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentUser, clienteId, numeroCartola]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleConfirm = async (deposit: Deposit) => {
        if (!currentUser || !clienteId || isNaN(numeroCartola)) return;
        
        const confirmation = window.confirm(`¿Estás seguro de que quieres confirmar el depósito de $${deposit.montoDeposito.toFixed(2)}? Esta acción es irreversible.`);
        if (confirmation) {
            const toastId = toast.loading('Confirmando depósito...');
            try {
                await confirmDeposit(clienteId, numeroCartola, deposit.depositId, currentUser.uid);
                toast.success('Depósito confirmado con éxito.', { id: toastId });
                fetchData(); // Refrescar datos
            } catch (err) {
                toast.error('Error al confirmar el depósito.', { id: toastId });
                console.error(err);
            }
        }
    };

    const handleReject = async (deposit: Deposit) => {
        if (!currentUser || !clienteId || isNaN(numeroCartola)) return;

        const reason = prompt("Por favor, ingresa el motivo del rechazo (será visible para el cliente):");
        if (reason && reason.trim()) {
            const toastId = toast.loading('Rechazando depósito...');
            try {
                await rejectDeposit(clienteId, numeroCartola, deposit.depositId, currentUser.uid, reason);
                toast.success('Depósito rechazado.', { id: toastId });
                fetchData(); // Refrescar datos
            } catch (err) {
                toast.error('Error al rechazar el depósito.', { id: toastId });
                console.error(err);
            }
        } else if (reason !== null) { // Si el usuario no canceló el prompt pero lo dejó vacío
            toast.error('El motivo del rechazo no puede estar vacío.');
        }
    };

    const handleDelete = async (deposit: Deposit) => {
        if (!currentUser || !clienteId || isNaN(numeroCartola)) return;

        const confirmationMessage = deposit.estadoDeposito === DepositStatus.CONFIRMADO
            ? `¿Estás seguro de eliminar este depósito? El monto de ${deposit.montoDeposito.toFixed(2)} será RESTADO del saldo actual del cliente.`
            : `¿Estás seguro de eliminar este registro de depósito? Esta acción no se puede deshacer.`

        if (window.confirm(confirmationMessage)) {
            const toastId = toast.loading('Eliminando depósito...');
            try {
                await deleteDeposit(clienteId, numeroCartola, deposit.depositId);
                toast.success('Depósito eliminado con éxito.', { id: toastId });
                fetchData(); // Refrescar datos
            } catch (err) {
                toast.error('Error al eliminar el depósito.', { id: toastId });
                console.error(err);
            }
        }
    };

    const handleManualDepositSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !clienteId || isNaN(numeroCartola) || manualDepositAmount <= 0) {
            toast.error("El monto debe ser mayor a cero.");
            return;
        }

        setIsSubmittingManual(true);
        const toastId = toast.loading('Registrando depósito manual...');

        try {
            await addManualDepositByAdmin(clienteId, numeroCartola, {
                montoDeposito: manualDepositAmount,
                notaAdmin: manualDepositNotes || 'Depósito manual registrado por administrador.'
            }, currentUser.uid);

            toast.success('Depósito manual registrado y confirmado.', { id: toastId });
            setIsModalOpen(false);
            fetchData(); // Refrescar todos los datos de la página
        } catch (err) {
            toast.error('Error al registrar el depósito manual.', { id: toastId });
            console.error(err);
        } finally {
            setIsSubmittingManual(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando detalles del plan...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!plan || !client) return <div className="p-8 text-center">No se encontraron datos del plan o del cliente.</div>;

    const progressPercentage = (plan.saldoActual / plan.montoMeta) * 100;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <Link to="/portal/admin/savings" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Volver a Gestión de Ahorros</Link>

                {/* Resumen del Plan y Cliente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start">
                            <h1 className="text-2xl font-bold text-gray-800">{plan.nombrePlan}</h1>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${plan.estadoPlan === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {plan.estadoPlan}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1">ID del Plan: {plan.numeroCartola}</p>
                        
                        <div className="mt-6">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-sm font-medium text-gray-600">Progreso</span>
                                <span className="text-lg font-bold text-blue-600">{progressPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                            <div className="flex justify-between text-md text-gray-700 mt-2">
                                <span>Ahorrado: <strong>${plan.saldoActual.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                <span className="font-medium">Meta: <strong>${plan.montoMeta.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Info del Cliente */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Información del Cliente</h2>
                        <div className="space-y-3 text-sm">
                            <p><strong>Nombre:</strong> {client.name}</p>
                            <p><strong>Cédula:</strong> {client.cedula}</p>
                            <p><strong>No. Cartola:</strong> {client.numeroCartola}</p>
                            <p><strong>Email:</strong> {client.email}</p>
                            <p><strong>Teléfono:</strong> {client.phone}</p>
                            <p><strong>Asesor:</strong> {plan.advisorName}</p>
                        </div>
                    </div>
                </div>

                {/* Historial de Depósitos */}
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Historial de Depósitos</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200"
                            >+ Registrar Depósito Manual</button>
                            <button
                                onClick={() => setIsWithdrawalModalOpen(true)}
                                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors duration-200"
                            >+ Registrar Retiro Solicitado</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Cliente</th>
                                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {deposits.map(deposit => (
                                    <tr key={deposit.depositId}>
                                        <td className="px-4 py-4 whitespace-nowrap">{formatDate(deposit.fechaDeposito)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-medium">${deposit.montoDeposito.toFixed(2)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap"><DepositStatusBadge status={deposit.estadoDeposito} /></td>
                                        <td className="px-4 py-4 text-gray-600">{deposit.notaCliente || 'N/A'}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {deposit.estadoDeposito === DepositStatus.EN_VERIFICACION && (
                                                    <>
                                                        <button onClick={() => handleConfirm(deposit)} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded-md text-xs transition-colors">Confirmar</button>
                                                        <button onClick={() => handleReject(deposit)} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-md text-xs transition-colors">Rechazar</button>
                                                    </>
                                                )}
                                                <button onClick={() => handleDelete(deposit)} className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-1 px-2 rounded-md text-xs transition-colors">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {deposits.length === 0 && <p className="text-center text-gray-500 py-6">No hay depósitos registrados para este plan.</p>}
                    </div>
                </div>

                {/* Historial de Retiros */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Historial de Retiros</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Solicitud</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Admin</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                {withdrawals.map(withdrawal => (
                                    <tr key={withdrawal.withdrawalId}>
                                        <td className="px-4 py-4 whitespace-nowrap">{formatDate(withdrawal.fechaSolicitud)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap font-medium">${withdrawal.montoRetiro.toFixed(2)}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">{withdrawal.estadoRetiro}</td>
                                        <td className="px-4 py-4 text-gray-600">{withdrawal.notaAdmin || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {withdrawals.length === 0 && <p className="text-center text-gray-500 py-6">No hay retiros registrados para este plan.</p>}
                    </div>
                </div>
            </div>

            {/* Modal para registrar depósito manual */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Depósito Manual</h3>
                        <form onSubmit={handleManualDepositSubmit}>
                            <div className="mb-4">
                                <label htmlFor="manualDepositAmount" className="block text-sm font-medium text-gray-700">Monto del Depósito ($)</label>
                                <input
                                    type="number"
                                    id="manualDepositAmount"
                                    value={manualDepositAmount}
                                    onChange={(e) => setManualDepositAmount(Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="manualDepositNotes" className="block text-sm font-medium text-gray-700">Nota del Administrador (Opcional)</label>
                                <textarea
                                    id="manualDepositNotes"
                                    value={manualDepositNotes}
                                    onChange={(e) => setManualDepositNotes(e.target.value)}
                                    rows={3}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Ej: Pago en efectivo recibido en oficina."
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmittingManual} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition disabled:opacity-50">Cancelar</button>
                                <button type="submit" disabled={isSubmittingManual} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-wait">{isSubmittingManual ? 'Registrando...' : 'Registrar y Confirmar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para registrar retiro solicitado */}
            {isWithdrawalModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Retiro Solicitado</h3>
                        <form onSubmit={handleWithdrawalSubmit}>
                            <div className="mb-4">
                                <label htmlFor="withdrawalAmount" className="block text-sm font-medium text-gray-700">Monto del Retiro ($)</label>
                                <input
                                    type="number"
                                    id="withdrawalAmount"
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    required
                                    min="0.01"
                                    step="0.01"
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor="withdrawalNotes" className="block text-sm font-medium text-gray-700">Nota del Administrador (Opcional)</label>
                                <textarea
                                    id="withdrawalNotes"
                                    value={withdrawalNotes}
                                    onChange={(e) => setWithdrawalNotes(e.target.value)}
                                    rows={3}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                                    placeholder="Ej: Retiro procesado en ventanilla."
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsWithdrawalModalOpen(false)} disabled={isSubmittingWithdrawal} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition disabled:opacity-50">Cancelar</button>
                                <button type="submit" disabled={isSubmittingWithdrawal} className="px-4 py-2 text-sm font-semibold text-white bg-pink-600 rounded-md hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-wait">{isSubmittingWithdrawal ? 'Registrando...' : 'Registrar y Procesar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProgrammedSavingDetailPage;