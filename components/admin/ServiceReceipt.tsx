import React from 'react';

interface ReceiptItem {
    concept: string;
    unitValue: number;
    totalValue: number;
}

export interface ServiceReceiptProps {
    receiptNumber: string;
    date: string;
    clientName: string;
    clientId: string; // CI
    items: ReceiptItem[];
    totalAmount: number;
    signerName?: string; // Nombre debajo de la firma del cliente
}

export const ServiceReceipt: React.FC<ServiceReceiptProps> = ({
    receiptNumber,
    date,
    clientName,
    clientId,
    items,
    totalAmount,
    signerName
}) => {
    return (
        <div className="bg-white p-8 max-w-[21cm] mx-auto text-black font-sans" id="printable-receipt">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                {/* Logo Section */}
                <div className="w-32 h-32 relative">
                    <img
                        src="/assets/images/invercoorp_logo.png"
                        alt="Invercop Logo"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* Receipt Info */}
                <div className="text-right">
                    <div className="text-sm font-semibold">Recibo {receiptNumber}</div>
                    <div className="text-sm">{date}</div>

                    <div className="mt-4 border-2 border-black px-4 py-2 min-w-[300px] text-center font-bold uppercase">
                        {clientName}
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="mb-6">
                <h2 className="text-sm font-bold uppercase">RECIBO INVERCOP SEMILLAS DE FE</h2>
            </div>

            {/* Table */}
            <div className="mb-12">
                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black px-2 py-1 text-left w-1/2 text-sm font-bold uppercase">Concepto</th>
                            <th className="border border-black px-2 py-1 text-right text-sm font-bold uppercase">V. Unitario</th>
                            <th className="border border-black px-2 py-1 text-right text-sm font-bold uppercase">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="border border-black px-2 py-1 text-sm uppercase">{item.concept}</td>
                                <td className="border border-black px-2 py-1 text-right text-sm">
                                    ${item.unitValue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="border border-black px-2 py-1 text-right text-sm">
                                    ${item.totalValue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                        {/* Empty rows filler to match the look if needed, or just dynamic */}
                        {[...Array(Math.max(0, 4 - items.length))].map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="border border-black px-2 py-1 text-sm">&nbsp;</td>
                                <td className="border border-black px-2 py-1 text-right text-sm">&nbsp;</td>
                                <td className="border border-black px-2 py-1 text-right text-sm">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="border border-black px-2 py-1" colSpan={2}></td>
                            <td className="border border-black px-2 py-1 text-right font-bold text-sm">
                                ${totalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer / Signatures */}
            <div className="flex justify-between items-end mt-20">
                {/* Client Signature */}
                <div className="w-5/12">
                    <div className="border-t border-black mb-2"></div>
                    <div className="text-sm font-bold mb-1">FIRMA</div>
                    <div className="flex items-baseline mb-1">
                        <span className="text-sm font-bold mr-2">CI:</span>
                        <span className="border-b border-black flex-grow text-sm px-2">{clientId}</span>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-sm font-bold mr-2">NOMBRE:</span>
                        <span className="border-b border-black flex-grow text-sm px-2 uppercase">{signerName || clientName}</span>
                    </div>
                </div>

                {/* Company Signature/Stamp */}
                <div className="w-4/12 relative text-center">
                    {/* Stamp Imitation */}
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-50 pointer-events-none">
                        <img
                            src="/assets/images/invercoorp_logo.png"
                            alt="Sello Invercop"
                            className="w-32 h-32 object-contain rotate-[-15deg] grayscale"
                        />
                    </div>

                    {/* Signature Line */}
                    <div className="relative z-10 mt-10">
                        <div className="border-t border-black mb-1"></div>
                        <div className="text-sm font-bold uppercase">Invercop Semillas de Fe</div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    #printable-receipt {
                        width: 100%;
                        height: 100vh;
                        padding: 2cm;
                    }
                }
            `}</style>
        </div>
    );
};
