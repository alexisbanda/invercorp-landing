import { initializeApp, getApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, Auth } from 'firebase/auth';
import { firebaseConfig } from '../firebase-config';

/**
 * Crea un usuario en Firebase Auth utilizando una instancia secundaria de la aplicación via Client SDK.
 * Esto evita que al crear el usuario, la sesión del administrador actual sea reemplazada por la del nuevo usuario.
 * 
 * @param email Correo electrónico del nuevo usuario
 * @param password Contraseña temporal
 * @returns El UID del usuario creado
 */
export const createSecondaryUser = async (email: string, password: string): Promise<string> => {
    let secondaryApp: FirebaseApp;
    let secondaryAuth: Auth;
    
    // Usamos un nombre único para la app secundaria para evitar conflictos
    const appName = 'secondary-auth-worker';

    try {
        // Verificar si ya existe para reutilizarla o crearla
        const existingApp = getApps().find(app => app.name === appName);
        if (existingApp) {
            secondaryApp = existingApp;
        } else {
            secondaryApp = initializeApp(firebaseConfig, appName);
        }

        secondaryAuth = getAuth(secondaryApp);

        // Crear el usuario en esta instancia aislada
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const uid = userCredential.user.uid;

        // Inmediatamente hacemos sign out de esta instancia secundaria para asegurarnos de que no quede ninguna sesión "colgada"
        // aunque las instancias secundarias no suelen compartir almacenamiento de sesión con la principal, es buena práctica.
        await signOut(secondaryAuth);

        return uid;

    } catch (error) {
        console.error("Error creando usuario en instancia secundaria:", error);
        throw error;
    } finally {
        // Opcional: Si queremos limpiar memoria, podemos borrar la app. 
        // Pero si se usa frecuentemente, dejarla viva es más eficiente.
        // await deleteApp(secondaryApp!); 
    }
};
