
// src/services/serviceDefinitions.ts

/**
 * Define la estructura del flujo de ejecución para un tipo de servicio.
 */
export interface ServiceFlow {
  flujo_ejecucion: string[];
}

/**
 * Contiene la definición de todos los flujos de servicios no financieros.
 * Esta es la fuente de verdad para la lógica de la aplicación.
 */
export const serviceFlows: Record<string, ServiceFlow> = {
  "credito_emprendedor": {
    "flujo_ejecucion": [
      "Revisión de Buro",
      "Apertura de Cuenta",
      "Tabla de Amortización",
      "Desembolsado",
      "Liquidado"
    ]
  },
  "servicio_legal": {
    "flujo_ejecucion": [
      "Revisión de Buro",
      "Apertura de Cuenta",
      "Inicio de Proceso",
      "Ingreso de Documentación Legal",
      "Respuesta de Notificación",
      "Resolución",
      "Finalizado"
    ]
  },
  "servicio_contable": {
    "flujo_ejecucion": [
      "Revisión de Buro",
      "Apertura de Cuenta",
      "Declaraciones",
      "Estado de Declaraciones",
      "Proceso Concluido",
      "Entrega de Declaraciones Clientes"
    ]
  },
  "firmas_electronicas": {
    "flujo_ejecucion": [
      "Creación de Firma Electrónica",
      "Estado (Pendiente, Creado)",
      "Entrega de Firma"
    ]
  },
  "gestion_externa_creditos": {
    "flujo_ejecucion": [
      "Revisión de Buro",
      "Apertura de Cuenta",
      "Aprobación",
      "Ingreso Documentación",
      "Inspección",
      "Desembolso"
    ]
  },
  "paginas_web": {
    "flujo_ejecucion": [
      "Revisión de Buro",
      "Apertura de Cuenta",
      "Creación",
      "Estado",
      "Entrega",
      "Producción"
    ]
  },
  "asesoria_psicologica": {
    "flujo_ejecucion": [
      "Revisión de Buro",
      "Apertura de Cuenta",
      "Asesoría Gratuita",
      "Primera Cita",
      "Procesos",
      "Avance",
      "Culminación"
    ]
  },
  "creacion_patentes": {
    "flujo_ejecucion": [
      "Revisión de Buro",
      "Apertura de Cuenta",
      "Recepción de Documentos",
      "Proceso",
      "Avance",
      "Entrega"
    ]
  }
};

/**
 * Genera un tipo unión con todas las claves de los servicios disponibles.
 * Ejemplo: "credito_emprendedor" | "servicio_legal" | ...
 */
export type ServiceType = keyof typeof serviceFlows;

/**
 * Devuelve un array con los nombres de todos los tipos de servicio.
 */
export const serviceTypeNames = Object.keys(serviceFlows);

/**
 * Formatea un tipo de servicio (string_like_this) a un formato legible (String Like This).
 * @param serviceType El identificador del tipo de servicio.
 * @returns El nombre del servicio formateado para mostrar en la UI.
 */
export const formatServiceType = (serviceType: string): string => {
  return serviceType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
