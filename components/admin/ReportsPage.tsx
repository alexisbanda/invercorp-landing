// src/components/admin/ReportsPage.tsx

import React from 'react';
import { Link } from 'react-router-dom';

// Un componente simple para las tarjetas de reporte
const ReportCard: React.FC<{ to: string; icon: string; title: string; description: string }> = ({ to, icon, title, description }) => (
    <Link
        to={to}
        className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <i className={`fas ${icon} fa-lg`}></i>
            </div>
            <div className="ml-4">
                <p className="text-xl font-semibold text-gray-900">{title}</p>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
        </div>
    </Link>
);

export const ReportsPage: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 px-4 sm:px-0">Centro de Reportes</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-0">
                <ReportCard
                    to="/portal/admin/reports/dashboard"
                    icon="fa-chart-pie"
                    title="Dashboard de KPIs"
                    description="Visualizar gráficos y métricas clave."
                />
                <ReportCard
                    to="/portal/admin/reports/pending-installments"
                    icon="fa-file-invoice-dollar"
                    title="Reporte de Cuotas Pendientes"
                    description="Ver y filtrar todas las cuotas por cobrar."
                />
                <ReportCard
                    to="/portal/admin/reports/loan-portfolio"
                    icon="fa-briefcase"
                    title="Reporte de Cartera de Préstamos"
                    description="Resumen de préstamos activos y su estado."
                />
                <ReportCard
                    to="/portal/admin/reports/delinquency"
                    icon="fa-triangle-exclamation"
                    title="Reporte de Morosidad"
                    description="Analizar préstamos y cuotas vencidas."
                />
            </div>
        </div>
    );
};