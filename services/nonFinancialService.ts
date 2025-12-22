
import { // src/services/nonFinancialService.ts
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
    deleteDoc,
    arrayUnion, 
    Timestamp,
    query,
    where
} from 'firebase/firestore';
import { db, auth } from '../firebase-config';
import { ServiceType, serviceFlows } from './serviceDefinitions';

// Define la estructura del historial de estados
export interface StatusHistoryEntry {
    status: string;
    date: Timestamp;
    notes?: string;
    updatedBy: string;
}

// Define la estructura principal de un documento de servicio no financiero
export interface NonFinancialService {
    id: string;
    clienteId: string;
    userName: string; // Para facilitar la visualización
    tipoDeServicio: ServiceType;
    estadoGeneral: 'SOLICITADO' | 'EN_EJECUCION' | 'FINALIZADO' | 'CANCELADO';
    estadoActual: string; // El sub-estado actual dentro del flujo
    descripcionCliente: string;
    flujoCompleto: string[]; // El array de todos los pasos para este servicio
    historialDeEstados: StatusHistoryEntry[];
    fechaSolicitud: Timestamp;
    fechaUltimaActualizacion: Timestamp;
    advisorId?: string;
    advisorName?: string;
    recibos?: ServiceReceipt[];
}

export interface ServiceReceipt {
    id: string;
    number: string;
    amount: number;
    concept: string;
    date: Timestamp;
    issuedBy: string;
    status: 'valid' | 'void';
    voidReason?: string;
    voidedBy?: string;
    voidDate?: Timestamp;
}

/**
 * Agrega un nuevo recibo al servicio.
 */
export const addReceipt = async (serviceId: string, amount: number, concept: string): Promise<ServiceReceipt> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');

    const serviceRef = doc(db, 'servicios', serviceId);
    const serviceDoc = await getDoc(serviceRef);
    
    if (!serviceDoc.exists()) throw new Error('Servicio no encontrado');
    
    const serviceData = serviceDoc.data() as NonFinancialService;
    const currentReceipts = serviceData.recibos || [];
    
    // Generar secuencial: ID-001, ID-002...
    const sequence = currentReceipts.length + 1;
    const sequenceStr = sequence.toString().padStart(3, '0');
    // Usamos el ID del servicio (primeros 6 chars) + secuencial
    const shortId = serviceId.substring(0, 6).toUpperCase();
    const receiptNumber = `${shortId}-${sequenceStr}`;

    const newReceipt: ServiceReceipt = {
        id: crypto.randomUUID(), // ID único interno del recibo
        number: receiptNumber,   // ID legible para el humano
        amount,
        concept,
        date: Timestamp.now(),
        issuedBy: currentUser.email || 'unknown',
        status: 'valid'
    };

    await updateDoc(serviceRef, {
        recibos: arrayUnion(newReceipt)
    });

    return newReceipt;
};

/**
 * Anula un recibo existente.
 */
export const voidReceipt = async (serviceId: string, receiptId: string, reason: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');

    const serviceRef = doc(db, 'servicios', serviceId);
    const serviceDoc = await getDoc(serviceRef);

    if (!serviceDoc.exists()) throw new Error('Servicio no encontrado');

    const serviceData = serviceDoc.data() as NonFinancialService;
    const currentReceipts = serviceData.recibos || [];

    // Validar que el recibo existe
    const receiptIndex = currentReceipts.findIndex(r => r.id === receiptId);
    if (receiptIndex === -1) throw new Error('Recibo no encontrado');

    const targetReceipt = currentReceipts[receiptIndex];
    
    if (targetReceipt.status === 'void') throw new Error('El recibo ya está anulado');

    // Firestore no permite actualizar un elemento específico de un array fácilmente sin sobrescribir todo el array
    // O usar arrayRemove + arrayUnion, pero eso cambia el orden o requiere el objeto exacto original.
    // La estrategia más segura aquí es leer, modificar en memoria, y guardar el array completo.
    
    const updatedReceipts = [...currentReceipts];
    updatedReceipts[receiptIndex] = {
        ...targetReceipt,
        status: 'void',
        voidReason: reason,
        voidedBy: currentUser.email || 'unknown',
        voidDate: Timestamp.now()
    };

    await updateDoc(serviceRef, {
        recibos: updatedReceipts
    });
};

