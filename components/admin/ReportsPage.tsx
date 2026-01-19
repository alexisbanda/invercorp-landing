import React from 'react';
import { Link } from 'react-router-dom';

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
                    icon="fa-chart-line"
                    title="Dashboard General"
                    description="KPIs de Ahorros, Servicios y métricas clave."
                />
                <ReportCard
                    to="/portal/admin/reports/savings"
                    icon="fa-piggy-bank"
                    title="Reporte de Ahorros"
                    description="Detalle de planes de ahorro programado y estados."
                />
                <ReportCard
                    to="/portal/admin/reports/services"
                    icon="fa-briefcase"
                    title="Reporte de Servicios"
                    description="Seguimiento de servicios no financieros."
                />
                <ReportCard
                    to="/portal/admin/reports/advisors"
                    icon="fa-users-cog"
                    title="Reporte de Asesores"
                    description="Rendimiento y gestión por asesor."
                />
                {/* Legacy/Secondary Reports could go here if needed, or be removed */}
                {/* 
                <ReportCard
                    to="/portal/admin/reports/loan-portfolio"
                    icon="fa-file-invoice-dollar"
                    title="Cartera de Préstamos (Legacy)"
                    description="Reporte histórico de préstamos."
                />
                */}
            </div>
        </div>
    );
};