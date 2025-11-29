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
    label?: string;
}

export const ServiceReceipt: React.FC<ServiceReceiptProps> = ({
    receiptNumber,
    date,
    clientName,
    clientId,
    items,
    totalAmount,
    signerName,
    label
}) => {
    return (
        <div className="bg-white p-6 max-w-[21cm] mx-auto text-black font-sans border border-transparent relative">
            {label && (
                <div className="absolute top-2 right-2 text-xs font-bold text-gray-400 uppercase tracking-widest border border-gray-300 px-2 py-1 rounded">
                    {label}
                </div>
            )}
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                {/* Logo Section */}
                <div className="w-24 h-24 relative">
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

                    <div className="mt-2 border-2 border-black px-4 py-1 min-w-[250px] text-center font-bold uppercase text-sm">
                        {clientName}
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="mb-4 text-center">
                <h2 className="text-sm font-bold uppercase border-b border-black inline-block pb-1">RECIBO INVERCOP SEMILLAS DE FE</h2>
            </div>

            {/* Table */}
            <div className="mb-6">
                <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-black px-2 py-1 text-left w-1/2 font-bold uppercase">Concepto</th>
                            <th className="border border-black px-2 py-1 text-right font-bold uppercase">V. Unitario</th>
                            <th className="border border-black px-2 py-1 text-right font-bold uppercase">Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="border border-black px-2 py-1 uppercase">{item.concept}</td>
                                <td className="border border-black px-2 py-1 text-right">
                                    ${item.unitValue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="border border-black px-2 py-1 text-right">
                                    ${item.totalValue.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                        {/* Empty rows filler */}
                        {[...Array(Math.max(0, 3 - items.length))].map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="border border-black px-2 py-1">&nbsp;</td>
                                <td className="border border-black px-2 py-1 text-right">&nbsp;</td>
                                <td className="border border-black px-2 py-1 text-right">&nbsp;</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="border border-black px-2 py-1" colSpan={2}></td>
                            <td className="border border-black px-2 py-1 text-right font-bold">
                                ${totalAmount.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer / Signatures */}
            <div className="flex justify-between items-end mt-8">
                {/* Client Signature */}
                <div className="w-5/12">
                    <div className="border-t border-black mb-1"></div>
                    <div className="text-xs font-bold mb-1">FIRMA</div>
                    <div className="flex items-baseline mb-1">
                        <span className="text-xs font-bold mr-1">CI:</span>
                        <span className="border-b border-black flex-grow text-xs px-1">{clientId}</span>
                    </div>
                    <div className="flex items-baseline">
                        <span className="text-xs font-bold mr-1">NOMBRE:</span>
                        <span className="border-b border-black flex-grow text-xs px-1 uppercase">{signerName || clientName}</span>
                    </div>
                </div>

                {/* Company Signature/Stamp */}
                <div className="w-4/12 relative text-center">
                    {/* Stamp Imitation */}
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-50 pointer-events-none">
                        <img
                            src="/assets/images/invercoorp_logo.png"
                            alt="Sello Invercop"
                            className="w-24 h-24 object-contain rotate-[-15deg] grayscale"
                        />
                    </div>

                    {/* Signature Line */}
                    <div className="relative z-10 mt-8">
                        <div className="border-t border-black mb-1"></div>
                        <div className="text-xs font-bold uppercase">Invercop Semillas de Fe</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

