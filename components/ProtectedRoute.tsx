import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Este componente envuelve las rutas que queremos proteger
export const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const { currentUser, loading } = useAuth();

    // 1. Mientras Firebase comprueba la autenticación, mostramos un loader.
    //    Esto evita un "parpadeo" a la página de login.
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Cargando...</p>
            </div>
        );
    }

    // 2. Si no hay usuario, lo redirigimos a la página de login.
    if (!currentUser) {
        return <Navigate to="/portal/login" replace />;
    }

    // 3. Si hay un usuario, mostramos el contenido de la ruta.
    return children;
};