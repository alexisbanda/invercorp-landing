import React, { useState, useRef, useEffect } from 'react';
import { ServiceReceipt, ServiceReceiptProps } from './ServiceReceipt';

interface ReceiptInitialData {
    concept: string;
    amount: number;
    clientName: string;
    clientId: string;
    receiptNumber: string;
    date?: string;
}

interface GenerateReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: ReceiptInitialData;
}

export const GenerateReceiptModal: React.FC<GenerateReceiptModalProps> = ({
    isOpen,
    onClose,
    initialData
}) => {
    const [amount, setAmount] = useState<string>('');
    const [concept, setConcept] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && initialData) {
            setAmount(initialData.amount.toString());
            setConcept(initialData.concept);
            setShowPreview(false);
        }
    }, [isOpen, initialData]);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        // Create a temporary container for printing
        const printContainer = document.createElement('div');
        printContainer.id = 'print-container-wrapper';

        // We need to render the component twice for printing
        // Since we can't easily use ReactDOM.render here without adding complexity,
        // we will clone the DOM node and modify it if possible, or better yet,
        // we rely on the fact that we can render the "print view" hidden in the modal 
        // and just copy THAT.

        // Let's create the print structure manually using the innerHTML of the ref
        // But we need to inject the labels.
        // A better approach for React is to have a "print-only" section in the JSX that is hidden on screen
        // but visible on print. However, `react-to-print` or similar usually handles this.
        // Here we are doing manual DOM manipulation.

        // Strategy: Render the "Double Receipt" into a hidden div in the component, then print that.
        // But to keep it simple with current setup:

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

    if (!isOpen) return null;

    const receiptData: ServiceReceiptProps = {
        receiptNumber: initialData.receiptNumber,
        date: initialData.date || new Date().toLocaleDateString('es-EC'),
        clientName: initialData.clientName,
        clientId: initialData.clientId,
        items: [
            {
                concept: concept,
                unitValue: parseFloat(amount) || 0,
                totalValue: parseFloat(amount) || 0
            }
        ],
        totalAmount: parseFloat(amount) || 0,
        signerName: initialData.clientName
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl m-4 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Generar Recibo de Servicio</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow">
                    {!showPreview ? (
                        <div className="space-y-4 max-w-md mx-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                                <input
                                    type="text"
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
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
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <button
                                onClick={() => setShowPreview(true)}
                                disabled={!amount}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                Ver Vista Previa
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="border shadow-sm p-4 bg-gray-50 mb-4 w-full overflow-auto">
                                <div ref={printRef}>
                                    <ServiceReceipt {...receiptData} />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    Editar Datos
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Imprimir Recibo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
