
// src/components/admin/ServiceDetailPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getServiceById, updateServiceStatus, updateServiceValue, NonFinancialService, Attachment } from '../../services/nonFinancialService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase-config';
import { getUserProfile } from '../../services/userService';
import { UserProfile } from '../../types';
import { formatServiceType } from '../../services/serviceDefinitions';




import { WorkflowTimeline } from '../shared/WorkflowTimeline';
import { StatusHistory } from '../shared/StatusHistory';
import { GenerateReceiptModal } from './GenerateReceiptModal';

const ServiceDetailPage: React.FC = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const [service, setService] = useState<NonFinancialService | null>(null);
    const [client, setClient] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);

    // Estado para editar el valor del servicio
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [editedValue, setEditedValue] = useState<string>('');

    const handleUpdateValue = async () => {
        if (!service) return;
        const newValue = parseFloat(editedValue);
        if (isNaN(newValue) || newValue < 0) {
            toast.error('Por favor ingresa un valor válido');
            return;
        }

        try {
            await updateServiceValue(service.id, newValue);
            setService(prev => prev ? { ...prev, valorServicio: newValue } : null);
            setIsEditingValue(false);
            toast.success('Valor actualizado');
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar el valor');
        }
    };

    const fetchService = useCallback(async () => {
        if (!serviceId) return;
        setIsLoading(true);
        try {
            const data = await getServiceById(serviceId);
            if (data) {
                setService(data);
                const clientData = await getUserProfile(data.clienteId);
                setClient(clientData);
            } else {
                setError('El servicio solicitado no fue encontrado.');
            }
        } catch (err) {
            setError('Ocurrió un error al cargar el servicio.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [serviceId]);

    useEffect(() => {
        fetchService();
    }, [fetchService]);

    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    const handleAdvanceState = async () => {
        if (!serviceId || !service) return;

        const currentIndex = service.flujoCompleto.indexOf(service.estadoActual);
        if (currentIndex >= service.flujoCompleto.length - 1) {
            toast('El servicio ya se encuentra en su último estado.', { icon: 'ℹ️' });
            return;
        }
        
        if (isUpdating) return;

        // Validar archivos antes de proceder
        if (selectedFiles.length > 3) {
            toast.error('Máximo 5 archivos permitidos.');
            return;
        }

        const nextStatus = service.flujoCompleto[currentIndex + 1];

        setIsUpdating(true);
        const toastId = toast.loading(`Avanzando estado a "${nextStatus}"...`);

        try {
            let attachments: Attachment[] = [];
            if (selectedFiles.length > 0) {
                toast.loading('Subiendo documentos...', { id: toastId });
                const timestamp = Date.now();
                // Subir archivos secuencialmente o en paralelo
                const uploadPromises = selectedFiles.map(async (file) => {
                    const storagePath = `service-attachments/${serviceId}/${timestamp}_${file.name}`;
                    const storageRef = ref(storage, storagePath);
                    await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(storageRef);
                    return {
                        name: file.name,
                        url,
                        type: file.type,
                        size: file.size,
                        path: storagePath
                    } as Attachment;
                });
                 attachments = await Promise.all(uploadPromises);
            }

            await updateServiceStatus(serviceId, nextStatus, notes, attachments);
            toast.success('Estado actualizado con éxito.', { id: toastId });
            setNotes('');
            setSelectedFiles([]);
            setFileError(null);
            fetchService(); // Recargar los datos del servicio
        } catch (err) {
            toast.error('No se pudo actualizar el estado.', { id: toastId });
            console.error(err);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Cargando detalles del servicio...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!service) return <div className="p-8 text-center">Servicio no disponible.</div>;

    const isLastStep = service.flujoCompleto.indexOf(service.estadoActual) === service.flujoCompleto.length - 1;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Link to="/portal/admin/services" className="text-blue-600 hover:underline">&larr; Volver a Gestión de Servicios</Link>
                    <button
                        onClick={() => setIsReceiptModalOpen(true)}
                        className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Generar Recibo
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna principal de información y acciones */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{formatServiceType(service.tipoDeServicio)}</h1>
                                <p className="text-sm text-gray-500">Cliente: {service.userName}</p>
                                <p className="text-sm text-gray-500">No. Cartola: {client?.numeroCartola}</p>
                                <p className="text-sm text-gray-500">Asesor: {service.advisorName}</p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${service.estadoGeneral === 'FINALIZADO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {service.estadoGeneral.replace('_', ' ')}
                            </span>

                        </div>

                        {/* Valor del Servicio */}
                        <div className="mb-6 bg-blue-50 p-4 rounded-md flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-blue-800">Valor del Servicio</h3>
                                {!isEditingValue ? (
                                    <p className="text-2xl font-bold text-blue-900">
                                        ${(service.valorServicio || 0).toFixed(2)}
                                    </p>
                                ) : (
                                    <div className="flex gap-2 mt-1">
                                        <input 
                                            type="number" 
                                            value={editedValue}
                                            onChange={(e) => setEditedValue(e.target.value)}
                                            className="p-1 border rounded w-32"
                                            step="0.01"
                                        />
                                        <button onClick={handleUpdateValue} className="text-green-600 hover:text-green-800">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                        </button>
                                        <button onClick={() => setIsEditingValue(false)} className="text-red-500 hover:text-red-700">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {!isEditingValue && (
                                <button 
                                    onClick={() => {
                                        setEditedValue((service.valorServicio || 0).toString());
                                        setIsEditingValue(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Editar Valor
                                </button>
                            )}
                        </div>

                        {service.descripcionCliente && (
                            <div className="mb-6 bg-gray-50 p-4 rounded-md">
                                <h3 className="font-semibold text-gray-700">Requerimiento del Cliente</h3>
                                <p className="text-gray-600 mt-1">{service.descripcionCliente}</p>
                            </div>
                        )}

                        {/* Sección de Avance de Estado */}
                        {!isLastStep && (
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-700">Avanzar Flujo</h3>
                                <div className="mt-4">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                        placeholder="Añade un comentario sobre este cambio de estado..."
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Documentos (Opcional)</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpeg, application/pdf"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            
                                            // Validaciones
                                            if (selectedFiles.length + files.length > 3) {
                                                setFileError('Máximo 3 documentos por actualización.');
                                                return;
                                            }
                                            
                                            for (const f of files) {
                                                if (f.size > 1 * 1024 * 1024) {
                                                     setFileError(`El archivo ${f.name} pesa más de 1MB.`);
                                                     return;
                                                }
                                            }
                                            
                                            setFileError(null);
                                            setSelectedFiles(prev => [...prev, ...files]);
                                            // Reset input
                                            e.target.value = '';
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
                                    <div className="mt-2 text-xs text-gray-500">Máx 3 archivos (PDF, JPG, PNG) - 1MB cada uno.</div>

                                    {selectedFiles.length > 0 && (
                                        <ul className="mt-2 space-y-1">
                                            {selectedFiles.map((file, idx) => (
                                                <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                                    <span className="truncate max-w-[200px]">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                    <button 
                                                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        &times;
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button
                                    onClick={handleAdvanceState}
                                    disabled={isUpdating}
                                    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:bg-blue-300"
                                >
                                    {isUpdating ? 'Actualizando...' : `Avanzar a: ${service.flujoCompleto[service.flujoCompleto.indexOf(service.estadoActual) + 1]}`}
                                </button>
                            </div>
                        )}
                        {isLastStep && (
                            <div className="border-t pt-6 text-center bg-green-50 p-4 rounded-md">
                                <h3 className="text-lg font-semibold text-green-800">¡Servicio Finalizado!</h3>
                                <p className="text-green-700">Este servicio ha completado todos los pasos de su flujo.</p>
                            </div>
                        )}
                    </div>

                    {/* Columna de Flujo e Historial */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <WorkflowTimeline service={service} />
                        <StatusHistory history={service.historialDeEstados} />
                    </div>
                </div>
            </div>

            <GenerateReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => setIsReceiptModalOpen(false)}
                existingReceipts={service.recibos} // Pass persisted receipts
                onReceiptGenerated={fetchService} // Refresh to get new receipts
                initialData={{
                    serviceId: service.id,
                    concept: formatServiceType(service.tipoDeServicio),
                    amount: service.valorServicio || 0, // Use assigned value
                    clientName: service.userName,
                    clientId: client?.cedula || 'N/A',
                    receiptNumber: service.id.substring(0, 6).toUpperCase(), // Fallback
                    date: new Date().toLocaleDateString('es-EC')
                }}
            />
        </div>
    );
};

export default ServiceDetailPage;
