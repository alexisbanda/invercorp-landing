// components/ProgrammedSavingDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProgrammedSaving, Deposit, DepositStatus } from '../types';
import { getProgrammedSavingById, getDepositsForSavingPlan, addDepositToSavingPlan } from '../services/savingsService';

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

const ProgrammedSavingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [plan, setPlan] = useState<ProgrammedSaving | null>(null);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
    const [depositAmount, setDepositAmount] = useState<number>(0);
    const [depositNotes, setDepositNotes] = useState<string>('');

    useEffect(() => {
        const fetchPlanDetails = async () => {
            if (!currentUser || !id) {
                setError("Datos insuficientes para cargar el plan.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const numeroCartola = parseInt(id, 10);
                const fetchedPlan = await getProgrammedSavingById(currentUser.uid, numeroCartola);
                if (fetchedPlan) {
                    setPlan(fetchedPlan);
                    const fetchedDeposits = await getDepositsForSavingPlan(currentUser.uid, numeroCartola);
                    setDeposits(fetchedDeposits);
                } else {
                    setError("Plan de ahorro no encontrado.");
                }
            } catch (err) {
                setError("Error al cargar los detalles del plan.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlanDetails();
    }, [currentUser, id]);

    const handleAddDeposit = async () => {
        if (!currentUser || !id || depositAmount <= 0) {
            alert("El monto del depósito debe ser mayor a cero.");
            return;
        }

        try {
            const numeroCartola = parseInt(id, 10);
            const newDepositData = {
                montoDeposito: depositAmount,
                notaCliente: depositNotes,
                fechaDeposito: new Date(),
                estadoDeposito: DepositStatus.EN_VERIFICACION,
            };
            await addDepositToSavingPlan(currentUser.uid, numeroCartola, newDepositData);
            setShowDepositModal(false);
            // Refresh data
            const fetchedDeposits = await getDepositsForSavingPlan(currentUser.uid, numeroCartola);
            setDeposits(fetchedDeposits);
        } catch (error) {
            console.error("Error al agregar el depósito:", error);
            alert("Hubo un error al registrar tu depósito. Inténtalo de nuevo.");
        }
    };

    if (loading) return <div className="text-center p-8">Cargando...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (!plan) return <div className="text-center p-8">Plan no encontrado.</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <button onClick={() => navigate('/portal/ahorros')} className="text-blue-600 hover:underline mb-6">← Volver a Mis Ahorros</button>
            
            {/* Card de Resumen del Plan */}
            <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-bold text-gray-800">{plan.nombrePlan}</h1>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${plan.estadoPlan === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {plan.estadoPlan}
                    </span>
                </div>
                <p className="text-gray-500 mt-1">ID del Plan: {plan.numeroCartola}</p>

                <div className="mt-6">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-gray-600">Progreso del Ahorro</span>
                        <span className="text-lg font-bold text-blue-600">{((plan.saldoActual / plan.montoMeta) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-blue-500 h-4 rounded-full text-xs font-medium text-blue-100 text-center p-0.5 leading-none" style={{ width: `${(plan.saldoActual / plan.montoMeta) * 100}%` }}>
                        </div>
                    </div>
                    <div className="flex justify-between text-md text-gray-700 mt-2">
                        <span>Ahorrado: <strong>${plan.saldoActual.toLocaleString()}</strong></span>
                        <span className="font-medium">Meta: <strong>${plan.montoMeta.toLocaleString()}</strong></span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => setShowDepositModal(true)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-300"
                    >
                        + Registrar Nuevo Depósito
                    </button>
                </div>
            </div>

            {/* Historial de Depósitos */}
            <div className="bg-white p-8 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial de Depósitos</h2>
                <div className="space-y-4">
                    {deposits.length > 0 ? (
                        deposits.map(dep => (
                            <div key={dep.depositId} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <p className="font-semibold text-lg">${dep.montoDeposito.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">{formatDate(dep.fechaDeposito)}</p>
                                    {dep.notaCliente && <p className="text-xs text-gray-500 mt-1">Nota: {dep.notaCliente}</p>}
                                </div>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full 
                                    ${dep.estadoDeposito === DepositStatus.CONFIRMADO ? 'bg-green-100 text-green-800' : ''}
                                    ${dep.estadoDeposito === DepositStatus.EN_VERIFICACION ? 'bg-yellow-100 text-yellow-800' : ''}
                                    ${dep.estadoDeposito === DepositStatus.RECHAZADO ? 'bg-red-100 text-red-800' : ''}
                                `}>
                                    {dep.estadoDeposito}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No hay depósitos registrados aún.</p>
                    )}
                </div>
            </div>

            {/* Modal para agregar depósito */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Registrar Nuevo Depósito</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700">Monto del Depósito ($)</label>
                                <input 
                                    type="number" 
                                    id="depositAmount"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="depositNotes" className="block text-sm font-medium text-gray-700">Notas (Opcional)</label>
                                <textarea 
                                    id="depositNotes"
                                    value={depositNotes}
                                    onChange={(e) => setDepositNotes(e.target.value)}
                                    rows={3}
                                    className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Depósito desde mi cuenta de ahorros."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-8">
                            <button onClick={() => setShowDepositModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg mr-4">Cancelar</button>
                            <button onClick={handleAddDeposit} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg">Confirmar Depósito</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgrammedSavingDetailPage;
