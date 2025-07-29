// netlify/functions/createUser.ts
import { Handler, HandlerEvent } from '@netlify/functions';
import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null; // Variable para almacenar la instancia de la app

// --- Helper para inicializar Firebase Admin de forma segura (solo una vez por instancia de función) ---
function initializeFirebaseAdmin() {
    if (firebaseApp) { // Si ya está inicializada, la reutilizamos.
        return firebaseApp;
    }

    // La variable de entorno se valida dentro del handler, aquí asumimos que existe.
    // PERO AHORA LA ENVOLVEMOS EN UN TRY-CATCH PARA CAPTURAR ERRORES DE PARSEO
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
        
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        return firebaseApp;
    } catch (error) {
        console.error("ERROR FATAL al inicializar Firebase Admin SDK:", error);
        // Relanzar el error para que el handler principal lo capture y devuelva un 500
        throw new Error("Error de configuración de credenciales de Firebase.");
    }
}

// --- Handler de la función ---
const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido. Usa POST.' }),
    };
  }

  // VALIDACIÓN CLAVE: Comprobamos la variable de entorno DENTRO del handler.
  // Esto nos permite devolver un error JSON válido si falta la configuración.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.");
    return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error de configuración del servidor. La clave de servicio de Firebase no está definida.' }),
    };
  }

  try {
    // Inicializamos Firebase de forma segura
    const app = initializeFirebaseAdmin(); // Esto ahora puede lanzar un error si el JSON es inválido
    const auth = app.auth();

    const { email, password, name } = JSON.parse(event.body || '{}');

    // Validar datos de entrada
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan campos obligatorios: email, password, name.' }),
      };
    }

    // Lógica para crear/obtener usuario en Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`[INFO] El usuario ${email} ya existe. Usando UID: ${userRecord.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
        });
        console.log(`[SUCCESS] Usuario ${email} creado con UID: ${userRecord.uid}`);
      } else {
        console.error('Error de Firebase Auth:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
      }
    }

    const uid = userRecord.uid;

    return {
      statusCode: 200,
      body: JSON.stringify({ uid: uid }),
    };

  } catch (error: any) {
    console.error('Error en la función createUser:', error);
    // Captura errores de JSON.parse si el body está malformado
    if (error instanceof SyntaxError) {
        return { statusCode: 400, body: JSON.stringify({ error: 'El cuerpo de la solicitud no es un JSON válido.' }) };
    }
    // Captura el error lanzado por initializeFirebaseAdmin si falla el parseo de la clave
    if (error.message.includes("Error de configuración de credenciales de Firebase.")) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Error de configuración del servidor. La clave de servicio de Firebase es inválida.' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: `Error interno del servidor: ${error.message}` }) };
  }
};

export { handler };