// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// --- Componentes de admin ---
//import { AdminDashboard } from './components/AdminDashboard';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { ReportsPage } from './components/admin/ReportsPage';
import { LoanManagementPage } from './components/admin/LoanManagementPage';
import { LoanInstallmentsPage } from './components/admin/LoanInstallmentsPage.tsx'; // Crearemos este componente
// --- NUEVO: Importar el layout ---
import { PortalLayout } from './components/admin/PortalLayout';
import { DashboardReports } from './components/admin/DashboardReports'; // Importamos el dashboard de KPIs
import { PendingInstallmentsReportPage } from './components/admin/reports/PendingInstallmentsReportPage';
import { LoanPortfolioReportPage } from './components/admin/reports/LoanPortfolioReportPage';
import { DelinquencyReportPage } from './components/admin/reports/DelinquencyReportPage';


function App() {
    return (
        <Router>
            <Routes>
                {/* --- Rutas Públicas y de Cliente --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/portal/login" element={<LoginPage />} />
                <Route
                    path="/portal/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />

                {/* --- NUEVA ESTRUCTURA: Rutas de Administración con Layout --- */}
                <Route
                    element={
                        <AdminProtectedRoute>
                            <PortalLayout />
                        </AdminProtectedRoute>
                    }
                >
                    <Route
                        path="/portal/admin"
                        element={<Navigate to="/portal/admin/reports/dashboard" replace />}
                    />
                    <Route path="/portal/admin/reports" element={<ReportsPage />} />
                    <Route path="/portal/admin/management" element={<LoanManagementPage />} />
                    <Route path="/portal/admin/management/:loanId" element={<LoanInstallmentsPage />} />
                    <Route path="/portal/admin/reports/dashboard" element={<DashboardReports />} />
                    <Route path="/portal/admin/reports/pending-installments" element={<PendingInstallmentsReportPage />} />
                    <Route path="/portal/admin/reports/loan-portfolio" element={<LoanPortfolioReportPage />} />
                    <Route path="/portal/admin/reports/delinquency" element={<DelinquencyReportPage />} />

                </Route>
            </Routes>
        </Router>
    );
}

export default App;