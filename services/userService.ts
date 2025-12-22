import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

import { db } from '../firebase-config';
import { UserProfile, UserRole } from '../types';

/**
 * Obtiene el perfil de un usuario desde la colección 'users' en Firestore.
 * @param uid El ID de autenticación del usuario.
 * @returns El perfil del usuario o null si no se encuentra.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
        console.warn(`No se encontró un perfil para el usuario con UID: ${uid}`);
        return null;
    }

    const data = userSnap.data();
    return {
        id: userSnap.id,
        email: data.email,
        name: data.name,
        cedula: data.cedula,
        // Aseguramos que el rol por defecto sea 'client' si no está definido
        role: (data.role ? data.role.toLowerCase().trim() : UserRole.CLIENT) as UserRole,
    } as UserProfile;
};

/**
 * Obtiene todos los perfiles de usuario con el rol de 'client'.
 * @returns Una lista de todos los perfiles de cliente, ordenados alfabéticamente.
 */
export const getAllClients = async (): Promise<UserProfile[]> => {
    const usersCollectionRef = collection(db, 'users');
    // Filtrar solo por rol 'client' para el selector
    const q = query(usersCollectionRef, where('role', '==', 'client'));
    const querySnapshot = await getDocs(q);

    const clients = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            email: data.email,
            name: data.name,
            cedula: data.cedula,
            role: data.role,
        } as UserProfile;
    });
    return clients.sort((a, b) => a.name.localeCompare(b.name)); // Ordenar para mejor UX
};

/**
 * Crea un nuevo cliente en la colección 'users'.
 * @param clientData Datos básicos del cliente.
 * @returns El perfil del nuevo cliente creado.
 */
export const createClient = async (clientData: { name: string; cedula: string; email: string; phone?: string }): Promise<UserProfile> => {
    const usersCollectionRef = collection(db, 'users');
    // Asignamos el rol de cliente por defecto
    const newClientData = {
        ...clientData,
        role: UserRole.CLIENT,
        createdAt: serverTimestamp()
    };

    const docRef = await addDoc(usersCollectionRef, newClientData);

    return {
        id: docRef.id,
        ...newClientData
    } as UserProfile;
};