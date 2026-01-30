import { getAllLoans } from './loanService';
import { getAllProgrammedSavings } from './savingsService';
import { getAllServices } from './nonFinancialService';
import { getAllAdvisors } from './advisorService';
import { ProgrammedSavingStatus } from '../types';

// --- OLD LOAN REPORTS (KEPT FOR REFERENCE OR LEGACY USE) ---

export interface PortfolioOverview {
    totalLoans: number;
    activeLoans: number;
    totalOutstanding: number; // sum of unpaid installment amounts
    totalOverdue: number;
    averageInterestRate: number | null;
    averageInstallmentsPerLoan: number | null;
}

export const getPortfolioOverview = async (): Promise<PortfolioOverview> => {
    const loans = await getAllLoans();
    const totalLoans = loans.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeLoans = loans.filter(l => l.status !== ('' as any) && l.status !== ("COMPLETADO" as any)).length;

    let totalOutstanding = 0;
    let totalOverdue = 0;
    let sumInterest = 0;
    let interestCount = 0;
    let sumInstallments = 0;

    const now = new Date();

    for (const loan of loans) {
        if (typeof loan.interestRate === 'number') {
            sumInterest += loan.interestRate;
            interestCount++;
        }
        if (typeof loan.installmentsTotal === 'number') {
            sumInstallments += loan.installmentsTotal;
        }

        for (const inst of loan.installments || []) {
            if (inst.status !== 'PAGADO') {
                totalOutstanding += inst.amount;
            }
            const due = inst.dueDate instanceof Date ? inst.dueDate : inst.dueDate ? new Date(inst.dueDate as any) : undefined;
            if (due && due < now && inst.status !== 'PAGADO') {
                totalOverdue += inst.amount;
            }
        }
    }

    return {
        totalLoans,
        activeLoans,
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        totalOverdue: parseFloat(totalOverdue.toFixed(2)),
        averageInterestRate: interestCount ? parseFloat((sumInterest / interestCount).toFixed(2)) : null,
        averageInstallmentsPerLoan: totalLoans ? parseFloat((sumInstallments / totalLoans).toFixed(2)) : null,
    };
};

export interface AgingBucket {
    label: string;
    minDays: number;
    maxDays?: number;
    amount: number;
    count: number;
}

export const getDelinquencyAging = async (): Promise<AgingBucket[]> => {
    const loans = await getAllLoans();
    const now = new Date();

    const buckets: AgingBucket[] = [
        { label: '1-30', minDays: 1, maxDays: 30, amount: 0, count: 0 },
        { label: '31-60', minDays: 31, maxDays: 60, amount: 0, count: 0 },
        { label: '61-90', minDays: 61, maxDays: 90, amount: 0, count: 0 },
        { label: '>90', minDays: 91, amount: 0, count: 0 },
    ];

    for (const loan of loans) {
        for (const inst of loan.installments || []) {
            const due = inst.dueDate instanceof Date ? inst.dueDate : inst.dueDate ? new Date(inst.dueDate as any) : undefined;
            if (!due) continue;
            const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            if (days <= 0) continue; // not overdue
            if (inst.status === 'PAGADO') continue;

            for (const b of buckets) {
                if (days >= b.minDays && (b.maxDays === undefined || days <= b.maxDays)) {
                    b.amount += inst.amount;
                    b.count += 1;
                    break;
                }
            }
        }
    }

    for (const b of buckets) b.amount = parseFloat(b.amount.toFixed(2));
    return buckets;
};

export interface PaymentActivity {
    reportedCount: number;
    approvedCount: number;
    rejectedCount: number;
    averageResolutionHours: number | null;
}

