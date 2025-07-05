// netlify/functions/dailyChecks.js
/*
import admin from 'firebase-admin';
import fetch from 'node-fetch';

// --- Configuración ---
const REMINDER_DAYS_BEFORE_DUE = 3; // Enviar recordatorio X días antes
const SENDER_EMAIL = 'Invercop <notificaciones@invercop.com>'; // Email que verá el cliente

// --- Inicializar Firebase Admin SDK ---
// Solo se inicializa si no lo ha hecho antes.
/*
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        });
    } catch (error) {
        console.error('Error al inicializar Firebase Admin SDK:', error);
    }
}

const db = admin.firestore();

// --- Función para enviar emails (usando Resend como ejemplo) ---
async function sendReminderEmail(to, userName, amount, dueDate) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
        console.error('La variable de entorno RESEND_API_KEY no está configurada.');
        return;
    }

    const subject = 'Recordatorio de Pago - INVERCOP';
    const formattedDueDate = new Date(dueDate).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
    const formattedAmount = amount.toFixed(2);

    const body = `
    <p>¡Hola, ${userName}!</p>
    <p>Este es un recordatorio amigable de que tu próxima cuota de <strong>$${formattedAmount}</strong> está por vencer el día <strong>${formattedDueDate}</strong>.</p>
    <p>Puedes realizar tu pago y subir el comprobante en nuestro portal.</p>
    <p>Gracias por ser parte de la familia INVERCOP.</p>
    <p>Atentamente,<br>El equipo de INVERCOOP Semillas de Fe</p>
  `;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: SENDER_EMAIL,
                to: [to],
                subject: subject,
                html: body,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error al enviar email a ${to}:`, errorData);
        } else {
            console.log(`Recordatorio enviado a ${to}`);
        }
    } catch (error) {
        console.error('Error en la función de envío de email:', error);
    }
}


// --- Handler principal de la función de Netlify ---
export const handler = async function(event, context) {
    console.log("Iniciando la revisión diaria de cuotas...");

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a la medianoche para comparaciones de fecha

    const installmentsRef = db.collection('installments');
    let updates = 0;
    let remindersSent = 0;

    try {
        // 1. ACTUALIZAR CUOTAS VENCIDAS
        const overdueQuery = installmentsRef.where('status', '==', 'PENDIENTE').where('dueDate', '<', today);
        const overdueSnapshot = await overdueQuery.get();

        if (!overdueSnapshot.empty) {
            const batch = db.batch();
            overdueSnapshot.docs.forEach(doc => {
                console.log(`Marcando como VENCIDA la cuota ${doc.id}`);
                batch.update(doc.ref, { status: 'VENCIDO' });
                updates++;
            });
            await batch.commit();
        }

        // 2. ENVIAR RECORDATORIOS DE PAGO
        const reminderDate = new Date(today);
        reminderDate.setDate(today.getDate() + REMINDER_DAYS_BEFORE_DUE);

        const reminderQuery = installmentsRef.where('status', '==', 'PENDIENTE').where('dueDate', '==', reminderDate);
        const reminderSnapshot = await reminderQuery.get();

        if (!reminderSnapshot.empty) {
            for (const doc of reminderSnapshot.docs) {
                const installment = doc.data();
                // Asumimos que cada cuota tiene userEmail y userName. ¡Esto es crucial!
                if (installment.userEmail && installment.userName) {
                    await sendReminderEmail(installment.userEmail, installment.userName, installment.amount, installment.dueDate.toDate());
                    remindersSent++;
                } else {
                    console.warn(`La cuota ${doc.id} no tiene datos de usuario para enviar recordatorio.`);
                }
            }
        }

        const summary = `Revisión completada. Cuotas actualizadas a VENCIDO: ${updates}. Recordatorios enviados: ${remindersSent}.`;
        console.log(summary);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: summary }),
        };

    } catch (error) {
        console.error("Error durante la ejecución de dailyChecks:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Falló la ejecución de la tarea programada.' }),
        };
    }
};
*/