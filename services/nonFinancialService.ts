
// src/services/nonFinancialService.ts
import { 
    collection, 
    doc, 
    addDoc, 
    getDocs, 
    getDoc, 
    updateDoc, 
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
}

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