export const getPaymentActivity = async (daysRange = 30): Promise<PaymentActivity> => {
    const loans = await getAllLoans();
    const since = new Date();
    since.setDate(since.getDate() - daysRange);

    let reportedCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    const resolutionTimes: number[] = [];

    for (const loan of loans) {
        for (const inst of loan.installments || []) {
            const reportDate = inst.paymentReportDate instanceof Date ? inst.paymentReportDate : inst.paymentReportDate ? new Date(inst.paymentReportDate as any) : undefined;
            if (!reportDate) continue;
            if (reportDate < since) continue;
            reportedCount++;

            if (inst.status === 'PAGADO') {
                approvedCount++;
                const paymentDate = inst.paymentDate instanceof Date ? inst.paymentDate : inst.paymentDate ? new Date(inst.paymentDate as any) : undefined;
                if (paymentDate) {
                    resolutionTimes.push((paymentDate.getTime() - reportDate.getTime()) / (1000 * 60 * 60)); // hours
                }
            } else if (inst.status === 'POR VENCER' || inst.status === 'VENCIDO' || inst.status === 'EN ESPERA') {
                // pending or reverted
            } else if (inst.status === 'EN VERIFICACIÓN') {
                // still in verification - not counted as resolved
            } else if (inst.adminNotes && inst.adminNotes.toLowerCase().includes('rechaz')) {
                rejectedCount++;
            }
        }
    }

    const avgHours = resolutionTimes.length ? parseFloat((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(2)) : null;

    return { reportedCount, approvedCount, rejectedCount, averageResolutionHours: avgHours };
};

// --- NEW REPORTS FOR SAVINGS AND SERVICES ---

export interface DashboardKPIs {
    savings: {
        totalActivePlans: number;
        totalCapitalSaved: number;
        averageSavingsPerPlan: number;
    };
    services: {
        totalActive: number;
        totalCompletedThisMonth: number;
        topServiceType: string;
    };
}

export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
    const [savings, services] = await Promise.all([
        getAllProgrammedSavings(),
        getAllServices()
    ]);

    // Savings KPIs
    const activeSavings = savings.filter(s => s.estadoPlan === ProgrammedSavingStatus.ACTIVO);
    const totalActivePlans = activeSavings.length;
    const totalCapitalSaved = activeSavings.reduce((sum, s) => sum + (s.saldoActual || 0), 0);
    const averageSavingsPerPlan = totalActivePlans > 0 ? totalCapitalSaved / totalActivePlans : 0;

    // Services KPIs
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const activeServices = services.filter(s => s.estadoGeneral === 'EN_EJECUCION' || s.estadoGeneral === 'SOLICITADO');
    const completedServices = services.filter(s => {
        if (s.estadoGeneral !== 'FINALIZADO') return false;
        // Check if completed this month
        // We look for the last status history entry
        const lastEntry = s.historialDeEstados[s.historialDeEstados.length - 1];
        if (lastEntry && lastEntry.date) {
             const d = lastEntry.date.toDate();
             return d >= firstDayOfMonth;
        }
        return false;
    });

    // Find top service type
    const serviceTypesCount: Record<string, number> = {};
    services.forEach(s => {
        const type = s.tipoDeServicio;
        serviceTypesCount[type] = (serviceTypesCount[type] || 0) + 1;
    });
    
    let topServiceType = 'N/A';
    let maxCount = 0;
    for (const [type, count] of Object.entries(serviceTypesCount)) {
        if (count > maxCount) {
            maxCount = count;
            topServiceType = type;
        }
    }

    return {
        savings: {
            totalActivePlans,
            totalCapitalSaved,
            averageSavingsPerPlan
        },
        services: {
            totalActive: activeServices.length,
            totalCompletedThisMonth: completedServices.length,
            topServiceType
        }
    };
};

export interface AdvisorStats {
    advisorId: string;
    advisorName: string;
    activeSavingsCount: number;
    activeServicesCount: number;
    totalCapitalManaged: number;
    effectiveness: number;
}

