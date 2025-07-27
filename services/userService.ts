// services/userService.ts
import { doc, getDoc } from 'firebase/firestore';
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
        role: data.role || UserRole.CLIENT,
    } as UserProfile;
};