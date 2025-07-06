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
const docToLoan = (doc: any): Loan => {
    const data = doc.data();
    const installmentsSource = Array.isArray(data.installments) ? data.installments : [];
    const formattedInstallments = installmentsSource.map((inst: any) => ({
        ...inst,
        dueDate: inst.dueDate?.toDate(),
        paymentDate: inst.paymentDate?.toDate(),
        paymentReportDate: inst.paymentReportDate?.toDate(), // Aseguramos convertir todas las fechas
        paymentConfirmationDate: inst.paymentConfirmationDate?.toDate(),
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
 * Obtiene un préstamo específico por su ID.
 */
export const getLoanById = async (loanId: string): Promise<Loan | null> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        console.warn(`No se encontró el préstamo con ID: ${loanId}`);
        return null;
    }

    return docToLoan(loanSnap);
};


/**
 * Obtiene los préstamos de un usuario específico para el portal de cliente.
 */
export const getLoansForCurrentUser = async (userId: string): Promise<Loan[]> => {
    // ... (código existente sin cambios)
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

    const loans = querySnapshot.docs.map(docToLoan);
    return loans;
};

/**
 * Obtiene TODOS los préstamos de la base de datos para el panel de admin.
 */
export const getAllLoansForAdmin = async (): Promise<Loan[]> => {
    // ... (código existente sin cambios)
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, orderBy('applicationDate', 'desc'));
    const querySnapshot = await getDocs(q);
    const allLoans: Loan[] = querySnapshot.docs.map(docToLoan);
    return allLoans;
};


/**
 * Reporta el pago de una cuota, actualizando su estado y añadiendo notas.
 */
export const reportPaymentForInstallment = async (
    // ... (código existente sin cambios)
    loanId: string,
    installmentNumber: number,
    reportData: { paymentReportNotes: string }
) => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error("El préstamo no fue encontrado.");
    }

    const installments = loanSnap.data().installments || [];
    if (!Array.isArray(installments)) {
        throw new Error(`Los datos de cuotas para el préstamo ${loanId} están corruptos.`);
    }

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
 * Esta es una función genérica que puede ser usada para aprobar o rechazar.
 */
export const resolvePayment = async (
    loanId: string,
    installmentNumber: number,
    newStatus: 'PAGADO' | 'PENDIENTE', // Limitamos a los estados de resolución
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
                update.paymentConfirmationDate = new Date(); // Se convierte a Timestamp en Firestore
                update.paymentDate = inst.paymentReportDate?.toDate() || new Date(); // Asumimos la fecha de reporte como la de pago
            } else {
                // Si se rechaza, limpiamos los datos del reporte de pago
                update.paymentReportDate = null;
                update.paymentReportNotes = '';
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
    // ... (código existente sin cambios)
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


// --- NUEVAS FUNCIONES PARA EL COMPONENTE ADMIN ---

/**
 * Aprueba el pago de una cuota.
 * Es una envoltura sobre `resolvePayment` para mayor claridad en el componente.
 */
export const approvePayment = async (loanId: string, installmentNumber: number): Promise<void> => {
    await resolvePayment(loanId, installmentNumber, 'PAGADO', 'Pago aprobado por el administrador.');
};

/**
 * Rechaza el pago de una cuota, devolviéndola al estado PENDIENTE.
 * Es una envoltura sobre `resolvePayment`.
 */
export const rejectPayment = async (loanId: string, installmentNumber: number, reason: string): Promise<void> => {
    if (!reason) {
        throw new Error("El motivo del rechazo es obligatorio.");
    }
    await resolvePayment(loanId, installmentNumber, 'PENDIENTE', `Rechazado: ${reason}`);
};

/**
 * Obtiene una lista plana de todas las cuotas que requieren atención del admin.
 * Filtra por los estados: PENDIENTE, VENCIDO y EN VERIFICACIÓN.
 * Es más eficiente que obtener todos los préstamos y filtrar en el cliente.
 *
 * @returns Un array de cuotas, cada una con datos clave de su préstamo.
 */
export const getPendingAdminInstallments = async (): Promise<(Installment & { loanId: string; userName: string; userEmail: string })[]> => {
    // 1. Obtenemos todos los préstamos.
    const allLoans = await getAllLoansForAdmin();

    // 2. Definimos los estados que nos interesan.
    const targetStatuses: Installment['status'][] = ['PENDIENTE', 'VENCIDO', 'EN VERIFICACIÓN'];

    // 3. Usamos flatMap para transformar la lista de préstamos en una lista de cuotas que cumplen la condición.
    const pendingInstallments = allLoans.flatMap(loan =>
        loan.installments
            .filter(inst => targetStatuses.includes(inst.status))
            .map(inst => ({
                ...inst, // Copiamos todos los datos de la cuota
                // Y añadimos la información relevante del préstamo padre
                loanId: loan.id,
                userName: loan.userName,
                userEmail: loan.userEmail,
            }))
    );

    // 4. Opcional: Ordenamos las cuotas por fecha de vencimiento para mostrar las más urgentes primero.
    pendingInstallments.sort((a, b) => {
        const dateA = a.dueDate?.getTime() || 0;
        const dateB = b.dueDate?.getTime() || 0;
        return dateA - dateB; // Orden ascendente
    });

    return pendingInstallments;
};