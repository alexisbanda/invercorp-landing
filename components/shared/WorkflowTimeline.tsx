
// src/components/shared/WorkflowTimeline.tsx
import React from 'react';
import { NonFinancialService } from '../../services/nonFinancialService';

// Componente para la línea de tiempo del flujo
export const WorkflowTimeline: React.FC<{ service: NonFinancialService }> = ({ service }) => {
    const { flujoCompleto, estadoActual } = service;
    const currentIndex = flujoCompleto.indexOf(estadoActual);

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Flujo del Servicio</h3>
            <ol className="relative border-l border-gray-200">
                {flujoCompleto.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    let ringColor = 'bg-gray-400';
                    if (isCompleted) ringColor = 'bg-green-500';
                    if (isCurrent) ringColor = 'bg-blue-500 animate-pulse';

                    return (
                        <li key={step} className="mb-8 ml-6">
                            <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white ${ringColor}`}>
                                {isCompleted && <i className="fas fa-check text-white"></i>}
                            </span>
                            <h4 className={`font-semibold ${isCurrent ? 'text-blue-600' : 'text-gray-900'}`}>{step}</h4>
                            {isCurrent && <p className="text-sm text-gray-500">Paso actual</p>}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};
