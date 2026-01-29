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
    arrayUnion,
    // Importa Timestamp si necesitas crear uno explícitamente, aunque Firestore lo hace automáticamente desde Date
    // Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import { Loan, Installment, LoanStatus, StatusChange } from '../types';
import { addMonths } from 'date-fns';

/**
 * NOTA IMPORTANTE:
 * Para que este servicio funcione, tu tipo `Loan` en `types.ts` debe usar un array
 * para las cuotas, así: `installments: Installment[];`.
 * Además, debe incluir: `userCedula`, `installmentsTotal`, `installmentAmount`.
 * Las propiedades de fecha en los tipos (`Loan`, `Installment`, `StatusChange`) deben ser `Date | undefined` o `Date | null`.
 */

// Helper para convertir Firestore Timestamp a Date
// Firestore almacena fechas como Timestamps. Para usar métodos como toLocaleDateString(),
// necesitamos convertirlos a objetos Date de JavaScript.
const convertFirestoreTimestampToDate = (timestamp: any): Date | undefined => {
    // Verifica si el objeto es un Timestamp de Firestore y tiene el método toDate()
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    // Si ya es un objeto Date (por ejemplo, si se creó con new Date() en el frontend y aún no se guardó/recargó)
    // o si es null/undefined, lo retorna directamente.
    if (timestamp instanceof Date || timestamp === null || timestamp === undefined) {
        return timestamp;
    }
    // En caso de un formato inesperado, retorna undefined
    return undefined;
};

// Interface para los datos que vienen del formulario de nuevo préstamo
export interface NewLoanFormData {
    userId: string;
    userName: string;
    userEmail: string;
    userCedula: string;
    loanAmount: number;
    interestRate: number; // Tasa de interés anual en porcentaje (ej. 15 para 15%)
    termValue: number; // Valor del plazo (ej. 12 para meses, 24 para quincenas, 48 para semanas)
    paymentFrequency: 'Mensual' | 'Quincenal' | 'Semanal';
    disbursementDate: string; // Formato YYYY-MM-DD
    advisorId?: string;
    advisorName?: string;
}

/**
 * Calcula la tabla de amortización para un préstamo usando el sistema francés (cuotas fijas).
 * NOTA: Esta función asume que el plazo (termValue) se convierte a meses internamente si la frecuencia no es mensual.
 * Si la lógica de amortización es más compleja (ej. Alemana, o cuotas predefinidas como en los CSV),
 * esta función necesitaría ser adaptada o reemplazada por una que cargue las cuotas directamente.
 */
function calculateAmortization(
    principal: number,
    annualRate: number,
    termValue: number, // Ahora es termValue
    paymentFrequency: 'Mensual' | 'Quincenal' | 'Semanal', // Nueva frecuencia
    startDate: Date
): { installments: Installment[], installmentAmount: number } {
    let monthlyRate: number;
    let totalPayments: number;

    // Ajustar la tasa y el número total de pagos según la frecuencia
    switch (paymentFrequency) {
        case 'Mensual':
            monthlyRate = annualRate / 100 / 12;
            totalPayments = termValue;
            break;
        case 'Quincenal':
            monthlyRate = annualRate / 100 / 24; // 24 quincenas en un año
            totalPayments = termValue;
            break;
        case 'Semanal':
            monthlyRate = annualRate / 100 / 52; // 52 semanas en un año
            totalPayments = termValue;
            break;
        default:
            throw new Error('Frecuencia de pago no soportada.');
    }

    // Manejo de tasa cero para evitar división por cero o cálculos incorrectos
    const paymentAmount = monthlyRate === 0
        ? principal / totalPayments // Si la tasa es 0, el pago es solo capital dividido por el número de pagos
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);

    let balance = principal;
    const installments: Installment[] = [];

    for (let i = 1; i <= totalPayments; i++) {
        const interestForPeriod = balance * monthlyRate;
        const principalForPeriod = paymentAmount - interestForPeriod;
        balance -= principalForPeriod;

        // Asegura que el último pago salde el balance exactamente
        // Se ajusta el último balance para evitar pequeñas diferencias de flotante
        const finalPaymentAmount = (i === totalPayments) ? principalForPeriod + interestForPeriod + balance : paymentAmount;

        let dueDate: Date;
        // Calcular la fecha de vencimiento basada en la frecuencia
        switch (paymentFrequency) {
            case 'Mensual':
                dueDate = addMonths(startDate, i);
                break;
            case 'Quincenal':
                // Para quincenal, se suman 15 días por cada cuota
                dueDate = new Date(startDate.getTime() + (i * 15 * 24 * 60 * 60 * 1000));
                break;
            case 'Semanal':
                // Para semanal, se suman 7 días por cada cuota
                dueDate = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
                break;
            default:
                dueDate = startDate; // Fallback
        }


        installments.push({
            installmentNumber: i,
            dueDate: dueDate,
            amount: parseFloat(finalPaymentAmount.toFixed(2)),
            status: 'POR VENCER', // Estado inicial
        });
    }

    return { installments, installmentAmount: parseFloat(paymentAmount.toFixed(2)) };
}


