// services/savingsService.ts
import { db } from '../firebase-config';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    Timestamp,
    runTransaction,
    collectionGroup,
    writeBatch
} from 'firebase/firestore';
import {
    ProgrammedSaving,
    Deposit,
    ProgrammedSavingStatus,
    DepositStatus,
    WithdrawalStatus,
    Withdrawal
} from '../types';

// --- Ahorro Programado (ProgrammedSaving) ---

/**
 * Crea un nuevo plan de ahorro programado para un cliente.
 * @param userId - El ID del cliente (clienteId).
 * @param planData - Los datos del plan de ahorro a crear.
 * @returns El ID del nuevo plan de ahorro creado (numeroCartola).
 */
export const createProgrammedSaving = async (userId: string, planData: Omit<ProgrammedSaving, 'numeroCartola' | 'clienteId' | 'saldoActual' | 'estadoPlan' | 'fechaCreacion' | 'ultimaActualizacion'>): Promise<number> => {
    const userSavingsRef = collection(db, `users/${userId}/ahorrosProgramados`);

    // Usamos una transacción para garantizar que el numeroCartola sea único y consecutivo.
    const newPlanNumber = await runTransaction(db, async (transaction) => {
        const q = query(userSavingsRef);
        const snapshot = await getDocs(q);
        const newNumeroCartola = snapshot.size + 1;

        const newPlanRef = doc(userSavingsRef, String(newNumeroCartola));

        const newPlan: ProgrammedSaving = {
            ...planData,
            numeroCartola: newNumeroCartola,
            clienteId: userId,
            saldoActual: 0,
            estadoPlan: ProgrammedSavingStatus.ACTIVO,
            fechaCreacion: new Date(),
            ultimaActualizacion: new Date(),
        };

        transaction.set(newPlanRef, newPlan);
        return newNumeroCartola;
    });

    return newPlanNumber;
};

/**
 * Obtiene todos los planes de ahorro de un usuario específico.
 * @param userId - El ID del usuario.
 * @returns Un array con los planes de ahorro del usuario.
 */
export const getProgrammedSavingsForUser = async (userId: string): Promise<ProgrammedSaving[]> => {
    const savingsRef = collection(db, `users/${userId}/ahorrosProgramados`);
    const q = query(savingsRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ProgrammedSaving);
};

/**
 * Obtiene un plan de ahorro específico por su numeroCartola.
 * @param userId - El ID del usuario.
 * @param numeroCartola - El ID del plan de ahorro.
 * @returns El plan de ahorro o null si no se encuentra.
 */
export const getProgrammedSavingById = async (userId: string, numeroCartola: number): Promise<ProgrammedSaving | null> => {
    const planRef = doc(db, `users/${userId}/ahorrosProgramados`, String(numeroCartola));
    const docSnap = await getDoc(planRef);
    return docSnap.exists() ? docSnap.data() as ProgrammedSaving : null;
};

/**
 * Actualiza el estado de un plan de ahorro.
 * @param userId - El ID del usuario.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param newStatus - El nuevo estado del plan.
 */
export const updateProgrammedSavingStatus = async (userId: string, numeroCartola: number, newStatus: ProgrammedSavingStatus): Promise<void> => {
    const planRef = doc(db, `users/${userId}/ahorrosProgramados`, String(numeroCartola));
    await updateDoc(planRef, {
        estadoPlan: newStatus,
        ultimaActualizacion: new Date()
    });
};


// --- Depósitos (Deposits) ---

/**
 * Agrega un nuevo depósito a un plan de ahorro.
 * @param userId - El ID del usuario.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param depositData - Los datos del depósito.
 * @returns El ID del nuevo depósito creado.
 */
