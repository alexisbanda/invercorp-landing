// src/services/clientService.ts
import { db } from '../firebase-config';
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';


// Define la interfaz para los datos del nuevo cliente
export interface NewClientData {
    name: string;
    email: string;
    password: string; // Se necesita la contraseña para crear el usuario en Auth
    phone: string;
    cedula: string;
    numeroCartola: string;
    comment: string;
    advisorCollectionId?: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    cedula: string;
    numeroCartola: string;
    comment: string;
    role: string;
    advisorCollectionId?: string;
    createdAt: any;
}

/**
 * Orquesta la creación de un nuevo cliente.
 * 1. Llama a una función serverless para crear el usuario en Firebase Authentication y el perfil en Firestore de forma atómica.
 * 
 * @param clientData Los datos completos del nuevo cliente.
 * @returns El UID del usuario recién creado.
 */
export const createClientProfile = async (clientData: NewClientData): Promise<string> => {
    // Desestructuramos para mayor claridad y validación temprana
    const { email, password, name, phone, cedula, numeroCartola, comment, advisorCollectionId } = clientData;

    // Aunque el backend valida, una validación temprana aquí puede dar errores más rápidos en desarrollo.
    if (!email || !password || !name) {
        throw new Error('Error del cliente: Faltan email, password o nombre. Revisa el objeto enviado desde el formulario.');
    }

    // --- PASO 1: Crear el usuario y perfil en el backend ---
    // El endpoint de la Netlify Function que creamos.
    const endpoint = '/.netlify/functions/createUser';

    const authResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // Enviamos TODOS los datos al backend
        body: JSON.stringify({
            email,
            password,
            name,
            phone,
            cedula,
            numeroCartola,
            comment,
            advisorCollectionId
        }),
    });

    const result = await authResponse.json();

    if (!authResponse.ok) {
        throw new Error(result.error || 'Ocurrió un error al crear el usuario.');
    }

    const uid = result.uid;

    // --- PASO 2: Ya NO creamos el perfil en el cliente, el backend lo hizo ---
    
    return uid;
};

export const getAllClients = async (advisorId?: string): Promise<Client[]> => {
    let q;
    if (advisorId) {
        q = query(collection(db, "users"), where("role", "==", "client"), where("advisorCollectionId", "==", advisorId));
    } else {
        q = query(collection(db, "users"), where("role", "==", "client"));
    }
    
    const querySnapshot = await getDocs(q);
    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() } as Client);
    });
    return clients;
};

export const updateClient = async (clientId: string, data: Partial<Client>): Promise<void> => {
    const clientDocRef = doc(db, 'users', clientId);
    await updateDoc(clientDocRef, data);
};

/**
 * Elimina un cliente de Firestore.
 * IMPORTANTE: Esta función solo elimina el documento del cliente en Firestore.
 * No elimina el usuario de Firebase Authentication por razones de seguridad.
 * 
 * @param clientId El ID del cliente a eliminar
 */
export const deleteClient = async (clientId: string): Promise<void> => {
    const clientDocRef = doc(db, 'users', clientId);
    await deleteDoc(clientDocRef);
};