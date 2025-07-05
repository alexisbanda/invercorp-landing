// /src/components/admin/OverdueInstallmentsGrid.tsx
import React from 'react';
import { Installment } from '@/types.ts';
import Papa from 'papaparse';

interface OverdueInstallmentsGridProps {
    installments: Installment[];
}

export const OverdueInstallmentsGrid: React.FC<OverdueInstallmentsGridProps> = ({ installments }) => {

    const handleExport = () => {
        const dataToExport = installments.map(inst => ({
            'Numero de Cuota': inst.installmentNumber,
            'Monto': inst.amount.toFixed(2),
            'Fecha de Vencimiento': inst.dueDate.toLocaleDateString('es-EC'),
            // Añade más campos si es necesario, como el ID del cliente
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'reporte_cuotas_vencidas.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (installments.length === 0) {
        return <p className="text-gray-500">No hay cuotas vencidas para mostrar.</p>;
    }

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    Exportar a CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-800 text-white">
                    <tr>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Nº Cuota</th>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Monto</th>
                        <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Vencimiento</th>
                        {/* Añade más cabeceras si es necesario */}
                    </tr>
                    </thead>
                    <tbody className="text-gray-700">
                    {installments.map((inst, index) => (
                        <tr key={index} className="border-b">
                            <td className="text-left py-3 px-4">{inst.installmentNumber}</td>
                            <td className="text-left py-3 px-4">${inst.amount.toFixed(2)}</td>
                            <td className="text-left py-3 px-4">{new Date(inst.dueDate).toLocaleDateString('es-EC')}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};