export const addDepositToSavingPlan = async (userId: string, numeroCartola: number, depositData: Omit<Deposit, 'depositId' | 'estadoDeposito'>): Promise<string> => {
    const depositsRef = collection(db, `users/${userId}/ahorrosProgramados/${numeroCartola}/depositos`);

    // Crea una referencia de documento con un ID autogenerado
    const newDepositRef = doc(depositsRef);

    // Construye el objeto completo del depósito, incluyendo el ID
    const newDeposit: Deposit = {
        ...depositData,
        depositId: newDepositRef.id, // Usamos el ID generado
        estadoDeposito: DepositStatus.EN_VERIFICACION,
        // estadoDeposito: 'En Verificación',
        fechaDeposito: new Date(),
    };

    // Escribe el documento en Firestore usando setDoc, lo que es una operación de creación única
    await setDoc(newDepositRef, newDeposit);

    return newDepositRef.id;
};

/**
 * Obtiene todos los depósitos de un plan de ahorro específico.
 * @param userId - El ID del usuario.
 * @param numeroCartola - El ID del plan de ahorro.
 * @returns Un array con los depósitos del plan.
 */
export const getDepositsForSavingPlan = async (userId: string, numeroCartola: number): Promise<Deposit[]> => {
    const depositsRef = collection(db, `users/${userId}/ahorrosProgramados/${numeroCartola}/depositos`);
    const q = query(depositsRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Deposit);
};

/**
 * Un administrador confirma un depósito.
 * @param userId - El ID del cliente.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param depositId - El ID del depósito a confirmar.
 * @param adminId - El ID del administrador que confirma.
 */
export const confirmDeposit = async (userId: string, numeroCartola: number, depositId: string, adminId: string): Promise<void> => {
    const planRef = doc(db, `users/${userId}/ahorrosProgramados`, String(numeroCartola));
    const depositRef = doc(planRef, 'depositos', depositId);

    await runTransaction(db, async (transaction) => {
        const planDoc = await transaction.get(planRef);
        const depositDoc = await transaction.get(depositRef);

        if (!planDoc.exists() || !depositDoc.exists()) {
            throw new Error("El plan de ahorro o el depósito no existen.");
        }

        const planData = planDoc.data() as ProgrammedSaving;
        const depositData = depositDoc.data() as Deposit;

        if (depositData.estadoDeposito === DepositStatus.CONFIRMADO) {
            // El depósito ya fue confirmado, no hacer nada.
            return;
        }

        const newSaldo = (planData.saldoActual || 0) + depositData.montoDeposito;

        // Actualizar el saldo del plan de ahorro
        transaction.update(planRef, {
            saldoActual: newSaldo,
            ultimaActualizacion: new Date()
        });

        // Actualizar el estado del depósito
        transaction.update(depositRef, {
            estadoDeposito: DepositStatus.CONFIRMADO,
            adminVerificadorId: adminId,
            fechaVerificacion: new Date()
        });
    });
};

/**
 * Un administrador rechaza un depósito.
 * @param userId - El ID del cliente.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param depositId - El ID del depósito a rechazar.
 * @param adminId - El ID del administrador que rechaza.
 * @param rejectionNote - La nota con el motivo del rechazo.
 */
export const rejectDeposit = async (userId: string, numeroCartola: number, depositId: string, adminId: string, rejectionNote: string): Promise<void> => {
    const depositRef = doc(db, `users/${userId}/ahorrosProgramados/${numeroCartola}/depositos`, depositId);
    await updateDoc(depositRef, {
        estadoDeposito: DepositStatus.RECHAZADO,
        adminVerificadorId: adminId,
        fechaVerificacion: new Date(),
        notaAdmin: rejectionNote
    });
};

/**
 * Obtiene todos los depósitos que están "En Verificación" para todos los usuarios.
 * @returns Un array de depósitos pendientes con información adicional del plan y usuario.
 */
export const getPendingDeposits = async (): Promise<any[]> => {
    const depositsRef = collectionGroup(db, 'depositos');
    const q = query(depositsRef, where('estadoDeposito', '==', DepositStatus.EN_VERIFICACION));
    const querySnapshot = await getDocs(q);

    const pendingDeposits = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const deposit = docSnap.data() as Deposit;
        const planRef = docSnap.ref.parent.parent; // Referencia al documento del plan
        if (!planRef) return null;

        const planSnap = await getDoc(planRef);
        if (!planSnap.exists()) return null;

        const plan = planSnap.data() as ProgrammedSaving;

        return {
            ...deposit,
            numeroCartola: plan.numeroCartola,
            clienteId: plan.clienteId,
            nombrePlan: plan.nombrePlan,
        };
    }));

    return pendingDeposits.filter(p => p !== null);
};

