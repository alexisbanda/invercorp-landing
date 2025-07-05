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

// --- FUNCIÓN DE AYUDA REUTILIZABLE ---
// Para evitar repetir código, podemos crear una función que transforme un documento de Firestore a nuestro tipo `Loan`.
const docToLoan = (doc: any): Loan => {
    const data = doc.data();

    // --- CORRECCIÓN CLAVE ---
    // Verificamos si `data.installments` es un arreglo. Si no lo es, usamos un arreglo vacío.
    const installmentsSource = Array.isArray(data.installments) ? data.installments : [];
    const formattedInstallments = installmentsSource.map((inst: any) => ({
        ...inst,
        // Aseguramos que dueDate exista antes de llamar a toDate()
        dueDate: inst.dueDate?.toDate(),
        // El `?` ya maneja si paymentDate es null/undefined
        paymentDate: inst.paymentDate?.toDate(),
    }));

    return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        loanAmount: data.loanAmount,
        currency: data.currency,
        applicationDate: data.applicationDate?.toDate(),
        disbursementDate: data.disbursementDate?.toDate(),
        status: data.status as LoanStatus,
        statusHistory: data.statusHistory || [],
        installments: formattedInstallments,
    } as Loan;
}


/**
 * Obtiene los préstamos de un usuario específico para el portal de cliente.
 */
export const getLoansForCurrentUser = async (userId: string): Promise<Loan[]> => {
    const loansCollectionRef = collection(db, 'loans');
    const q = query(
        loansCollectionRef,
        where('userId', '==', userId),
        orderBy('applicationDate', 'desc')
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return [];
    }

    // Usamos la función de ayuda para mapear los resultados de forma segura.
    const loans = querySnapshot.docs.map(docToLoan);

    return loans;
};

/**
 * Obtiene TODOS los préstamos de la base de datos para el panel de admin.
 */
export const getAllLoansForAdmin = async (): Promise<Loan[]> => {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, orderBy('applicationDate', 'desc'));
    const querySnapshot = await getDocs(q);

    // Usamos la misma función de ayuda aquí.
    const allLoans: Loan[] = querySnapshot.docs.map(docToLoan);

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

    // Es más seguro obtener los datos y validarlos
    const installments = loanSnap.data().installments || [];
    if (!Array.isArray(installments)) {
        // Si las cuotas no son un array en la BD, no podemos continuar.
        throw new Error(`Los datos de cuotas para el préstamo ${loanId} están corruptos.`);
    }

    // Busca la cuota y la actualiza
    const updatedInstallments = installments.map(inst => {
        if (inst.installmentNumber === installmentNumber) {
            return {
                ...inst,
                status: 'EN VERIFICACIÓN',
                paymentReportDate: Timestamp.fromDate(new Date()),
                paymentReportNotes: reportData.paymentReportNotes,
                adminNotes: '',
            };
        }
        return inst;
    });

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
    if (!Array.isArray(currentInstallments)) {
        throw new Error(`Los datos de cuotas para el préstamo ${loanId} están corruptos.`);
    }

    const updatedInstallments = currentInstallments.map((inst: Installment) => {
        if (inst.installmentNumber === installmentNumber) {
            const update: Partial<Installment> = {
                status: newStatus,
                adminNotes: adminNotes || '',
            };
            if (newStatus === 'PAGADO') {
                // Firestore maneja bien los objetos Date de JS al escribir, los convierte a Timestamps.
                update.paymentConfirmationDate = new Date();
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

    // Firestore convierte automáticamente los objetos Date a Timestamps al escribir.
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