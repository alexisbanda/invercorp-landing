import { db } from '../firebase-config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Advisor, UserRole } from '../types';
import { createSecondaryUser } from './adminAuthService';

const advisorsCollection = collection(db, 'advisors');

export const getAllAdvisors = async (): Promise<Advisor[]> => {
    const snapshot = await getDocs(advisorsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Advisor));
};

/**
 * Crea un asesor en la base de datos y genera su usuario de autenticación.
 * 
 * @param data Datos del asesor
 * @returns Objeto con el ID del asesor creado y la contraseña temporal generada.
 */
export const createAdvisor = async (data: Omit<Advisor, 'id'>): Promise<{ id: string, tempPassword?: string }> => {
    // 1. Generar contraseña temporal
    const tempPassword = `Inver${new Date().getFullYear()}!${Math.floor(Math.random() * 1000)}`;

    let uid: string;
    try {
        // 2. Crear usuario en Auth (Secondary App)
        uid = await createSecondaryUser(data.correo, tempPassword);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.warn("El usuario ya existe en Auth, procederemos a vincularlo.");
            // En un caso real, deberíamos buscar el UID, pero por seguridad el client SDK no permite buscar por email fácilmente sin ser admin.
            // Asumiremos que fallamos o manejamos lógica alternativa. 
            // Para simplificar: Lanzamos error para que el admin sepa.
            throw new Error(`El correo ${data.correo} ya está registrado en el sistema.`);
        }
        throw error;
    }

    // 3. Guardar en colección 'advisors' (Info pública/administrativa)
    const advisorDataWithUid = {
        ...data,
        uid: uid, // Vinculamos
        createdAt: serverTimestamp()
    };
    const docRef = await addDoc(advisorsCollection, advisorDataWithUid);

    // 4. Guardar en colección 'users' (Para login y roles)
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
        name: data.nombre,
        email: data.correo,
        role: UserRole.ADVISOR,
        phone: data.telefono,
        advisorCollectionId: docRef.id, // Referencia cruzada
        createdAt: serverTimestamp()
    });

    return { id: docRef.id, tempPassword };
};

export const updateAdvisor = async (id: string, data: Partial<Advisor>): Promise<void> => {
    const advisorDoc = doc(db, 'advisors', id);
    await updateDoc(advisorDoc, data);
};

export const deleteAdvisor = async (id: string): Promise<void> => {
    const advisorDoc = doc(db, 'advisors', id);
    await deleteDoc(advisorDoc);
};
