import React from 'react';
import ReactDOM from 'react-dom/client';

// Importamos los componentes y proveedores necesarios
import App from './App'; // Tu componente con las rutas
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { AuthProvider } from './contexts/AuthContext'; // El proveedor de autenticación
import './index.css';

const container = document.getElementById('root');

if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
        <React.StrictMode>
            {/*
              --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
              Asegúrate de que AuthProvider envuelva a tu componente App.
              El orden es importante: los contextos deben envolver a la aplicación.
            */}
            <FeatureFlagProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </FeatureFlagProvider>
        </React.StrictMode>
    );
} else {
    console.error('Failed to find the root element. Make sure an element with id="root" exists in your index.html.');
}