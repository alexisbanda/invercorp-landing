// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DashboardPage } from './components/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// --- Componentes de Ahorro Programado ---
import ProgrammedSavingsPage from './components/ProgrammedSavingsPage';
import NewProgrammedSavingForm from './components/NewProgrammedSavingForm';
import ProgrammedSavingDetailPage from './components/ProgrammedSavingDetailPage';
import PendingDepositsPage from './components/admin/PendingDepositsPage';

// --- Layouts ---
import { ClientPortalLayout } from './components/ClientPortalLayout';
import { PortalLayout as AdminPortalLayout } from './components/admin/PortalLayout';

// --- Componentes de admin ---
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { ReportsPage } from './components/admin/ReportsPage';
import { LoanManagementPage } from './components/admin/LoanManagementPage';
import { LoanInstallmentsPage } from './components/admin/LoanInstallmentsPage.tsx';
import { DashboardReports } from './components/admin/DashboardReports';
import { PendingInstallmentsReportPage } from './components/admin/reports/PendingInstallmentsReportPage';
import { LoanPortfolioReportPage } from './components/admin/reports/LoanPortfolioReportPage';
import { DelinquencyReportPage } from './components/admin/reports/DelinquencyReportPage';
import SavingsManagementPage from './components/admin/SavingsManagementPage';
import AdminNewProgrammedSavingForm from './components/admin/AdminNewProgrammedSavingForm';

function App() {
    return (
        <Router>
            <Routes>
                {/* --- Ruta Pública --- */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/portal/login" element={<LoginPage />} />

                {/* --- NUEVA ESTRUCTURA: Rutas de Cliente con Layout --- */}
                <Route 
                    element={
                        <ProtectedRoute>
                            <ClientPortalLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/portal/dashboard" element={<DashboardPage />} />
                    <Route path="/portal/ahorros" element={<ProgrammedSavingsPage />} />
                    <Route path="/portal/ahorros/nuevo" element={<NewProgrammedSavingForm />} />
                    <Route path="/portal/ahorros/:id" element={<ProgrammedSavingDetailPage />} />
                </Route>

                {/* --- NUEVA ESTRUCTURA: Rutas de Administración con Layout --- */}
                <Route
                    element={
                        <AdminProtectedRoute>
                            <AdminPortalLayout />
                        </AdminProtectedRoute>
                    }
                >
                    <Route path="/portal/admin" element={<Navigate to="/portal/admin/reports/dashboard" replace />} />
                    <Route path="/portal/admin/reports" element={<ReportsPage />} />
                    <Route path="/portal/admin/management" element={<LoanManagementPage />} />
                    <Route path="/portal/admin/management/:loanId" element={<LoanInstallmentsPage />} />
                    <Route path="/portal/admin/reports/dashboard" element={<DashboardReports />} />
                    <Route path="/portal/admin/reports/pending-installments" element={<PendingInstallmentsReportPage />} />
                    <Route path="/portal/admin/reports/loan-portfolio" element={<LoanPortfolioReportPage />} />
                    <Route path="/portal/admin/reports/delinquency" element={<DelinquencyReportPage />} />
                    <Route path="/portal/admin/pending-deposits" element={<PendingDepositsPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;