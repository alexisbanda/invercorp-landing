// src/components/AdminDashboard.tsx

import React from 'react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel de Administración</h1>
            <p className="text-gray-600 mb-6">Selecciona una opción para empezar a gestionar la cooperativa.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Tarjeta 1: Reportes Financieros */}
                <Link
                    to="/portal/admin/reports"
                    className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <i className="fas fa-chart-pie fa-lg"></i>
                        </div>
                        <div className="ml-4">
                            <p className="text-xl font-semibold text-gray-900">Reportes Financieros</p>
                            <p className="text-sm text-gray-500">Visualizar y exportar datos clave</p>
                        </div>
                    </div>
                </Link>

                {/* Tarjeta 2: Gestión de Préstamos */}
                <Link
                    to="/portal/admin/management" // <-- NUEVA RUTA
                    className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <i className="fas fa-file-invoice-dollar fa-lg"></i>
                        </div>
                        <div className="ml-4">
                            <p className="text-xl font-semibold text-gray-900">Gestión de Préstamos</p>
                            <p className="text-sm text-gray-500">Ver y administrar préstamos y cuotas</p>
                        </div>
                    </div>
                </Link>

                {/* Tarjeta 3: Configuración (futura) */}
                <div className="block p-6 bg-white rounded-lg shadow-md opacity-50 cursor-not-allowed">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <i className="fas fa-cogs fa-lg"></i>
                        </div>
                        <div className="ml-4">
                            <p className="text-xl font-semibold text-gray-900">Configuración</p>
                            <p className="text-sm text-gray-500">(Próximamente)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};