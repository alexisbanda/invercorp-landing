
// src/components/shared/StatusHistory.tsx
import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { StatusHistoryEntry } from '../../services/nonFinancialService';

// Helper para formatear fechas
const formatDate = (date: Timestamp): string => {
    if (!date || typeof date.toDate !== 'function') return 'Fecha inválida';
    return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }).format(date.toDate());
};

// Componente para el historial de estados
export const StatusHistory: React.FC<{ history: StatusHistoryEntry[] }> = ({ history }) => (
    <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Historial de Cambios</h3>
        <ul className="space-y-4">
            {[...history].reverse().map((entry, index) => (
                <li key={index} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold">
                        {history.length - index}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{entry.status}</p>
                        <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                        {entry.notes && <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-md"><strong>Nota:</strong> {entry.notes}</p>}
                        <p className="text-xs text-gray-400 mt-1">Por: {entry.updatedBy}</p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);