// Datos necesarios para crear un nuevo servicio
export interface NewServiceData {
    clienteId: string;
    userName: string;
    tipoDeServicio: ServiceType;
    descripcionCliente: string;
    advisorId?: string;
    advisorName?: string;
}

/**
 * Crea una nueva solicitud de servicio no financiero en Firestore.
 * @param data Los datos para la nueva solicitud de servicio.
 * @returns El ID del nuevo documento creado.
 */
export const createService = async (data: NewServiceData): Promise<string> => {
    const { clienteId, userName, tipoDeServicio, descripcionCliente, advisorId, advisorName } = data;
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error('No hay un administrador autenticado para realizar esta acción.');
    }

    const flow = serviceFlows[tipoDeServicio]?.flujo_ejecucion;
    if (!flow || flow.length === 0) {
        throw new Error(`No se encontró un flujo de ejecución para el servicio: ${tipoDeServicio}`);
    }

    const now = Timestamp.now();
    const initialStatus = 'Solicitado';

    const newServiceDoc: Omit<NonFinancialService, 'id'> = {
        clienteId,
        userName,
        tipoDeServicio,
        estadoGeneral: 'SOLICITADO',
        estadoActual: initialStatus,
        descripcionCliente,
        flujoCompleto: flow,
        fechaSolicitud: now,
        fechaUltimaActualizacion: now,
        advisorId,
        advisorName,
        historialDeEstados: [
            {
                status: initialStatus,
                date: now,
                updatedBy: currentUser.email || 'admin',
                notes: 'Creación de la solicitud de servicio.',
            },
        ],
    };

    const docRef = await addDoc(collection(db, 'servicios'), newServiceDoc);
    return docRef.id;
};

/**
 * Elimina un servicio no financiero de la base de datos.
 * @param serviceId El ID del servicio a eliminar.
 */
export const deleteService = async (serviceId: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Usuario no autenticado');

    const serviceDocRef = doc(db, 'servicios', serviceId);
    await deleteDoc(serviceDocRef);
};

/**
 * Obtiene todos los servicios no financieros de la base de datos.
 * @returns Un array de objetos NonFinancialService.
 */
export const getAllServices = async (): Promise<NonFinancialService[]> => {
    const servicesCollection = collection(db, 'servicios');
    const snapshot = await getDocs(servicesCollection);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as NonFinancialService));
};

/**
 * Obtiene un servicio no financiero específico por su ID.
 * @param serviceId El ID del documento del servicio.
 * @returns El objeto NonFinancialService o null si no se encuentra.
 */
export const getServiceById = async (serviceId: string): Promise<NonFinancialService | null> => {
    const serviceDocRef = doc(db, 'servicios', serviceId);
    const docSnap = await getDoc(serviceDocRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as NonFinancialService;
    } else {
        return null;
    }
};

/**
 * Actualiza el estado de un servicio y añade una entrada al historial.
 * @param serviceId El ID del servicio a actualizar.
 * @param newStatus El nuevo estado (sub-estado) a establecer.
 * @param notes Notas opcionales sobre el cambio de estado.
 */
export const updateServiceStatus = async (serviceId: string, newStatus: string, notes?: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('No hay un administrador autenticado.');
    }

    const serviceDocRef = doc(db, 'servicios', serviceId);
    const service = await getServiceById(serviceId);

    if (!service) {
        throw new Error('El servicio no fue encontrado.');
    }

    const now = Timestamp.now();
    const historyEntry: StatusHistoryEntry = {
        status: newStatus,
        date: now,
        updatedBy: currentUser.email || 'admin',
        notes: notes || `Estado actualizado a: ${newStatus}`,
    };

    // Determinar el estado general
    const isLastStep = service.flujoCompleto.indexOf(newStatus) === service.flujoCompleto.length - 1;
    const newGeneralStatus = isLastStep ? 'FINALIZADO' : 'EN_EJECUCION';

    await updateDoc(serviceDocRef, {
        estadoActual: newStatus,
        estadoGeneral: newGeneralStatus,
        fechaUltimaActualizacion: now,
        historialDeEstados: arrayUnion(historyEntry),
    });
};

/**
 * Obtiene todos los servicios de un cliente específico.
 * @param clientId El UID del cliente.
 * @returns Un array de objetos NonFinancialService.
 */
export const getServicesByClientId = async (clientId: string): Promise<NonFinancialService[]> => {
    const servicesCollection = collection(db, 'servicios');
    const q = query(servicesCollection, where("clienteId", "==", clientId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as NonFinancialService));
};
