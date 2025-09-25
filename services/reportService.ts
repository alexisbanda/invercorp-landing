import { getAllLoans } from './loanService';

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
