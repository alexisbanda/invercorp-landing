import { Handler, HandlerEvent } from '@netlify/functions';
import * as admin from 'firebase-admin';

// --- Helper para inicializar Firebase Admin de forma segura (solo una vez por instancia de función) ---
function initializeFirebaseAdmin() {
    // Si la app ya está inicializada, la reutilizamos.
    if (admin.apps.length > 0) {
        return admin.app();
    }

    // La variable de entorno se valida dentro del handler, aquí asumimos que existe.
    const serviceAccount = JSON.parse(import.meta.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
    
    // Inicializamos la app y la retornamos.
    return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
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
  if (!import.meta.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.");
    return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error de configuración del servidor. Contacte al administrador.' }),
    };
  }

  try {
    // Inicializamos Firebase de forma segura
    const app = initializeFirebaseAdmin();
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
    return { statusCode: 500, body: JSON.stringify({ error: `Error interno del servidor: ${error.message}` }) };
  }
};

export { handler };