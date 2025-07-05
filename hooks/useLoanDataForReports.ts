// /src/hooks/useLoanDataForReports.ts
import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import { Loan, Installment, LoanStatus } from '../types';

// Tipos para los datos procesados que devolverá el hook
export interface ReportStats {
    totalLoanAmount: number;
    totalCollected: number;
    totalOverdue: number;
    loansByStatus: { name: string; value: number }[];
}

// --- FUNCIÓN AUXILIAR MEJORADA ---
// Esta función manejará tanto arrays como objetos de forma segura.
const processInstallments = (installmentsData: any): Installment[] => {
    let installmentsArray: any[] = [];

    if (Array.isArray(installmentsData)) {
        installmentsArray = installmentsData;
    } else if (installmentsData && typeof installmentsData === 'object') {
        // Si es un objeto, convierte sus valores en un array.
        installmentsArray = Object.values(installmentsData);
    }

    return installmentsArray.map((inst: any) => ({
        ...inst,
        dueDate: (inst.dueDate as Timestamp)?.toDate(),
        paymentDate: inst.paymentDate ? (inst.paymentDate as Timestamp).toDate() : undefined,
        // Añade cualquier otra conversión de fecha que necesites aquí
    }));
};


export const useLoanDataForReports = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [installments, setInstallments] = useState<(Installment & { loanId: string; userName: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const loansCollection = collection(db, 'loans');
                const loansSnapshot = await getDocs(loansCollection);

                const loansData: Loan[] = loansSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        applicationDate: (data.applicationDate as Timestamp).toDate(),
                        disbursementDate: data.disbursementDate ? (data.disbursementDate as Timestamp).toDate() : undefined,
                        // --- ¡LA CORRECCIÓN CLAVE ESTÁ AQUÍ! ---
                        // Usamos la nueva función auxiliar para procesar las cuotas.
                        installments: processInstallments(data.installments),
                    } as Loan;
                });

                // Derivamos las cuotas desde los préstamos ya procesados
                const allInstallments = loansData.flatMap(loan =>
                    (loan.installments || []).map(inst => ({ ...inst, loanId: loan.id, userName: loan.userName }))
                );

                setLoans(loansData);
                setInstallments(allInstallments);
                setError(null);
            } catch (err) {
                console.error("Error fetching report data:", err);
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Usamos useMemo para procesar los datos solo cuando cambian, no en cada render
    const processedData = useMemo(() => {
        if (isLoading || error) {
            return { stats: null, overdueInstallments: [] };
        }

        const stats: ReportStats = {
            totalLoanAmount: 0,
            totalCollected: 0,
            totalOverdue: 0,
            loansByStatus: [],
        };

        const loanStatusCounts = loans.reduce((acc, loan) => {
            acc[loan.status] = (acc[loan.status] || 0) + 1;
            stats.totalLoanAmount += loan.loanAmount;
            return acc;
        }, {} as Record<LoanStatus, number>);

        stats.loansByStatus = Object.entries(loanStatusCounts).map(([name, value]) => ({ name, value }));

        const overdueInstallments: (Installment & { loanId: string; userName: string })[] = [];
        installments.forEach(inst => {
            if (inst.status === 'PAGADO') {
                stats.totalCollected += inst.amount;
            }
            if (inst.status === 'VENCIDO') {
                stats.totalOverdue += inst.amount;
                overdueInstallments.push(inst);
            }
        });

        return { stats, overdueInstallments };

    }, [loans, installments, isLoading, error]);

    return { stats: processedData.stats, loans, installments: processedData.overdueInstallments, isLoading, error };
};