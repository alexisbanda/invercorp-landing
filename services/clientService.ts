// src/services/clientService.ts
import { db } from '../firebase-config';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';

// Define la interfaz para los datos del nuevo cliente
export interface NewClientData {
    name: string;
    email: string;
    password: string; // Se necesita la contraseña para crear el usuario en Auth
    phone: string;
    cedula: string;
    comment: string;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    cedula: string;
    comment: string;
    role: string;
    createdAt: any;
}

/**
 * Orquesta la creación de un nuevo cliente.
 * 1. Llama a una función serverless para crear el usuario en Firebase Authentication de forma segura.
 * 2. Usa el UID devuelto para crear el perfil del cliente en Firestore.
 * 
 * @param clientData Los datos completos del nuevo cliente.
 * @returns El UID del usuario recién creado.
 */
export const createClientProfile = async (clientData: NewClientData): Promise<string> => {
    // Desestructuramos para mayor claridad y validación temprana
    const { email, password, name, phone, cedula, comment } = clientData;

    // Aunque el backend valida, una validación temprana aquí puede dar errores más rápidos en desarrollo.
    if (!email || !password || !name) {
        throw new Error('Error del cliente: Faltan email, password o nombre. Revisa el objeto enviado desde el formulario.');
    }

    // --- PASO 1: Crear el usuario de autenticación en el backend ---
    // El endpoint de la Netlify Function que creamos.
    // En desarrollo, Netlify CLI lo sirve en /.netlify/functions/createUser
    const endpoint = '/.netlify/functions/createUser';

    const authResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // Solo enviamos los datos necesarios para la autenticación
        body: JSON.stringify({
            email,
            password,
            name
        }),
    });

    const authResult = await authResponse.json();

    if (!authResponse.ok) {
        throw new Error(authResult.error || 'Ocurrió un error al crear el usuario de autenticación.');
    }

    const uid = authResult.uid;

    // --- PASO 2: Crear el perfil del cliente en Firestore con el UID obtenido ---
    const userDocRef = doc(db, 'users', uid);
    
    await setDoc(userDocRef, {
        name,
        email,
        phone,
        cedula,
        comment,
        role: 'client',
        createdAt: serverTimestamp()
    });

    return uid;
};

export const getAllClients = async (): Promise<Client[]> => {
    const q = query(collection(db, "users"), where("role", "==", "client"));
    const querySnapshot = await getDocs(q);
    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() } as Client);
    });
    return clients;
};