/**
 * Crea un nuevo préstamo, calcula su tabla de amortización y lo guarda en Firestore.
 */
export const createLoan = async (data: NewLoanFormData): Promise<string> => {
    const {
        userId, userName, userEmail, userCedula,
        loanAmount, interestRate, termValue, // termValue en lugar de termInMonths
        paymentFrequency, // Nueva propiedad
        disbursementDate: disbursementDateString,
    } = data;

    const loanCollectionRef = collection(db, 'loans');
    const newLoanRef = doc(loanCollectionRef); // Auto-genera un ID
    const newLoanId = newLoanRef.id;

    // Convertir strings de fecha a Date objects antes de guardar. Firestore los convertirá a Timestamps.
    const disbursementDate = new Date(disbursementDateString + 'T00:00:00'); // Evita problemas de zona horaria
    const applicationDate = new Date();

    const { installments, installmentAmount } = calculateAmortization(
        loanAmount, interestRate, termValue, paymentFrequency, disbursementDate // Pasa paymentFrequency y termValue
    );

    const statusHistory: StatusChange[] = [{
        status: LoanStatus.SOLICITADO,
        date: applicationDate, // Date object
        notes: 'Préstamo creado desde el portal de administración.',
        updatedBy: 'sistema',
    }, {
        status: LoanStatus.DESEMBOLSADO,
        date: disbursementDate, // Date object
        notes: 'Préstamo desembolsado automáticamente al ser creado.',
        updatedBy: 'sistema',
    }];

    const newLoan: Omit<Loan, 'id'> = {
        userId, userName, userEmail, userCedula, loanAmount,
        currency: 'USD',
        applicationDate, // Date object
        disbursementDate, // Date object
        status: LoanStatus.DESEMBOLSADO,
        statusHistory,
        installmentsTotal: installments.length, // Total de cuotas
        installmentAmount, // Monto de la cuota (si es fija, o la primera si es variable)
        installments, // Guardamos como un array, igual que el importador
        termValue, // Guardar el valor del plazo (ej. 12 meses, 24 quincenas)
        paymentFrequency, // Guardar la frecuencia de pago
        advisorId: data.advisorId,
        advisorName: data.advisorName,
    };

    await setDoc(newLoanRef, newLoan);
    return newLoanId;
};

