// src/services/loanService.ts
import {
    doc,
    setDoc,
    collection,
    getDoc,
    query,
    where,
    getDocs,
    updateDoc,
    arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import { Loan, Installment, LoanStatus, StatusChange } from '../types';
import { addMonths } from 'date-fns';

/**
 * NOTA IMPORTANTE:
 * Para que este servicio funcione, tu tipo `Loan` en `types.ts` debe usar un array
 * para las cuotas, así: `installments: Installment[];` (Ya corregido en el paso anterior).
 * Esto es para mantener la consistencia con tu script de importación `importGeneral.js`.
 * Además, debe incluir: `userCedula`, `installmentsTotal`, `installmentAmount`.
 */

// Interface para los datos que vienen del formulario de nuevo préstamo
export interface NewLoanFormData {
    userId: string;
    userName: string;
    userEmail: string;
    userCedula: string;
    loanAmount: number;
    interestRate: number; // Tasa de interés anual en porcentaje (ej. 15 para 15%)
    termInMonths: number;
    paymentFrequency: 'Mensual' | 'Quincenal' | 'Semanal';
    disbursementDate: string; // Formato YYYY-MM-DD
}

/**
 * Calcula la tabla de amortización para un préstamo usando el sistema francés (cuotas fijas).
 */
function calculateAmortization(
    principal: number,
    annualRate: number,
    termInMonths: number,
    startDate: Date
): { installments: Installment[], installmentAmount: number } {
    const monthlyRate = annualRate / 100 / 12;
    // Fórmula para el pago mensual (EMI)
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / (Math.pow(1 + monthlyRate, termInMonths) - 1);

    let balance = principal;
    const installments: Installment[] = [];

    for (let i = 1; i <= termInMonths; i++) {
        const interestForMonth = balance * monthlyRate;
        const principalForMonth = monthlyPayment - interestForMonth;
        balance -= principalForMonth;

        // Asegura que el último pago salde el balance exactamente
        const paymentAmount = (i === termInMonths) ? principalForMonth + interestForMonth + balance : monthlyPayment;

        installments.push({
            installmentNumber: i,
            dueDate: addMonths(startDate, i),
            amount: parseFloat(paymentAmount.toFixed(2)),
            status: 'POR VENCER', // Estado inicial
        });
    }

    return { installments, installmentAmount: parseFloat(monthlyPayment.toFixed(2)) };
}


/**
 * Crea un nuevo préstamo, calcula su tabla de amortización y lo guarda en Firestore.
 */
export const createLoan = async (data: NewLoanFormData): Promise<string> => {
    const {
        userId, userName, userEmail, userCedula,
        loanAmount, interestRate, termInMonths,
        disbursementDate: disbursementDateString,
    } = data;

    const loanCollectionRef = collection(db, 'loans');
    const newLoanRef = doc(loanCollectionRef); // Auto-genera un ID
    const newLoanId = newLoanRef.id;

    const disbursementDate = new Date(disbursementDateString + 'T00:00:00'); // Evita problemas de zona horaria
    const applicationDate = new Date();

    const { installments, installmentAmount } = calculateAmortization(
        loanAmount, interestRate, termInMonths, disbursementDate
    );

    const statusHistory: StatusChange[] = [{
        status: LoanStatus.SOLICITADO,
        date: applicationDate,
        notes: 'Préstamo creado desde el portal de administración.',
        updatedBy: 'sistema',
    }, {
        status: LoanStatus.DESEMBOLSADO,
        date: disbursementDate,
        notes: 'Préstamo desembolsado automáticamente al ser creado.',
        updatedBy: 'sistema',
    }];

    const newLoan: Omit<Loan, 'id'> = {
        userId, userName, userEmail, userCedula, loanAmount,
        currency: 'USD',
        applicationDate, disbursementDate,
        status: LoanStatus.DESEMBOLSADO,
        statusHistory,
        installmentsTotal: installments.length,
        installmentAmount,
        installments, // Guardamos como un array, igual que el importador
    };

    await setDoc(newLoanRef, newLoan);
    return newLoanId;
};

/**
 * Obtiene todos los préstamos para un ID de usuario específico.
 */
export const getLoansForUser = async (userId: string): Promise<Loan[]> => {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
};

/**
 * Obtiene los préstamos del usuario actualmente autenticado.
 * ESTA FUNCIÓN SOLUCIONA EL ERROR.
 */
export const getLoansForCurrentUser = async (): Promise<Loan[]> => {
    const user = auth.currentUser;
    if (!user) {
        console.log("No hay un usuario autenticado.");
        return [];
    }
    return getLoansForUser(user.uid);
};

/**
 * Obtiene un préstamo específico por su ID.
 */
export const getLoanById = async (loanId: string): Promise<Loan | null> => {
    const loanRef = doc(db, 'loans', loanId);
    const docSnap = await getDoc(loanRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Loan;
    }
    return null;
};

/**
 * Obtiene todos los préstamos de la base de datos (solo para admins).
 */
export const getAllLoans = async (): Promise<Loan[]> => {
    const loansRef = collection(db, 'loans');
    const querySnapshot = await getDocs(loansRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
};

/**
 * Reporta un pago para una cuota específica de un préstamo.
 * @param loanId El ID del préstamo.
 * @param installmentNumber El número de la cuota a pagar.
 * @param paymentData Los datos del pago (URL del recibo y notas).
 */
export const reportPaymentForInstallment = async (
    loanId: string,
    installmentNumber: number,
    paymentData: { receiptUrl: string; notes?: string }
): Promise<void> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error(`No se encontró el préstamo con ID: ${loanId}`);
    }

    const loan = loanSnap.data() as Loan;

    // Encontrar la cuota específica en el array
    const installmentIndex = loan.installments.findIndex(
        (inst) => inst.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }
    
    // Clonar el array de cuotas para no mutar el estado directamente
    const updatedInstallments = [...loan.installments];

    // Actualizar la cuota
    updatedInstallments[installmentIndex] = {
        ...updatedInstallments[installmentIndex],
        status: 'EN VERIFICACIÓN',
        receiptUrl: paymentData.receiptUrl,
        paymentReportNotes: paymentData.notes,
        paymentReportDate: new Date(),
    };

    // Actualizar el documento del préstamo en Firestore
    await updateDoc(loanRef, {
        installments: updatedInstallments,
    });
};

