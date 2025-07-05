// services/loanService.ts
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    doc,
    getDoc,
    updateDoc,
    FieldValue,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase-config';
import { Loan, Installment, LoanStatus } from '../types';

/**
 * Obtiene los préstamos de un usuario específico para el portal de cliente.
 */
export const getLoansForCurrentUser = async (userId: string): Promise<Loan[]> => {
    const loansCollectionRef = collection(db, 'loans');
    const q = query(
        loansCollectionRef,
        where('userId', '==', userId),
        orderBy('applicationDate', 'desc') // Ordenamos por la nueva fecha
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Mapeo completo y seguro de los datos del préstamo
    const loans = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const formattedInstallments = (data.installments || []).map((inst: any) => ({
            ...inst,
            dueDate: inst.dueDate.toDate(),
            paymentDate: inst.paymentDate?.toDate(),
        }));

        return {
            id: doc.id,
            userId: data.userId,
            userName: data.userName,
            userEmail: data.userEmail,
            loanAmount: data.loanAmount,
            currency: data.currency,
            // Mapeamos todos los nuevos campos
            applicationDate: data.applicationDate.toDate(),
            disbursementDate: data.disbursementDate?.toDate(),
            status: data.status as LoanStatus,
            statusHistory: data.statusHistory || [],
            installments: formattedInstallments,
        } as Loan;
    });
    // --- FIN DE LA CORRECCIÓN ---

    return loans;
};

/**
 * Obtiene TODOS los préstamos de la base de datos para el panel de admin.
 */
export const getAllLoansForAdmin = async (): Promise<Loan[]> => {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, orderBy('applicationDate', 'desc'));
    const querySnapshot = await getDocs(q);

    // --- INICIO DE LA CORRECCIÓN ---
    // Mapeo completo y seguro de los datos del préstamo
    const allLoans: Loan[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const formattedInstallments = (data.installments || []).map((inst: any) => ({
            ...inst,
            dueDate: inst.dueDate.toDate(),
            paymentDate: inst.paymentDate?.toDate(),
        }));
        return {
            id: doc.id,
            userId: data.userId,
            userEmail: data.userEmail,
            userName: data.userName,
            loanAmount: data.loanAmount,
            currency: data.currency,
            // Mapeamos todos los nuevos campos
            applicationDate: data.applicationDate.toDate(),
            disbursementDate: data.disbursementDate?.toDate(),
            status: data.status as LoanStatus,
            statusHistory: data.statusHistory || [],
            installments: formattedInstallments,
        } as Loan;
    });
    // --- FIN DE LA CORRECCIÓN ---

    return allLoans;
};


/**
 * Reporta el pago de una cuota, actualizando su estado y añadiendo notas.
 * @param loanId - El ID del préstamo.
 * @param installmentNumber - El número de la cuota a reportar.
 * @param reportData - Un objeto que contiene las notas del reporte.
 */
export const reportPaymentForInstallment = async (
    loanId: string,
    installmentNumber: number,
    reportData: { paymentReportNotes: string }
) => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error("El préstamo no fue encontrado.");
    }

    const loan = loanSnap.data() as Loan;
    const installments = loan.installments || [];

    // Busca la cuota y la actualiza
    const updatedInstallments = installments.map(inst => {
        if (inst.installmentNumber === installmentNumber) {
            // ¡ESTA ES LA CORRECCIÓN CLAVE!
            // Usamos Timestamp.fromDate() para convertir el Date de JS a un Timestamp de Firestore.
            return {
                ...inst,
                status: 'EN VERIFICACIÓN',
                paymentReportDate: Timestamp.fromDate(new Date()), // <-- CORRECCIÓN
                paymentReportNotes: reportData.paymentReportNotes,
                adminNotes: '', // Opcional: Limpiar notas antiguas del admin al reportar
            };
        }
        return inst;
    });

    // Escribe el array de cuotas completamente actualizado de vuelta al documento.
    await updateDoc(loanRef, {
        installments: updatedInstallments
    });
};

/**
 * Resuelve un pago reportado (acción del admin).
 */
export const resolvePayment = async (
    loanId: string,
    installmentNumber: number,
    newStatus: 'PAGADO' | 'PENDIENTE' | 'EN ESPERA',
    adminNotes: string
): Promise<void> => {
    const loanDocRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanDocRef);

    if (!loanSnap.exists()) {
        throw new Error("Préstamo no encontrado.");
    }

    const currentInstallments = loanSnap.data().installments || [];

    const updatedInstallments = currentInstallments.map((inst: Installment) => {
        if (inst.installmentNumber === installmentNumber) {
            const update: Partial<Installment> = {
                status: newStatus,
                adminNotes: adminNotes || '',
            };
            if (newStatus === 'PAGADO') {
                update.paymentConfirmationDate = new Date(); // Usamos el campo de fecha correcto
            }
            return { ...inst, ...update };
        }
        return inst;
    });

    await updateDoc(loanDocRef, {
        installments: updatedInstallments
    });
};

/**
 * Actualiza el estado de un préstamo completo (acción del admin).
 */
export const updateLoanStatus = async (
    loanId: string,
    newStatus: LoanStatus,
    adminId: string,
    notes: string
): Promise<void> => {
    const loanDocRef = doc(db, 'loans', loanId);

    const newStatusEntry = {
        status: newStatus,
        date: new Date(),
        updatedBy: adminId,
        notes: notes,
    };

    const updateData: any = {
        status: newStatus,
        statusHistory: arrayUnion(newStatusEntry),
    };

    if (newStatus === LoanStatus.DESEMBOLSADO) {
        updateData.disbursementDate = new Date();
    }

    await updateDoc(loanDocRef, updateData);
};