// Helper para procesar datos del documento y convertir Timestamps a Date
// Se usa en todas las funciones que LEEN préstamos de Firestore.
const processLoanDocData = (docData: any, docId: string): Loan => {
    const loan: Loan = {
        id: docId,
        userId: docData.userId,
        userName: docData.userName,
        userEmail: docData.userEmail,
        userCedula: docData.userCedula,
        loanAmount: docData.loanAmount,
        interestRate: docData.interestRate,
        termValue: docData.termValue,
        paymentFrequency: docData.paymentFrequency,
        currency: docData.currency,
        // Convertir Timestamps a Date objects
        applicationDate: convertFirestoreTimestampToDate(docData.applicationDate),
        disbursementDate: convertFirestoreTimestampToDate(docData.disbursementDate),
        status: docData.status as LoanStatus,
        installmentsTotal: docData.installmentsTotal,
        installmentAmount: docData.installmentAmount,
        installments: docData.installments.map((inst: any) => ({
            ...inst,
            dueDate: convertFirestoreTimestampToDate(inst.dueDate),
            paymentReportDate: convertFirestoreTimestampToDate(inst.paymentReportDate),
            paymentDate: convertFirestoreTimestampToDate(inst.paymentDate), // Asegúrate de convertir también paymentDate
        })),
        statusHistory: (docData.statusHistory || []).map((entry: any) => ({
            ...entry,
            date: convertFirestoreTimestampToDate(entry.date) // Convertir la fecha del historial de estado
        })),
        // Incluir cualquier otra propiedad que tengas en tu tipo Loan
    };
    return loan;
};


/**
 * Obtiene todos los préstamos para un ID de usuario específico.
 */
