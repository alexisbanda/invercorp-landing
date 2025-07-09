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