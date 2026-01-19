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

// --- New Admin Report Components ---
import { DashboardPage as AdminDashboardPage } from './components/admin/reports/DashboardPage';
import { AdvisorReportPage } from './components/admin/reports/AdvisorReportPage';
import { ServicesReportPage } from './components/admin/reports/ServicesReportPage';
import { SavingsReportPage } from './components/admin/reports/SavingsReportPage';

// Old reports - kept if needed for reference, but dashboard replaced
import { PendingInstallmentsReportPage } from './components/admin/reports/PendingInstallmentsReportPage';
import { PortfolioOverviewPage } from './components/admin/reports/PortfolioOverviewPage';
import { DelinquencyAgingPage } from './components/admin/reports/DelinquencyAgingPage';
import { PaymentActivityPage } from './components/admin/reports/PaymentActivityPage';

import SavingsManagementPage from './components/admin/SavingsManagementPage';
import AdminNewProgrammedSavingForm from './components/admin/AdminNewProgrammedSavingForm';
import AdminProgrammedSavingDetailPage from './components/admin/AdminProgrammedSavingDetailPage';
import NewClientPage from './components/admin/NewClientPage';
import AdminNewLoanForm from './components/admin/AdminNewLoanForm';
import ClientManagementPage from './components/admin/ClientManagementPage';
import ServiceManagementPage from './components/admin/ServiceManagementPage';
import NewServiceForm from './components/admin/NewServiceForm';
import ServiceDetailPage from './components/admin/ServiceDetailPage';
import ClientServiceDetailPage from './components/ClientServiceDetailPage';
import AdvisorManagementPage from './components/admin/AdvisorManagementPage';

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
                    <Route path="/portal/services/:serviceId" element={<ClientServiceDetailPage />} />
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
                    
                    {/* Reporting Routes */}
                    <Route path="/portal/admin/reports/dashboard" element={<AdminDashboardPage />} />
                    <Route path="/portal/admin/reports/advisors" element={<AdvisorReportPage />} />
                    <Route path="/portal/admin/reports/services" element={<ServicesReportPage />} />
                    <Route path="/portal/admin/reports/savings" element={<SavingsReportPage />} />
                    
                    {/* Legacy Reports or Specific Financial Reports */}
                    <Route path="/portal/admin/reports/pending-installments" element={<PendingInstallmentsReportPage />} />
                    <Route path="/portal/admin/reports/loan-portfolio" element={<PortfolioOverviewPage />} />
                    <Route path="/portal/admin/reports/delinquency" element={<DelinquencyAgingPage />} />
                    <Route path="/portal/admin/reports/payment-activity" element={<PaymentActivityPage />} />

                    {/* Management Routes */}
                    <Route path="/portal/admin/management" element={<LoanManagementPage />} />
                    <Route path="/portal/admin/management/:loanId" element={<LoanInstallmentsPage />} />
                    <Route path="/portal/admin/pending-deposits" element={<PendingDepositsPage />} />
                    
                    {/* Rutas para Ahorros */}
                    <Route path="/portal/admin/savings" element={<SavingsManagementPage />} />
                    <Route path="/portal/admin/savings/:clienteId/:numeroCartola" element={<AdminProgrammedSavingDetailPage />} />
                    <Route path="/portal/admin/savings/new" element={<AdminNewProgrammedSavingForm />} />
                    
                    {/* Nuevas rutas para Clientes y Préstamos */}
                    <Route path="/portal/admin/clients/new" element={<NewClientPage />} />
                    <Route path="/portal/admin/clients/new-loan" element={<AdminNewLoanForm />} />
                    <Route path="/portal/admin/loans/new" element={<AdminNewLoanForm />} />
                    <Route path="/portal/admin/loans/:loanId" element={<LoanInstallmentsPage />} />
                    <Route path="/portal/admin/clients" element={<ClientManagementPage />} />

                    {/* Rutas para Servicios No Financieros */}
                    <Route path="/portal/admin/services" element={<ServiceManagementPage />} />
                    <Route path="/portal/admin/services/new" element={<NewServiceForm />} />
                    <Route path="/portal/admin/services/:serviceId" element={<ServiceDetailPage />} />
                    <Route path="/portal/admin/advisors" element={<AdvisorManagementPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;