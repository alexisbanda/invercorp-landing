import React, { useState, useRef, useEffect } from 'react';
import { addReceipt, voidReceipt, ServiceReceipt } from '../../services/nonFinancialService';
import { ServiceReceipt as ServiceReceiptComponent, ServiceReceiptProps } from './ServiceReceipt';
import toast from 'react-hot-toast';

interface ReceiptInitialData {
    concept: string;
    amount: number;
    clientName: string;
    clientId: string;
    receiptNumber: string;
    date?: string;
    serviceId: string;
}

interface GenerateReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ReceiptInitialData;
    existingReceipts?: ServiceReceipt[];
    onReceiptGenerated?: () => void;
}

export const GenerateReceiptModal: React.FC<GenerateReceiptModalProps> = ({
    isOpen,
    onClose,
    initialData,
    existingReceipts = [],
    onReceiptGenerated
}) => {
    const [amount, setAmount] = useState<string>('');
    const [concept, setConcept] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Find the latest valid receipt
    const activeReceipt = existingReceipts
        .filter(r => r.status === 'valid')
        .sort((a, b) => b.date.seconds - a.date.seconds)[0];

    // Determine current receipt data (either from existing active receipt or form input)
    const currentReceiptNumber = activeReceipt ? activeReceipt.number : initialData.receiptNumber;
    const currentAmount = activeReceipt ? activeReceipt.amount : (parseFloat(amount) || 0);
    const currentConcept = activeReceipt ? activeReceipt.concept : concept;
    const currentDate = activeReceipt 
        ? activeReceipt.date.toDate().toLocaleDateString('es-EC') 
        : (initialData.date || new Date().toLocaleDateString('es-EC'));

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && initialData) {
            // If there is an active receipt, populate form with its data (read-only mode essentially)
            if (activeReceipt) {
                setAmount(activeReceipt.amount.toString());
                setConcept(activeReceipt.concept);
                setShowPreview(true); // Default to preview if already generated
            } else {
                // If no active receipt, populate with initial data
                setAmount(initialData.amount ? initialData.amount.toString() : '');
                setConcept(initialData.concept);
                setShowPreview(false);
            }
        }
    }, [isOpen, initialData, activeReceipt]);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printContainer = document.createElement('div');
        printContainer.id = 'print-container-wrapper';

        const contentHTML = printContent.innerHTML;

        printContainer.innerHTML = `
            <div class="print-page">
                <div class="receipt-copy">
                    <div class="receipt-label">ORIGINAL: CLIENTE</div>
                    ${contentHTML}
                </div>
                <div class="cut-line">
                    <span>✂</span>
                    <div class="dashed-line"></div>
                </div>
                <div class="receipt-copy">
                    <div class="receipt-label">COPIA: INVERCOP</div>
                    ${contentHTML}
                </div>
            </div>
            <style>
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    #print-container-wrapper {
                        width: 100%;
                        height: 100vh;
                        background: white;
                    }
                    .print-page {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        padding: 1cm;
                        box-sizing: border-box;
                    }
                    .receipt-copy {
                        position: relative;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .receipt-label {
                        position: absolute;
                        top: 0;
                        right: 0;
                        font-size: 10px;
                        font-weight: bold;
                        color: #999;
                        border: 1px solid #ccc;
                        padding: 2px 6px;
                        border-radius: 4px;
                        text-transform: uppercase;
                        z-index: 10;
                    }
                    .cut-line {
                        height: 20px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        margin: 10px 0;
                    }
                    .cut-line span {
                        background: white;
                        padding: 0 10px;
                        color: #666;
                        font-size: 14px;
                        z-index: 2;
                    }
                    .dashed-line {
                        position: absolute;
                        left: 0;
                        right: 0;
                        top: 50%;
                        border-top: 2px dashed #ccc;
                        z-index: 1;
                    }
                }
                /* Hide everything else */
                body > *:not(#print-container-wrapper) {
                    display: none;
                }
            </style>
        `;

        document.body.appendChild(printContainer);
        window.print();
        document.body.removeChild(printContainer);
    };

    const handleGenerateAndPrint = async () => {
        if (activeReceipt) return; // Should not happen given UI locks

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('El monto debe ser mayor a 0');
            return;
        }

        setIsProcessing(true);
        try {
            await addReceipt(initialData.serviceId, parseFloat(amount), concept);
            toast.success('Recibo generado y guardado correctamente');
            if (onReceiptGenerated) onReceiptGenerated();
            
            // Wait a bit for state to update or just proceed to print?
            // Since we rely on parent refreshing prop, we might need to wait used effect or just print current state
            // But we want the receipt NUMBER to be the real one.
            // Simplified: The parent will refresh, pass new props, triggers useEffect, which sets activeReceipt.
            // We can auto-print in an effect if we wanted, but let's keep it manual for now or trigger print immediately?
            // Better UX: Show Success, updating UI to "Reprint" mode. Then user clicks Reprint.
            // OR: We can print immediately using the returned receipt data?
             // Let's stick to: Save -> Notify -> Parent Re-renders -> UI Updates -> User clicks "Imprimir" (or we auto click it)
             // For smoothest flow: Save -> Updates UI to "Reprint" -> User clicks "Imprimir"
             
             // However, to mimic "Generate & Print", we might want to just print.
             // But we don't have the new Receipt Number yet unless we use the return value.
            
            // NOTE: For now, we will just update state and let user click Print or auto-trigger could be complex with async props.
            // Let's rely on user clicking "Imprimir" which is now "Reimprimir".
            
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar el recibo');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleVoidReceipt = async () => {
        if (!activeReceipt) return;
        
        if (!window.confirm(`¿Estás seguro de anular el recibo ${activeReceipt.number}? Esta acción no se puede deshacer.`)) {
            return;
        }

        const reason = window.prompt("Ingrese el motivo de la anulación:");
        if (!reason) return;

        setIsProcessing(true);
        try {
            await voidReceipt(initialData.serviceId, activeReceipt.id, reason);
            toast.success('Recibo anulado correctamente');
            if (onReceiptGenerated) onReceiptGenerated();
        } catch (error) {
            console.error(error);
            toast.error('Error al anular el recibo');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    const receiptData: ServiceReceiptProps = {
        receiptNumber: currentReceiptNumber,
        date: currentDate,
        clientName: initialData.clientName,
        clientId: initialData.clientId,
        items: [
            {
                concept: currentConcept,
                unitValue: currentAmount,
                totalValue: currentAmount
            }
        ],
        totalAmount: currentAmount,
        signerName: 'Invercop Admin' // Or user name if available
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {activeReceipt ? `Recibo Generado (${activeReceipt.number})` : 'Generar Recibo de Servicio'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {!showPreview ? (
                        <div className="space-y-4 max-w-md mx-auto">
                            {activeReceipt && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                Este servicio ya tiene un recibo activo ({activeReceipt.number}). 
                                                Para generar uno nuevo, primero debes anular el actual.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                                <input
                                    type="text"
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    disabled={!!activeReceipt}
                                    className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor ($)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    disabled={!!activeReceipt}
                                    className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                                />
                            </div>
                            <button
                                onClick={() => setShowPreview(true)}
                                disabled={(!amount && !activeReceipt)}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                {activeReceipt ? 'Ver Recibo' : 'Ver Vista Previa'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="border shadow-sm p-4 bg-gray-50 mb-4 w-full overflow-auto">
                                <div ref={printRef}>
                                    <ServiceReceiptComponent {...receiptData} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                {!activeReceipt ? (
                                    <>
                                        <button
                                            onClick={() => setShowPreview(false)}
                                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                            disabled={isProcessing}
                                        >
                                            Editar Datos
                                        </button>
                                        <button
                                            onClick={handleGenerateAndPrint}
                                            disabled={isProcessing}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:bg-green-300"
                                        >
                                            {isProcessing ? 'Guardando...' : 'Guardar y Generar'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleVoidReceipt}
                                            disabled={isProcessing}
                                            className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-md hover:bg-red-200"
                                        >
                                            Anular Recibo
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                            </svg>
                                            Reimprimir
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