export const getLoansForUser = async (userId: string): Promise<Loan[]> => {
    const loansRef = collection(db, 'loans');
    const q = query(loansRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    // Mapear y procesar cada documento para convertir Timestamps a Date
    return querySnapshot.docs.map(doc => processLoanDocData(doc.data(), doc.id));
};

/**
 * Obtiene los préstamos del usuario actualmente autenticado.
 */
export const getLoansForCurrentUser = async (): Promise<Loan[]> => {
    const user = auth.currentUser;
    if (!user) {
        console.log("No hay un usuario autenticado.");
        return [];
    }
    // Llama a getLoansForUser que ya procesa las fechas
    return getLoansForUser(user.uid);
};

/**
 * Obtiene un préstamo específico por su ID.
 */
export const getLoanById = async (loanId: string): Promise<Loan | null> => {
    const loanRef = doc(db, 'loans', loanId);
    const docSnap = await getDoc(loanRef);

    if (docSnap.exists()) {
        // Procesar el documento para convertir Timestamps a Date
        return processLoanDocData(docSnap.data(), docSnap.id);
    }
    return null;
};

/**
 * Obtiene todos los préstamos de la base de datos (solo para admins).
 */
export const getAllLoans = async (): Promise<Loan[]> => {
    const loansRef = collection(db, 'loans');
    const querySnapshot = await getDocs(loansRef);
    // Mapear y procesar cada documento para convertir Timestamps a Date
    return querySnapshot.docs.map(doc => processLoanDocData(doc.data(), doc.id));
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
    paymentData: { receiptUrl?: string; notes?: string; paymentReportNotes?: string; paymentDate?: Date } // aceptar paymentReportNotes y paymentDate
): Promise<void> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error(`No se encontró el préstamo con ID: ${loanId}`);
    }

    // Al obtener los datos con .data() directamente, las fechas siguen siendo Timestamps.
    // No es necesario convertirlas a Date aquí si solo se van a actualizar y guardar de nuevo.
    const loanDataFromFirestore = loanSnap.data();
    if (!loanDataFromFirestore) {
        throw new Error("Datos del préstamo vacíos.");
    }
    const loan = loanDataFromFirestore as Loan; // Castear para acceso a propiedades

    // Encontrar la cuota específica en el array
    const installmentIndex = loan.installments.findIndex(
        (inst) => inst.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }

    // Clonar el array de cuotas para no mutar el estado directamente
    const updatedInstallments = [...loan.installments];

    // Construir el objeto de la cuota actualizada, evitando valores `undefined`
    const updatedInstallmentData: any = {
        status: 'EN VERIFICACIÓN',
        paymentReportDate: new Date(),
        adminNotes: '',
    };

    if (paymentData.paymentDate) {
        updatedInstallmentData.paymentDate = paymentData.paymentDate;
    }

    // Preferir paymentReportNotes (usado por la UI) si viene, sino usar notes
    const note = paymentData.paymentReportNotes ?? paymentData.notes;
    if (note !== undefined) {
        updatedInstallmentData.paymentReportNotes = note;
    }

    if (paymentData.receiptUrl !== undefined) {
        updatedInstallmentData.receiptUrl = paymentData.receiptUrl;
    }

    // Actualizar la cuota
    updatedInstallments[installmentIndex] = {
        ...updatedInstallments[installmentIndex],
        ...updatedInstallmentData,
    };

    // Actualizar el documento del préstamo en Firestore
    await updateDoc(loanRef, {
        installments: updatedInstallments,
    });
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

    const loanDataFromFirestore = loanSnap.data();
    if (!loanDataFromFirestore) {
        throw new Error("Datos del préstamo vacíos.");
    }
    const loan = loanDataFromFirestore as Loan;

    const installmentIndex = loan.installments.findIndex(
        (inst) => inst.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }

    const updatedInstallments = [...loan.installments];
    const existingPaymentDate = loan.installments[installmentIndex].paymentDate;
    // Si ya existe una fecha de pago (ej. reportada manualmente), la usamos. Si es un Timestamp, la convertimos.
    const finalPaymentDate = convertFirestoreTimestampToDate(existingPaymentDate) || new Date();

    updatedInstallments[installmentIndex] = {
        ...updatedInstallments[installmentIndex],
        status: 'PAGADO',
        paymentDate: finalPaymentDate, // Usar la fecha preservada o la actual
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
            date: new Date(), // Guardar como Date, Firestore lo convertirá a Timestamp
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

    const loanDataFromFirestore = loanSnap.data();
    if (!loanDataFromFirestore) {
        throw new Error("Datos del préstamo vacíos.");
    }
    const loan = loanDataFromFirestore as Loan;

    const installmentIndex = loan.installments.findIndex(
        (inst) => inst.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }

    const originalInstallment = loan.installments[installmentIndex];
    // Para comparar fechas, convertimos el Timestamp de dueDate a Date.
    // Si originalInstallment.dueDate es undefined o null, la comparación fallará,
    // por lo que se añade un chequeo para asegurar que es un Date antes de comparar.
    const dueDateAsDate = convertFirestoreTimestampToDate(originalInstallment.dueDate);
    const isOverdue = dueDateAsDate ? dueDateAsDate < new Date() : false;


    const updatedInstallments = [...loan.installments];
    const { receiptUrl, paymentReportDate, paymentReportNotes, ...restOfInstallment } = originalInstallment;

    updatedInstallments[installmentIndex] = {
        ...restOfInstallment,
        status: isOverdue ? 'VENCIDO' : 'POR VENCER',
        adminNotes: `Rechazado por ${auth.currentUser?.email || 'admin'}: ${reason}`,
    };

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
    const allLoans = await getAllLoans(); // Esta función ya procesa los Timestamps a Date

    const pendingInstallments: any[] = [];

    // Iteramos sobre cada préstamo para encontrar cuotas pendientes.
    for (const loan of allLoans) {
        // Las fechas de loan.installments ya son Date objects gracias a getAllLoans
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
 * Agrega una nueva cuota a un préstamo, renumerando las cuotas existentes si es necesario.
 */
export const addInstallment = async (loanId: string, newInstallment: Installment): Promise<void> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error(`No se encontró el préstamo con ID: ${loanId}`);
    }

    const loanDataFromFirestore = loanSnap.data();
    if (!loanDataFromFirestore) {
        throw new Error('Datos del préstamo vacíos.');
    }

    const installments: any[] = Array.isArray(loanDataFromFirestore.installments) ? [...loanDataFromFirestore.installments] : [];

    // Si ya existe una cuota con el mismo número, desplazamos hacia adelante las cuotas iguales o mayores
    for (const inst of installments) {
        if (typeof inst.installmentNumber === 'number' && inst.installmentNumber >= newInstallment.installmentNumber) {
            inst.installmentNumber = inst.installmentNumber + 1;
        }
    }

    // Añadir la nueva cuota
    installments.push(newInstallment);

    // Ordenar por número de cuota
    installments.sort((a, b) => a.installmentNumber - b.installmentNumber);

    const updateData: any = {
        installments,
        installmentsTotal: installments.length,
    };

    // Añadimos una entrada al historial indicando la modificación
    const statusUpdate: StatusChange = {
        status: (loanDataFromFirestore.status as LoanStatus) || LoanStatus.DESEMBOLSADO,
        date: new Date(),
        notes: `Cuota ${newInstallment.installmentNumber} añadida (agregada manualmente).`,
        updatedBy: auth.currentUser?.email || 'sistema',
    };

    updateData.statusHistory = arrayUnion(statusUpdate);

    await updateDoc(loanRef, updateData);
};

