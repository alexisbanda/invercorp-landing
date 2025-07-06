// src/components/admin/LoanDetailsGrid.tsx

import React from 'react';
import Papa from 'papaparse';
import { Loan } from '@/types.ts';
import { Link } from 'react-router-dom';

interface LoanDetailsGridProps {
    loans: Loan[];
    title: string;
}

const formatDate = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Fecha inválida';
    }
    return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

// --- 1. (NUEVO) Componente para el badge de verificación ---
// Lo creamos aquí mismo para mantenerlo encapsulado, ya que es muy específico para este grid.
const VerificationPendingBadge: React.FC = () => (
    <span
        className="ml-2 px-2 py-1 text-xs font-bold text-yellow-800 bg-yellow-200 rounded-full animate-pulse"
        title="Este préstamo tiene una o más cuotas pendientes de verificación"
    >
        REQUIERE ATENCIÓN
    </span>
);


export const LoanDetailsGrid: React.FC<LoanDetailsGridProps> = ({ loans, title }) => {

    const handleExport = () => {
        const dataToExport = loans.map(loan => ({
            'ID Préstamo': loan.id,
            'Cliente': loan.userName,
            'Email Cliente': loan.userEmail,
            'Monto Prestado': loan.loanAmount.toFixed(2),
            'Fecha de Solicitud': formatDate(loan.applicationDate),
            'Estado': loan.status,
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `reporte_prestamos_${title.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loans.length === 0) {
        return null;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{title}</h2>
                <button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm"
                >
                    <i className="fas fa-file-csv mr-2"></i>
                    Exportar a CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-800 text-white">
                    <tr>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Cliente</th>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Monto</th>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Fecha Solicitud</th>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Estado</th>
                        <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="text-gray-700">
                    {loans.map((loan) => {
                        // --- 2. (NUEVO) Lógica para verificar si hay cuotas pendientes ---
                        // Usamos .some() porque es más eficiente. Se detiene tan pronto como encuentra una coincidencia.
                        const hasPendingVerification = loan.installments?.some(
                            (inst) => inst.status?.trim().toUpperCase() === 'EN VERIFICACIÓN'
                        );

                        return (
                            <tr key={loan.id} className="border-b hover:bg-gray-50">
                                <td className="text-left py-3 px-4">{loan.userName}</td>
                                <td className="text-left py-3 px-4">${loan.loanAmount.toFixed(2)}</td>
                                <td className="text-left py-3 px-4">{formatDate(loan.applicationDate)}</td>

                                {/* --- 3. (MODIFICADO) Celda de estado con renderizado condicional del badge --- */}
                                <td className="text-left py-3 px-4">
                                    <div className="flex items-center">
                                        <span>{loan.status}</span>
                                        {hasPendingVerification && <VerificationPendingBadge />}
                                    </div>
                                </td>

                                <td className="text-center py-3 px-4">
                                    <Link
                                        to={`/portal/admin/loan/${loan.id}`} // Corregido para apuntar a la página de gestión de cuotas
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md text-xs transition-colors duration-200"
                                        title="Ver detalle de cuotas"
                                    >
                                        Gestionar
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};