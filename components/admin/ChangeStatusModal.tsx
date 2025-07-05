// src/components/admin/ChangeStatusModal.tsx

import React, { useState } from 'react';
// --- CORRECCIÓN 1: Importar serverTimestamp ya no es necesario para este archivo ---
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebase-config';
import { Loan, LoanStatus } from '../../types';

interface ChangeStatusModalProps {
    loan: Loan;
    onClose: () => void;
    onStatusChange: () => void;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({ loan, onClose, onStatusChange }) => {
    const [newStatus, setNewStatus] = useState<LoanStatus>(loan.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState('');

    const handleSave = async () => {
        if (newStatus === loan.status) {
            onClose();
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const loanDocRef = doc(db, 'loans', loan.id);

            const adminNote = notes.trim()
                ? notes
                : `Estado cambiado de '${loan.status}' a '${newStatus}' por administrador.`;

            await updateDoc(loanDocRef, {
                status: newStatus,
                statusHistory: arrayUnion({
                    status: newStatus,
                    // --- ¡CORRECCIÓN PRINCIPAL AQUÍ! ---
                    // Reemplazamos serverTimestamp() con un objeto Date del cliente.
                    // Firestore lo convertirá a un Timestamp automáticamente.
                    date: new Date(),
                    notes: adminNote,
                    updatedBy: auth.currentUser?.email || 'admin_system',
                }),
            });

            onStatusChange(); // Llama a la función para refrescar los datos
            onClose(); // Cierra el modal
        } catch (err) {
            console.error("Error al actualizar el estado:", err);
            setError("No se pudo guardar el cambio. Inténtalo de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- MEJORA: Función para limpiar el estado al cerrar ---
    const handleClose = () => {
        setError(null);
        setNotes('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md animate-fade-in-up">
                <h2 className="text-xl font-bold mb-4">Cambiar Estado del Préstamo</h2>
                <p className="mb-2"><strong>Cliente:</strong> {loan.userName}</p>
                <p className="mb-4"><strong>Estado Actual:</strong> <span className="font-semibold">{loan.status.replace('_', ' ')}</span></p>

                <div className="mb-4">
                    <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">
                        Nuevo Estado
                    </label>
                    <select
                        id="status-select"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as LoanStatus)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        {Object.values(LoanStatus).map((status) => (
                            <option key={status} value={status}>
                                {status.replace('_', ' ')}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label htmlFor="status-notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notas (Opcional)
                    </label>
                    <textarea
                        id="status-notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Se verificó el pago..."
                        className="mt-1 block w-full p-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                </div>

                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleClose} // Usamos la nueva función de cierre
                        disabled={isSaving}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};