/**
 * Actualiza una cuota existente en un préstamo.
 */
export const updateInstallment = async (
    loanId: string,
    installmentNumber: number,
    updates: Partial<Installment>
): Promise<void> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error(`No se encontró el préstamo con ID: ${loanId}`);
    }

    const loanDataFromFirestore = loanSnap.data();
    if (!loanDataFromFirestore) {
        throw new Error('Datos del préstamo vacíos.');
    }

    const installments: any[] = Array.isArray(loanDataFromFirestore.installments) ? [...loanDataFromFirestore.installments] : [];

    const idx = installments.findIndex((inst) => inst.installmentNumber === installmentNumber);
    if (idx === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }

    // Merge de la cuota existente con los cambios
    const updatedInstallment = {
        ...installments[idx],
        ...updates,
    };

    installments[idx] = updatedInstallment;

    // Si el número de cuota fue modificado, renumerar y ordenar
    if (typeof updates.installmentNumber === 'number') {
        // Evitar duplicados: reasignar y ordenar
        installments.sort((a, b) => a.installmentNumber - b.installmentNumber);
    }

    const updateData: any = {
        installments,
    };

    const statusUpdate: StatusChange = {
        status: (loanDataFromFirestore.status as LoanStatus) || LoanStatus.DESEMBOLSADO,
        date: new Date(),
        notes: `Cuota ${installmentNumber} actualizada.`,
        updatedBy: auth.currentUser?.email || 'sistema',
    };
    updateData.statusHistory = arrayUnion(statusUpdate);

    await updateDoc(loanRef, updateData);
};

/**
 * Elimina una cuota de un préstamo y renumera las cuotas siguientes.
 */
export const removeInstallment = async (loanId: string, installmentNumber: number): Promise<void> => {
    const loanRef = doc(db, 'loans', loanId);
    const loanSnap = await getDoc(loanRef);

    if (!loanSnap.exists()) {
        throw new Error(`No se encontró el préstamo con ID: ${loanId}`);
    }

    const loanDataFromFirestore = loanSnap.data();
    if (!loanDataFromFirestore) {
        throw new Error('Datos del préstamo vacíos.');
    }

    const installments: any[] = Array.isArray(loanDataFromFirestore.installments) ? [...loanDataFromFirestore.installments] : [];

    const idx = installments.findIndex((inst) => inst.installmentNumber === installmentNumber);
    if (idx === -1) {
        throw new Error(`No se encontró la cuota número ${installmentNumber} en el préstamo ${loanId}`);
    }

    // Remover la cuota
    installments.splice(idx, 1);

    // Renumerar las cuotas posteriores
    for (let i = 0; i < installments.length; i++) {
        installments[i].installmentNumber = i + 1;
    }

    const updateData: any = {
        installments,
        installmentsTotal: installments.length,
    };

    const statusUpdate: StatusChange = {
        status: (loanDataFromFirestore.status as LoanStatus) || LoanStatus.DESEMBOLSADO,
        date: new Date(),
        notes: `Cuota ${installmentNumber} eliminada.`,
        updatedBy: auth.currentUser?.email || 'sistema',
    };
    updateData.statusHistory = arrayUnion(statusUpdate);

    await updateDoc(loanRef, updateData);
};
