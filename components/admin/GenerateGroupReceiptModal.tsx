import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { NonFinancialService } from '../../services/nonFinancialService';
import { createGroupedReceipt, GroupedReceipt, GroupedReceiptItem } from '../../services/receiptService';
import { ServiceReceipt as ServiceReceiptComponent, ServiceReceiptProps } from './ServiceReceipt';

interface GenerateGroupReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedServices: NonFinancialService[];
    onReceiptGenerated?: () => void;
}

export const GenerateGroupReceiptModal: React.FC<GenerateGroupReceiptModalProps> = ({
    isOpen,
    onClose,
    selectedServices,
    onReceiptGenerated
}) => {
    // State to hold amounts for each service. Keyed by service ID.
    const [amounts, setAmounts] = useState<Record<string, string>>({});
    const [concepts, setConcepts] = useState<Record<string, string>>({});
    
    // The generated receipt to show and print
    const [generatedReceipt, setGeneratedReceipt] = useState<GroupedReceipt | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // Initialize state when modal opens or services change
    useEffect(() => {
        if (isOpen && selectedServices.length > 0) {
            const initialAmounts: Record<string, string> = {};
            const initialConcepts: Record<string, string> = {};
            
            selectedServices.forEach(s => {
                initialAmounts[s.id] = ''; // Start empty or 0
                // Default concept to the service type but formatted nicely
                // We might want to let the user edit this too
                initialConcepts[s.id] = s.tipoDeServicio.replace(/_/g, ' '); 
            });
            setAmounts(initialAmounts);
            setConcepts(initialConcepts);
            setGeneratedReceipt(null);
        }
    }, [isOpen, selectedServices]);

    const handleAmountChange = (id: string, value: string) => {
        setAmounts(prev => ({ ...prev, [id]: value }));
    };

    const handleConceptChange = (id: string, value: string) => {
        setConcepts(prev => ({ ...prev, [id]: value }));
    };

    const handleGenerate = async () => {
        // Validate inputs
        const missingAmounts = selectedServices.some(s => !amounts[s.id] || parseFloat(amounts[s.id]) <= 0);
        if (missingAmounts) {
            toast.error('Todos los servicios deben tener un monto válido mayor a 0');
            return;
        }

        // Validate Client Consistency (All services should belong to the same client essentially)
        // Ideally we enforced this in the parent selection, but let's double check or just pick the first one's name.
        const firstService = selectedServices[0];
        const inconsistentClient = selectedServices.some(s => s.clienteId !== firstService.clienteId);
        
        if (inconsistentClient) {
            if (!window.confirm('Advertencia: Los servicios seleccionados parecen pertenecer a diferentes clientes (IDs). ¿Desea continuar usando el nombre del primero?')) {
                return;
            }
        }

        setIsProcessing(true);

        try {
            const items: GroupedReceiptItem[] = selectedServices.map(s => ({
                serviceId: s.id,
                concept: concepts[s.id] || s.tipoDeServicio,
                amount: parseFloat(amounts[s.id])
            }));

            const receipt = await createGroupedReceipt(
                firstService.userName, // Client Name
                firstService.clienteId, // Client CI/ID
                items
            );

            setGeneratedReceipt(receipt);
            toast.success('Recibo agrupado generado exitosamente');
            if (onReceiptGenerated) onReceiptGenerated();

        } catch (error) {
            console.error(error);
            toast.error('Error al generar el recibo');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printContainer = document.createElement('div');
        printContainer.id = 'print-container-wrapper';
        const contentHTML = printContent.innerHTML;

        // Reusing the print styles from the original logic
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
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    #print-container-wrapper { width: 100%; height: 100vh; background: white; }
                    .print-page { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 1cm; box-sizing: border-box; }
                    .receipt-copy { position: relative; flex: 1; display: flex; flex-direction: column; justify-content: center; }
                    .receipt-label { position: absolute; top: 0; right: 0; font-size: 10px; font-weight: bold; color: #999; border: 1px solid #ccc; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; z-index: 10; }
                    .cut-line { height: 20px; display: flex; align-items: center; justify-content: center; position: relative; margin: 10px 0; }
                    .cut-line span { background: white; padding: 0 10px; color: #666; font-size: 14px; z-index: 2; }
                    .dashed-line { position: absolute; left: 0; right: 0; top: 50%; border-top: 2px dashed #ccc; z-index: 1; }
                }
                body > *:not(#print-container-wrapper) { display: none; }
            </style>
        `;

        document.body.appendChild(printContainer);
        window.print();
        document.body.removeChild(printContainer);
    };

    if (!isOpen) return null;

    // Prepare generic props for the receipt component
    const receiptProps: ServiceReceiptProps | undefined = generatedReceipt ? {
        receiptNumber: generatedReceipt.receiptNumber,
        date: generatedReceipt.date.toDate().toLocaleDateString('es-EC'),
        clientName: generatedReceipt.clientName,
        clientId: generatedReceipt.clientId,
        items: generatedReceipt.items.map(i => ({
            concept: i.concept,
            unitValue: i.amount,
            totalValue: i.amount // In this context unit value = total per item usually
        })),
        totalAmount: generatedReceipt.totalAmount,
        signerName: 'Invercop Admin',
        label: 'RECIBO AGRUPADO'
    } : undefined;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className={`bg-white rounded-lg shadow-xl w-full m-4 flex flex-col max-h-[90vh] ${generatedReceipt ? 'max-w-4xl' : 'max-w-2xl'}`}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {generatedReceipt ? `Recibo Generado (${generatedReceipt.receiptNumber})` : 'Generar Recibo Agrupado'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {!generatedReceipt ? (
                        <div>
                            <p className="mb-4 text-gray-600">
                                Ingrese los valores para los servicios seleccionados del cliente <strong>{selectedServices[0]?.userName}</strong>.
                            </p>
                            
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {selectedServices.map(service => (
                                    <div key={service.id} className="flex gap-4 items-start border p-3 rounded bg-gray-50">
                                        <div className="flex-grow">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Concepto</label>
                                            <input
                                                type="text"
                                                value={concepts[service.id] || ''}
                                                onChange={(e) => handleConceptChange(service.id, e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded text-sm"
                                            />
                                            <div className="text-xs text-gray-400 mt-1">Servicio: {service.tipoDeServicio}</div>
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Monto ($)</label>
                                            <input
                                                type="number"
                                                value={amounts[service.id] || ''}
                                                onChange={(e) => handleAmountChange(service.id, e.target.value)}
                                                placeholder="0.00"
                                                className="w-full p-2 border border-gray-300 rounded text-sm text-right"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex justify-between items-center bg-blue-50 p-3 rounded">
                                <span className="font-bold text-blue-800">Total Estimado:</span>
                                <span className="font-bold text-xl text-blue-800">
                                    ${Object.values(amounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(2)}
                                </span>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isProcessing}
                                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 font-medium"
                                >
                                    {isProcessing ? 'Generando...' : 'Generar Recibo Único'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            {/* Receipt Preview */}
                            <div className="border shadow-sm p-4 bg-gray-50 mb-4 w-full overflow-auto">
                                <div ref={printRef}>
                                    {receiptProps && <ServiceReceiptComponent {...receiptProps} />}
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <button
                                    onClick={handlePrint}
                                    className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Imprimir Recibo
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
