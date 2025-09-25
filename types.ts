// types.ts

// --- NUEVO: Definimos los roles y estados de usuario ---
export enum UserRole {
    CLIENT = 'client',
    ADMIN = 'admin',
}

export interface UserProfile {
    id: string;
    email: string;
    name:string;
    role: UserRole;
    cedula: string;
    numeroCartola?: string;
    phone?: string;
}

export interface Installment {
    installmentNumber: number;
    dueDate: Date | undefined | null;
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
    date: Date | undefined | null;
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
    applicationDate: Date | undefined | null;
    disbursementDate?: Date | undefined | null; // Puede que no exista si aún no se desembolsa
    status: LoanStatus;
    statusHistory: StatusChange[];
    // CORRECCIÓN: Se usa un array para ser consistente con el importador y la creación de préstamos.
    installments: Installment[];
    userCedula: string;
    installmentsTotal: number;
    installmentAmount: number;
    // Campos opcionales usados por createLoan y el servicio
    termValue?: number;
    paymentFrequency?: 'Mensual' | 'Quincenal' | 'Semanal';
    interestRate?: number;
    advisorId?: string;
    advisorName?: string;
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

export enum WithdrawalStatus {
    SOLICITADO = "Solicitado",
    PROCESADO = "Procesado",
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

export interface Withdrawal {
    withdrawalId: string;
    fechaSolicitud: Date;
    fechaProcesado?: Date;
    montoRetiro: number;
    estadoRetiro: WithdrawalStatus;
    notaCliente?: string;
    notaAdmin?: string;
    adminProcesadorId?: string;
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
    retiros?: Withdrawal[]; // This could be a subcollection
    advisorId?: string;
    advisorName?: string;
}

export interface Advisor {
    id: string;
    nombre: string;
    telefono: string;
    correo: string;
}
