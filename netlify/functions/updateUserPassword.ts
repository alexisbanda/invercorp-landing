// netlify/functions/updateUserPassword.ts
import { Handler, HandlerEvent } from '@netlify/functions';
import * as admin from 'firebase-admin';

// --- Helper para inicializar Firebase Admin de forma segura ---
let firebaseApp: admin.app.App | null = null;

function initializeFirebaseAdmin() {
    if (firebaseApp) {
        return firebaseApp;
    }

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        console.error("FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.");
        throw new Error("Error de configuración del servidor: La clave de servicio de Firebase no está definida.");
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        if (admin.apps.length > 0) {
            firebaseApp = admin.apps[0];
        } else {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        }
        
        console.log("Firebase Admin inicializado con éxito.");
        return firebaseApp;
    } catch (error: any) {
        console.error("ERROR FATAL al inicializar Firebase Admin SDK:", error.message);
        throw new Error("Error de configuración de credenciales de Firebase: " + error.message);
    }
}

// --- Handler de la función ---
const handler: Handler = async (event: HandlerEvent) => {
    console.log('updateUserPassword function invoked');

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido. Usa POST.' }),
        };
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error de configuración del servidor.' }),
        };
    }

    let requestBody: any;
    try {
        let decodedBody = event.body || '';
        if (event.isBase64Encoded && event.body) {
            decodedBody = Buffer.from(event.body, 'base64').toString('utf8');
        }
        requestBody = JSON.parse(decodedBody);
    } catch (error: any) {
        return { statusCode: 400, body: JSON.stringify({ error: 'El cuerpo de la solicitud no es un JSON válido.' }) };
    }

    const { uid, newPassword } = requestBody;

    if (!uid || !newPassword) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Faltan campos obligatorios: uid, newPassword.' }),
        };
    }

    if (newPassword.length < 8) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres.' }),
        };
    }

    try {
        const app = initializeFirebaseAdmin();
        const auth = app!.auth();

        await auth.updateUser(uid, { password: newPassword });

        console.log(`[SUCCESS] Contraseña actualizada para el usuario ${uid}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Contraseña actualizada correctamente.' }),
        };
    } catch (error: any) {
        console.error('Error actualizando contraseña:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Error actualizando contraseña: ${error.message}` }),
        };
    }
};

export { handler };