/**
 * Obtiene todas las cuotas pendientes de verificación por parte de un administrador.
 * @returns Un array de cuotas en estado 'EN VERIFICACIÓN' con información del préstamo y cliente.
 */
export const getPendingAdminInstallments = async (): Promise<any[]> => {
    // Usamos la función existente para obtener todos los préstamos.
    const allLoans = await getAllLoans();

    const pendingInstallments: any[] = [];

    // Iteramos sobre cada préstamo para encontrar cuotas pendientes.
    for (const loan of allLoans) {
        const pendingInThisLoan = loan.installments.filter(
            (inst) => inst.status === 'EN VERIFICACIÓN'
        );

        // Si encontramos cuotas pendientes, las enriquecemos con datos del préstamo y cliente.
        if (pendingInThisLoan.length > 0) {
            for (const inst of pendingInThisLoan) {
                pendingInstallments.push({
                    ...inst,
                    loanId: loan.id,
                    userId: loan.userId,
                    userName: loan.userName,
                    userCedula: loan.userCedula,
                });
            }
        }
    }

    return pendingInstallments;
};

/**
 * Aprueba un pago reportado para una cuota.
 * @param loanId El ID del préstamo.
 * @param installmentNumber El número de la cuota.
 */
export const approvePayment = async (loanId: string, installmentNumber: number): Promise<void> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error(`No se encontró el préstamo con ID: ${loanId}`);
    }

    const loan = loanSnap.data() as Loan;
    const installmentIndex = loan.installments.findIndex(
        (inst) => inst.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }

    const updatedInstallments = [...loan.installments];
    updatedInstallments[installmentIndex] = {
        ...updatedInstallments[installmentIndex],
        status: 'PAGADO',
        paymentDate: new Date(), // Fecha de confirmación del pago
        adminNotes: `Pago aprobado por ${auth.currentUser?.email || 'admin'}.`,
    };

    // Verificar si todas las cuotas están pagadas para completar el préstamo
    const allPaid = updatedInstallments.every(inst => inst.status === 'PAGADO');
    
    const updateData: { installments: Installment[], status?: LoanStatus, statusHistory?: any } = {
        installments: updatedInstallments,
    };

    if (allPaid && loan.status !== LoanStatus.COMPLETADO) {
        const statusUpdate: StatusChange = {
            status: LoanStatus.COMPLETADO,
            date: new Date(),
            notes: 'Todas las cuotas han sido pagadas.',
            updatedBy: auth.currentUser?.email || 'sistema',
        };
        updateData.status = LoanStatus.COMPLETADO;
        updateData.statusHistory = arrayUnion(statusUpdate);
    }

    await updateDoc(loanRef, updateData);
};

/**
 * Rechaza un pago reportado para una cuota.
 * @param loanId El ID del préstamo.
 * @param installmentNumber El número de la cuota.
 * @param reason El motivo del rechazo.
 */
export const rejectPayment = async (loanId: string, installmentNumber: number, reason: string): Promise<void> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error(`No se encontró el préstamo con ID: ${loanId}`);
    }

    const loan = loanSnap.data() as Loan;
    const installmentIndex = loan.installments.findIndex(
        (inst) => inst.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }

    const originalInstallment = loan.installments[installmentIndex];
    const isOverdue = new Date(originalInstallment.dueDate) < new Date();

    const updatedInstallments = [...loan.installments];
    updatedInstallments[installmentIndex] = {
        ...originalInstallment,
        status: isOverdue ? 'VENCIDO' : 'POR VENCER',
        receiptUrl: undefined, // Limpiar datos del reporte
        paymentReportDate: undefined,
        paymentReportNotes: undefined,
        adminNotes: `Rechazado por ${auth.currentUser?.email || 'admin'}: ${reason}`,
    };

    await updateDoc(loanRef, {
        installments: updatedInstallments,
    });
};