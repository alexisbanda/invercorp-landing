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
        // Verificamos si ya hay apps inicializadas para evitar errores de duplicados si el entorno reutiliza el proceso.
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
        console.error("ERROR FATAL al inicializar Firebase Admin SDK:", error.message, error.stack);
        // Relanzar el error para que el handler principal lo capture y devuelva un 500
        throw new Error("Error de configuración de credenciales de Firebase: " + error.message);
    }
}

// --- Handler de la función ---
const handler: Handler = async (event: HandlerEvent) => {
  console.log('createUser function invoked');
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido. Usa POST.' }),
    };
  }

  // VALIDACIÓN CLAVE: Comprobamos la variable de entorno DENTRO del handler.
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("FATAL: La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.");
    return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error de configuración del servidor. Contacte al administrador.' }),
    };
  }

  let requestBody: any;
  try {
    let decodedBody = event.body || ''; // Ensure it's a string
    if (event.isBase64Encoded && event.body) {
        decodedBody = Buffer.from(event.body, 'base64').toString('utf8');
    }

    requestBody = JSON.parse(decodedBody);
    console.log("DEBUG: Parsed requestBody:", { ...requestBody, password: '[REDACTED]' }); 

  } catch (error: any) {
    console.error('Error al parsear el cuerpo de la solicitud:', error);
    return { statusCode: 400, body: JSON.stringify({ error: 'El cuerpo de la solicitud no es un JSON válido.' }) };
  }

  try {
    // Inicializamos Firebase de forma segura
    const app = initializeFirebaseAdmin();
    const auth = app!.auth(); // Aseguramos no null por la validación previa
    const db = app!.firestore();

    const { email, password, name, phone, cedula, numeroCartola, comment } = requestBody;

    // Validar datos mínimos de entrada
    if (!email || !password || !name || !cedula) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan campos obligatorios: email, password, name, cedula.' }),
      };
    }

    // 1. Crear usuario en Auth
    let userRecord;
    try {
      try {
          userRecord = await auth.getUserByEmail(email);
          console.log(`[INFO] El usuario ${email} ya existe en Auth. Usando UID: ${userRecord.uid}`);
      } catch (err: any) {
          if (err.code === 'auth/user-not-found') {
              userRecord = await auth.createUser({
                  email,
                  password,
                  displayName: name,
              });
              console.log(`[SUCCESS] Usuario ${email} creado en Auth con UID: ${userRecord.uid}`);
          } else {
              throw err;
          }
      }
    } catch (error: any) {
        console.error('Error de Firebase Auth:', error);
        return { statusCode: 500, body: JSON.stringify({ error: `Error creando usuario en Auth: ${error.message}` }) };
    }

    const uid = userRecord.uid;

    // 2. Crear perfil en Firestore
    // Usamos set con merge: true para no sobrescribir si ya existe (idempotencia)
    try {
        await db.collection('users').doc(uid).set({
            name,
            email,
            phone: phone || '',
            cedula,
            numeroCartola: numeroCartola || '',
            comment: comment || '',
            role: 'client', // Forzamos el rol
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`[SUCCESS] Perfil de usuario ${uid} creado/actualizado en Firestore.`);

    } catch (error: any) {
        console.error('Error de Firebase Firestore:', error);
        // Si falla Firestore y el usuario era nuevo, podríamos considerar borrar el usuario de Auth para mantener consistencia,
        // pero por seguridad y simplicidad en este MVP, retornamos error.
        return { statusCode: 500, body: JSON.stringify({ error: `Usuario creado en Auth, pero falló Firestore: ${error.message}` }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ uid: uid, message: 'Usuario y perfil creados correctamente.' }),
    };

  } catch (error: any) {
    console.error('Error en la función createUser (handler principal):', error);
    return { statusCode: 500, body: JSON.stringify({ error: `Error interno del servidor: ${error.message}` }) };
  }
};

export { handler };