export const getAdvisorStats = async (month?: Date | null, includeFinished: boolean = false): Promise<AdvisorStats[]> => {
    const [savings, services, advisors] = await Promise.all([
        getAllProgrammedSavings(),
        getAllServices(),
        getAllAdvisors()
    ]);

    const statsMap: Record<string, AdvisorStats & { finalizedServicesCount: number }> = {};

    // Initialize map with all advisors
    advisors.forEach(ad => {
        statsMap[ad.id] = {
            advisorId: ad.id,
            advisorName: ad.nombre,
            activeSavingsCount: 0,
            activeServicesCount: 0,
            totalCapitalManaged: 0,
            effectiveness: 0,
            finalizedServicesCount: 0
        };
    });

    const startOfMonth = month ? new Date(month.getFullYear(), month.getMonth(), 1) : null;
    const endOfMonth = month ? new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59) : null;

    // Aggregate Savings
    savings.forEach(s => {
        if (!s.advisorId || !statsMap[s.advisorId]) return;

        // Status Filter
        const isActive = s.estadoPlan === ProgrammedSavingStatus.ACTIVO;
        const isFinished = s.estadoPlan === ProgrammedSavingStatus.COMPLETADO;
        
        if (!isActive && !(includeFinished && isFinished)) return;

        // Date Filter
        if (month && startOfMonth && endOfMonth) {
            // Using fechaInicioPlan for date filtering
            const date = s.fechaInicioPlan ? new Date(s.fechaInicioPlan as any) : null;
            if (!date || date < startOfMonth || date > endOfMonth) return;
        }

        statsMap[s.advisorId].activeSavingsCount++;
        statsMap[s.advisorId].totalCapitalManaged += (s.saldoActual || 0);
    });

    // Aggregate Services
    services.forEach(s => {
        if (!s.advisorId || !statsMap[s.advisorId]) return;

        // Status Filter
        const isActive = s.estadoGeneral === 'EN_EJECUCION' || s.estadoGeneral === 'SOLICITADO';
        const isFinished = s.estadoGeneral === 'FINALIZADO';
        
        if (!isActive && !(includeFinished && isFinished)) return;
        
        // Date Filter
        if (month && startOfMonth && endOfMonth) {
            // Using fechaSolicitud for date filtering
            // Handle Firestore Timestamp or Date object
            let date: Date | null = null;
            if (s.fechaSolicitud) {
                 if (typeof (s.fechaSolicitud as any).toDate === 'function') {
                    date = (s.fechaSolicitud as any).toDate();
                 } else {
                    date = new Date(s.fechaSolicitud as any);
                 }
            }

            if (!date || date < startOfMonth || date > endOfMonth) return;
        }

        if (isActive) {
            statsMap[s.advisorId].activeServicesCount++;
        } else if (isFinished) {
            // Count finalized services for effectiveness calculation
            // Note: If 'includeFinished' is false, this block is active only if we are in this loop... 
            // Wait, if !includeFinished, we RETURNED above if !isActive & !isFinished.
            // If includeFinished=false, we only process Active services.
            // So effectiveness will be 0/Total? No.
            // If the user wants to see "Effectiveness" regardless of the filter...
            // BUT the function `getAdvisorStats` is called with `includeFinished=true` in AdvisorReportPage now (hardcoded).
            // So we ARE receiving finalized services here.
            
            // We need to NOT increment 'activeServicesCount' for finalized ones IF we want 'activeServicesCount' to mean ACTIVE.
            // But the previous implementations (and UI columns) say "Servicios Activos" or just "Servicios".
            // If I separate them, the table column "Servicios" might show Total (Active + Finalized) or just Active.
            // In the previous step, I simply incremented `activeServicesCount` for both.
            // User query: "Active vs Finalized".
            // So I should count them separately.
            statsMap[s.advisorId].finalizedServicesCount++;
        }
        
        // Maintain the "Active Services Count" as a Total Count for the column display?
        // The column header says "Servicios".
        // If I want to show the total load, I should probably sum them or keep using activeServicesCount as "Total Services (Filtered)".
        // I will stick to usage: activeServicesCount = The count displayed in the main column.
        statsMap[s.advisorId].activeServicesCount++;
    });

    // Calculate Effectiveness
    return Object.values(statsMap).map(stat => {
        const { finalizedServicesCount, ...rest } = stat;
        
        // We counted ACTIVE + FINALIZED in 'activeServicesCount' (variable name is misleading now, it's really 'displayServicesCount').
        // Let's deduce pure active count:
        // const pureActive = stat.activeServicesCount - finalizedServicesCount; 
        
        // Formula: Finalized / (Active + Finalized)
        // Since activeServicesCount ALREADY includes both (per logic above), the denominator is activeServicesCount (assuming it tracks processed items).
        
        const totalConsidered = stat.activeServicesCount; 
        
        const effectiveness = totalConsidered > 0 
            ? (finalizedServicesCount / totalConsidered) * 100 
            : 0;
        
        return {
            ...rest,
            effectiveness: parseFloat(effectiveness.toFixed(2))
        };
    });
};

export interface StatusDistribution {
    status: string;
    count: number;
}

export const getServiceStatsByStatus = async (): Promise<StatusDistribution[]> => {
    const services = await getAllServices();
    const counts: Record<string, number> = {};

    services.forEach(s => {
        // Group by 'estadoActual' which is the granular step
        const status = s.estadoActual || 'Desconocido';
        counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);
};

export const getSavingsStatsByStatus = async (): Promise<StatusDistribution[]> => {
    const savings = await getAllProgrammedSavings();
    const counts: Record<string, number> = {};

    savings.forEach(s => {
        const status = s.estadoPlan;
        counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);
};