/**
 * Un administrador registra un depósito manual que se confirma inmediatamente.
 * @param userId - El ID del cliente.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param depositData - Datos del depósito manual (monto, nota del admin).
 * @param adminId - El ID del administrador que registra.
 */
export const addManualDepositByAdmin = async (
    userId: string,
    numeroCartola: number,
    depositData: { montoDeposito: number; notaAdmin?: string },
    adminId: string
): Promise<void> => {
    const planRef = doc(db, `users/${userId}/ahorrosProgramados`, String(numeroCartola));
    const depositsRef = collection(planRef, 'depositos');
    const newDepositRef = doc(depositsRef); // Genera un nuevo ID para el depósito

    await runTransaction(db, async (transaction) => {
        const planDoc = await transaction.get(planRef);
        if (!planDoc.exists()) {
            throw new Error("El plan de ahorro no existe.");
        }

        const planData = planDoc.data() as ProgrammedSaving;
        const newSaldo = (planData.saldoActual || 0) + depositData.montoDeposito;

        const newDeposit: Deposit = {
            depositId: newDepositRef.id,
            montoDeposito: depositData.montoDeposito,
            fechaDeposito: new Date(),
            estadoDeposito: DepositStatus.CONFIRMADO,
            adminVerificadorId: adminId,
            fechaVerificacion: new Date(),
            notaAdmin: depositData.notaAdmin || 'Depósito manual registrado por administrador.',
        };
        transaction.set(newDepositRef, newDeposit);

        transaction.update(planRef, {
            saldoActual: newSaldo,
            ultimaActualizacion: new Date()
        });
    });
};

/**
 * Obtiene todos los planes de ahorro de todos los usuarios (solo para admins).
 * @returns Un array con todos los planes de ahorro.
 */
export const getAllProgrammedSavings = async (): Promise<ProgrammedSaving[]> => {
    const savingsRef = collectionGroup(db, 'ahorrosProgramados');
    const querySnapshot = await getDocs(savingsRef);
    return querySnapshot.docs.map(doc => doc.data() as ProgrammedSaving);
};

/**
 * Elimina un registro de depósito de un plan de ahorro.
 * Si el depósito estaba confirmado, reajusta el saldo del plan.
 * @param userId - El ID del cliente.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param depositId - El ID del depósito a eliminar.
 */
export const deleteDeposit = async (userId: string, numeroCartola: number, depositId: string): Promise<void> => {
    const planRef = doc(db, `users/${userId}/ahorrosProgramados`, String(numeroCartola));
    const depositRef = doc(planRef, 'depositos', depositId);

    await runTransaction(db, async (transaction) => {
        const planDoc = await transaction.get(planRef);
        const depositDoc = await transaction.get(depositRef);

        if (!planDoc.exists()) {
            throw new Error("El plan de ahorro no existe.");
        }
        if (!depositDoc.exists()) {
            throw new Error("El depósito no existe o ya fue eliminado.");
        }

        const planData = planDoc.data() as ProgrammedSaving;
        const depositData = depositDoc.data() as Deposit;

        // Si el depósito estaba confirmado, hay que restar su monto del saldo actual.
        if (depositData.estadoDeposito === DepositStatus.CONFIRMADO) {
            const newSaldo = (planData.saldoActual || 0) - depositData.montoDeposito;
            transaction.update(planRef, {
                saldoActual: newSaldo,
                ultimaActualizacion: new Date()
            });
        }

        // Finalmente, eliminar el depósito.
        transaction.delete(depositRef);
    });
};

// --- Retiros (Withdrawals) ---

/**
 * Un administrador registra un retiro para un plan de ahorro.
 * @param userId - El ID del cliente.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param withdrawalData - Datos del retiro (monto, nota del admin).
 * @param adminId - El ID del administrador que registra.
 */
export const registerWithdrawalByAdmin = async (
    userId: string,
    numeroCartola: number,
    withdrawalData: { montoRetiro: number; notaAdmin?: string },
    adminId: string
): Promise<void> => {
    const planRef = doc(db, `users/${userId}/ahorrosProgramados`, String(numeroCartola));
    const withdrawalsRef = collection(planRef, 'retiros');
    const newWithdrawalRef = doc(withdrawalsRef); // Genera un nuevo ID para el retiro

    await runTransaction(db, async (transaction) => {
        const planDoc = await transaction.get(planRef);
        if (!planDoc.exists()) {
            throw new Error("El plan de ahorro no existe.");
        }

        const planData = planDoc.data() as ProgrammedSaving;
        const newSaldo = (planData.saldoActual || 0) - withdrawalData.montoRetiro;

        if (newSaldo < 0) {
            throw new Error("El monto del retiro no puede superar el saldo actual.");
        }

        const newWithdrawal: Withdrawal = {
            withdrawalId: newWithdrawalRef.id,
            montoRetiro: withdrawalData.montoRetiro,
            fechaSolicitud: new Date(),
            fechaProcesado: new Date(),
            estadoRetiro: WithdrawalStatus.PROCESADO,
            adminProcesadorId: adminId,
            notaAdmin: withdrawalData.notaAdmin || 'Retiro procesado por administrador.',
        };

        transaction.set(newWithdrawalRef, newWithdrawal);

        transaction.update(planRef, {
            saldoActual: newSaldo,
            ultimaActualizacion: new Date()
        });
    });
};

/**
 * Obtiene todos los retiros de un plan de ahorro específico.
 * @param userId - El ID del usuario.
 * @param numeroCartola - El ID del plan de ahorro.
 * @returns Un array con los retiros del plan.
 */
export const getWithdrawalsForSavingPlan = async (userId: string, numeroCartola: number): Promise<Withdrawal[]> => {
    const withdrawalsRef = collection(db, `users/${userId}/ahorrosProgramados/${numeroCartola}/retiros`);
    const q = query(withdrawalsRef);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Withdrawal);
};

/**
 * El cliente solicita un retiro (transferencia) de su plan de ahorro.
 * @param userId - El ID del cliente.
 * @param numeroCartola - El ID del plan de ahorro.
 * @param withdrawalData - Datos del retiro (monto, datos bancarios).
 * @returns El ID de la solicitud de retiro.
 */
export const requestWithdrawal = async (
    userId: string,
    numeroCartola: number,
    withdrawalData: {
        montoRetiro: number;
        bancoDestino: string;
        tipoCuenta: "Ahorros" | "Corriente";
        numeroCuenta: string;
        nombreTitular: string;
        cedulaTitular: string;
        notaCliente?: string;
    }
): Promise<string> => {
    const planRef = doc(db, `users/${userId}/ahorrosProgramados`, String(numeroCartola));
    const withdrawalsRef = collection(planRef, 'retiros');
    const newWithdrawalRef = doc(withdrawalsRef);

    await runTransaction(db, async (transaction) => {
        const planDoc = await transaction.get(planRef);
        if (!planDoc.exists()) {
            throw new Error("El plan de ahorro no existe.");
        }

        const planData = planDoc.data() as ProgrammedSaving;

        // Validar saldo suficiente (aunque no se descuente aún, es bueno validar)
        if ((planData.saldoActual || 0) < withdrawalData.montoRetiro) {
            throw new Error("Saldo insuficiente para realizar esta solicitud.");
        }

        const newWithdrawal: Withdrawal = {
            withdrawalId: newWithdrawalRef.id,
            fechaSolicitud: new Date(),
            estadoRetiro: WithdrawalStatus.SOLICITADO,
            ...withdrawalData
        };

        transaction.set(newWithdrawalRef, newWithdrawal);
    });

    return newWithdrawalRef.id;
};
