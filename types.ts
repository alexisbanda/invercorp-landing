// types.ts

// --- NUEVO: Definimos los roles y estados de usuario ---
export enum UserRole {
    CLIENT = 'client',
    ADMIN = 'admin',
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

export interface Installment {
    installmentNumber: number;
    dueDate: Date;
    amount: number;
    status: 'PAGADO' | 'POR VENCER' | 'VENCIDO' | 'EN VERIFICACIÓN' | 'EN ESPERA';
    paymentDate?: Date;
    receiptUrl?: string;
    adminNotes?: string;

    // --- NUEVOS CAMPOS PARA EL REPORTE DE PAGO ---
    paymentReportDate?: Date;   // Fecha en que el cliente reportó el pago
    paymentReportNotes?: string; // Comentario del cliente al reportar
}

// types.ts (ejemplo conceptual)

export enum LoanStatus {
    SOLICITADO = 'SOLICITADO',
    EN_REVISION = 'EN_REVISION',
    APROBADO = 'APROBADO',
    RECHAZADO = 'RECHAZADO',
    DESEMBOLSADO = 'DESEMBOLSADO',
    COMPLETADO = 'COMPLETADO',
}

export interface StatusChange {
    status: LoanStatus;
    date: Date;
    notes?: string;
    updatedBy: 'sistema' | string; // 'sistema' o UID de un admin
}

export interface Loan {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    loanAmount: number;
    currency: string;
    applicationDate: Date;
    disbursementDate?: Date; // Puede que no exista si aún no se desembolsa
    status: LoanStatus;
    statusHistory: StatusChange[];
    installments: Record<string, Installment>;
}

// --- NUEVO: AHORRO PROGRAMADO ---

export enum ProgrammedSavingStatus {
    ACTIVO = "Activo",
    PAUSADO = "Pausado",
    COMPLETADO = "Completado",
    CANCELADO = "Cancelado",
}

export enum DepositStatus {
    EN_VERIFICACION = "En Verificación",
    CONFIRMADO = "Confirmado",
    RECHAZADO = "Rechazado",
}

export interface Deposit {
    depositId: string;
    fechaDeposito: Date; // timestamp
    montoDeposito: number;
    comprobanteUrl?: string;
    notaCliente?: string;
    estadoDeposito: DepositStatus;
    fechaVerificacion?: Date; // timestamp
    adminVerificadorId?: string;
    notaAdmin?: string;
}

export interface ProgrammedSaving {
    numeroCartola: number; // ID
    clienteId: string;
    nombrePlan: string;
    montoMeta: number;
    frecuenciaDepositoSugerida: "Semanal" | "Mensual" | "Quincenal";
    montoDepositoSugerido: number;
    fechaInicioPlan: Date; // timestamp
    fechaFinEstimada: Date; // timestamp
    saldoActual: number;
    estadoPlan: ProgrammedSavingStatus;
    fechaCreacion: Date; // timestamp
    ultimaActualizacion: Date; // timestamp
    adminCreadorId: string;
    depositos?: Deposit[]; // This could be a subcollection
}
