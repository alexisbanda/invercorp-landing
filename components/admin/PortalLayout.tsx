// src/components/admin/PortalLayout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from './AdminHeader';

export const PortalLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader />
            <main>
                {/* Outlet renderizará el componente de la ruta hija (ej. AdminDashboard, ReportsPage) */}
                <Outlet />
            </main>
        </div>
    );
};