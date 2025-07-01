import React, { useState, useEffect } from 'react';

interface AmortizationRow {
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
}

interface CalculatorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Nuevos Parámetros del Simulador ---
const MIN_AMOUNT = 3000;
const MAX_AMOUNT = 10000;
const LEGAL_FEE_PERCENTAGE = 0.02;
const POSSIBLE_TERMS = [12, 24, 36];
const INSURANCE_FEE = 15; // $15 mensuales de seguro

// Tasas de interés simple según el plazo
const INTEREST_RATES: { [key: number]: number } = {
    12: 0.10, // 10% para 12 meses
    24: 0.20, // 20% para 24 meses
    36: 0.30, // 30% para 36 meses
};

const CalculatorModal: React.FC<CalculatorModalProps> = ({ isOpen, onClose }) => {
    const [amount, setAmount] = useState(MIN_AMOUNT);
    const [term, setTerm] = useState(POSSIBLE_TERMS[0]);
    const [table, setTable] = useState<AmortizationRow[]>([]);
    const [summary, setSummary] = useState({
        monthlyPayment: 0,
        totalPayment: 0,
        totalInterest: 0,
        totalInsurance: 0
    });
    const [legalFees, setLegalFees] = useState(0);
    const [amountError, setAmountError] = useState('');
    const [includeInsurance, setIncludeInsurance] = useState(true); // Estado para el seguro

    const formatCurrency = (value: number) => {
        return value.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });
    };

    // --- Lógica de Cálculo Actualizada ---
    useEffect(() => {
        if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
            setAmountError(`El monto debe estar entre ${formatCurrency(MIN_AMOUNT)} y ${formatCurrency(MAX_AMOUNT)}.`);
            setTable([]);
            return;
        }
        setAmountError('');

        const principal = amount;
        const numberOfPayments = term;
        const interestRate = INTEREST_RATES[term];

        // Cálculo de interés simple total
        const totalInterest = principal * interestRate;
        const monthlyPaymentWithoutInsurance = (principal + totalInterest) / numberOfPayments;
        const totalPaymentWithoutInsurance = principal + totalInterest;
        const totalInsurance = numberOfPayments * INSURANCE_FEE;

        setSummary({
            monthlyPayment: monthlyPaymentWithoutInsurance,
            totalPayment: totalPaymentWithoutInsurance,
            totalInterest: totalInterest,
            totalInsurance: totalInsurance,
        });

        // Generación de la tabla de amortización con interés simple
        const newTable: AmortizationRow[] = [];
        let balance = principal;
        const principalPerMonth = principal / numberOfPayments;
        const interestPerMonth = totalInterest / numberOfPayments;

        for (let i = 1; i <= numberOfPayments; i++) {
            balance -= principalPerMonth;
            newTable.push({
                month: i,
                payment: monthlyPaymentWithoutInsurance, // La cuota base del crédito
                principal: principalPerMonth,
                interest: interestPerMonth,
                balance: balance > 0.01 ? balance : 0, // Evitar saldos negativos por redondeo
            });
        }

        setTable(newTable);
        setLegalFees(principal * LEGAL_FEE_PERCENTAGE);

    }, [amount, term]); // Recalcula automáticamente si el monto o el plazo cambian

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-up">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold text-[#2F4F4F]">Simulador de Crédito</h3>
                    <button onClick={onClose} className="text-3xl text-gray-500 hover:text-gray-800">&times;</button>
                </div>

                {/* Body */}
                <div className="flex flex-col md:flex-row">
                    {/* Inputs */}
                    <div className="w-full md:w-1/3 p-6 border-r">
                        <h4 className="font-bold text-lg mb-4 text-[#2F4F4F]">Configura tu crédito</h4>

                        <div className="mb-6">
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Monto del Préstamo ($)</label>
                            <input
                                type="number"
                                id="amount"
                                value={amount}
                                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${amountError ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-[#4CAF50]'}`}
                                min={MIN_AMOUNT}
                                max={MAX_AMOUNT}
                            />
                            <input
                                type="range"
                                min={MIN_AMOUNT}
                                max={MAX_AMOUNT}
                                step="500"
                                value={amount}
                                onChange={e => setAmount(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                            />
                            {amountError && <p className="text-red-600 text-xs mt-1">{amountError}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Plazo (meses)</label>
                            <div className="grid grid-cols-3 gap-2">
                                {POSSIBLE_TERMS.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTerm(t)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${term === t ? 'bg-[#4CAF50] text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6">
                            <span className="block text-sm font-medium text-gray-700">Tasa de Interés Aplicada</span>
                            <p className="text-lg font-semibold text-[#2F4F4F]">
                                {INTEREST_RATES[term] * 100}%
                                {term === 12 ? ' Anual' : ' Total sobre el monto'}
                            </p>
                        </div>

                        <div className="mt-6 flex items-center">
                            <input
                                id="insurance-toggle"
                                type="checkbox"
                                checked={includeInsurance}
                                onChange={() => setIncludeInsurance(!includeInsurance)}
                                className="h-4 w-4 rounded border-gray-300 text-[#4CAF50] focus:ring-[#4CAF50]"
                            />
                            <label htmlFor="insurance-toggle" className="ml-2 block text-sm font-medium text-gray-700">
                                Incluir seguro de desgravamen (${INSURANCE_FEE}/mes)
                            </label>
                        </div>
                    </div>

                    {/* Resultados y Tabla */}
                    <div className="w-full md:w-2/3 p-6 overflow-y-auto">
                        {table.length > 0 ? (
                            <>
                                {/* Resumen */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center mb-6 bg-gray-50 p-4 rounded-lg">
                                    <div className="lg:col-span-3">
                                        <p className="text-sm text-gray-600">Cuota Mensual a Pagar</p>
                                        <p className="text-2xl font-bold text-[#4CAF50]">{formatCurrency(summary.monthlyPayment + (includeInsurance ? INSURANCE_FEE : 0))}</p>
                                        <p className="text-xs text-gray-500">
                                            {includeInsurance ? `(${formatCurrency(summary.monthlyPayment)} de cuota + ${formatCurrency(INSURANCE_FEE)} de seguro)` : `(${formatCurrency(summary.monthlyPayment)} de cuota)`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Intereses</p>
                                        <p className="text-lg font-bold text-[#4CAF50]">{formatCurrency(summary.totalInterest)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Seguro</p>
                                        <p className="text-lg font-bold text-[#4CAF50]">{formatCurrency(includeInsurance ? summary.totalInsurance : 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total a Pagar</p>
                                        <p className="text-lg font-bold text-[#4CAF50]">{formatCurrency(summary.totalPayment + (includeInsurance ? summary.totalInsurance : 0))}</p>
                                    </div>
                                </div>

                                {/* Tabla */}
                                <div className="overflow-auto max-h-80">
                                    <table className="w-full text-sm text-left text-gray-600">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3">Mes</th>
                                            <th className="px-4 py-3">Cuota (sin seguro)</th>
                                            <th className="px-4 py-3">Capital</th>
                                            <th className="px-4 py-3">Interés</th>
                                            <th className="px-4 py-3">Saldo Restante</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {table.map(row => (
                                            <tr key={row.month} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-4 py-2">{row.month}</td>
                                                <td className="px-4 py-2 font-medium">{formatCurrency(row.payment)}</td>
                                                <td className="px-4 py-2 text-green-600">{formatCurrency(row.principal)}</td>
                                                <td className="px-4 py-2 text-red-600">{formatCurrency(row.interest)}</td>
                                                <td className="px-4 py-2 font-semibold">{formatCurrency(row.balance)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-gray-500 mt-4 text-center">
                                    * Esta es una simulación. Los valores reales pueden variar y están sujetos a aprobación de crédito. Los gastos legales no están incluidos en este cálculo.
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <p>Ajusta los valores para ver la simulación.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculatorModal;