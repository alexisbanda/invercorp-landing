# Invercorp Landing & Client Portal

**Invercorp Semillas de Fe** es una plataforma integral de gestión financiera y servicios diseñada para apoyar a emprendedores en Ecuador. Este proyecto combina una landing page pública moderna con un robusto portal de administración y clientes.

## 🚀 Características Principales

### 🌐 Landing Page Pública

- **Showcase de Servicios**: Presentación de microcréditos, asesoría legal, contabilidad, y apoyo psicológico.
- **Formulario de Contacto**: Integrado con Netlify Forms para gestión de leads.
- **Diseño Responsivo**: Experiencia fluida en móviles y escritorio.

### 🔐 Portal de Clientes

- **Dashboard Personal**: Visualización rápida de estado de cuenta y notificaciones.
- **Ahorro Programado**: Seguimiento de planes de ahorro, depósitos y proyecciones.
- **Gestión de Servicios**: Acceso a información sobre servicios no financieros contratados.

### 🛡️ Portal Administrativo

- **Gestión de Préstamos**:
  - Ciclo de vida completo: Solicitud -> Revisión -> Aprobación -> Desembolso.
  - Generación de tablas de amortización.
  - Registro de pagos y recibos.
- **Gestión de Ahorros**:
  - Creación de planes "Semillas de Fe".
  - Verificación de depósitos y solicitudes de retiro.
- **CRM Simplificado**: Gestión de perfiles de clientes y asesores.
- **Reportes y Estadística**:
  - Cartera de préstamos.
  - Reportes de morosidad y actividad de pagos.
  - Dashboard con KPIs en tiempo real.

## 🛠️ Stack Tecnológico

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: Tailwind CSS (vía CDN/Utility classes) + Lucid React Icons
- **Base de Datos & Auth**: [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **Despliegue**: [Netlify](https://www.netlify.com/) (Hosting, Functions, Forms)
- **Utilidades**:
  - `date-fns` para manejo de fechas.
  - `recharts` para gráficos estadísticos.
  - `jspdf` para generación de recibos PDF.

## 📂 Estructura del Proyecto

```
/
├── components/         # Componentes de React
│   ├── admin/          # Componentes protegidos del panel administrativo
│   │   ├── reports/    # Vistas de reportes y estadísticas
│   │   └── ...
│   ├── icons/          # Iconografía personalizada
│   └── ...
├── services/           # Lógica de negocio y llamadas a Firebase
├── types.ts            # Definiciones de tipos TypeScript (UserRole, Loan, Savings, etc.)
├── App.tsx             # Configuración de rutas (React Router)
└── firestore.rules     # Reglas de seguridad de la base de datos
```

## 💻 Instalación y Uso Local

**pre-requisitos**: Node.js v18+ instalado.

1.  **Clonar el repositorio**

    ```bash
    git clone <url-del-repositorio>
    cd invercop-landing
    ```

2.  **Instalar dependencias**

    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**
    Crea un archivo `.env.local` en la raíz (o `.env` si prefieres) con tus credenciales de Firebase y Gemini (si aplica):

    ```env
    VITE_FIREBASE_API_KEY=tu_api_key
    VITE_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=tu_project_id
    VITE_FIREBASE_STORAGE_BUCKET=tu_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
    VITE_FIREBASE_APP_ID=tu_app_id
    GEMINI_API_KEY=tu_gemini_key
    ```

4.  **Ejecutar en desarrollo**

    ```bash
    npm run dev
    ```

    La aplicación estará disponible en `http://localhost:5173`.

5.  **Construir para producción**
    ```bash
    npm run build
    ```

## 🔒 Seguridad y Roles

El sistema maneja dos roles principales definidos en `types.ts`:

- **ADMIN**: Acceso total a gestión, aprobación de créditos y reportes.
- **CLIENT**: Acceso de solo lectura a su propia información financiera y servicios.

Las rutas están protegidas mediante `ProtectedRoute` y `AdminProtectedRoute` que verifican el estado de autenticación y el rol del usuario en Firebase.

---

© 2024 Invercorp. Todos los derechos reservados.
