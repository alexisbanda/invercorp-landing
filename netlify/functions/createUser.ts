// netlify/functions/createUser.ts
import { Handler, HandlerEvent } from '@netlify/functions';
import * as admin from 'firebase-admin';

// --- Helper para inicializar Firebase Admin de forma segura (solo una vez por instancia de función) ---
let firebaseApp: admin.app.App | null = null; // Variable para almacenar la instancia de la app

function initializeFirebaseAdmin() {
    // Si la app ya está inicializada, la reutilizamos.
    if (firebaseApp) {
        return firebaseApp;
    }

    // La variable de entorno se valida dentro del handler, aquí asumimos que existe.
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY; // Usamos el nombre original de la variable

    if (!serviceAccountKey) {
        console.error("FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.");
        throw new Error("Error de configuración del servidor: La clave de servicio de Firebase no está definida.");
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        // Inicializamos la app y la retornamos.
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin inicializado con éxito.");
        return firebaseApp;
    } catch (error: any) {
        console.error("ERROR FATAL al inicializar Firebase Admin SDK:", error.message, error.stack);
        // Relanzar el error para que el handler principal lo capture y devuelva un 500
        throw new Error("Error de configuración de credenciales de Firebase: " + error.message);
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
        body: JSON.stringify({ error: 'Error de configuración del servidor. Contacte al administrador.' }),
    };
  }

  let requestBody: any;
  try {
    // --- NUEVA LÓGICA DE DEPURACIÓN Y DECODIFICACIÓN ---
    console.log("DEBUG: event.isBase64Encoded:", event.isBase64Encoded);
    console.log("DEBUG: Raw event.body (first 50 chars):", event.body?.substring(0, 50) + "...");

    let decodedBody = event.body;
    if (event.isBase64Encoded && event.body) {
        decodedBody = Buffer.from(event.body, 'base64').toString('utf8');
        console.log("DEBUG: Decoded event.body (first 50 chars):", decodedBody.substring(0, 50) + "...");
    } else if (!event.body) {
        // Si el body es null o undefined, tratamos como un string vacío para JSON.parse
        decodedBody = ''; 
    }

    requestBody = JSON.parse(decodedBody);
    console.log("DEBUG: Parsed requestBody:", requestBody); // Imprime el objeto JSON parseado

  } catch (error: any) {
    console.error('Error al parsear el cuerpo de la solicitud:', error);
    if (error instanceof SyntaxError) {
        return { statusCode: 400, body: JSON.stringify({ error: 'El cuerpo de la solicitud no es un JSON válido.' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: `Error interno del servidor al procesar la solicitud: ${error.message}` }) };
  }

  try {
    // Inicializamos Firebase de forma segura
    const app = initializeFirebaseAdmin();
    const auth = app.auth();

    const { email, password, name } = requestBody; // Usamos el requestBody ya parseado

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
    console.error('Error en la función createUser (handler principal):', error);
    // Este catch ahora solo debería atrapar errores de la lógica de Firebase Auth
    return { statusCode: 500, body: JSON.stringify({ error: `Error interno del servidor: ${error.message}` }) };
  }
};

export { handler };
