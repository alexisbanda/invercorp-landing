// components/AdminProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, userProfile, loading } = useAuth();

    if (loading) {
        return <div>Cargando...</div>; // O un spinner más elegante
    }

    // Si hay un usuario y su rol es ADMIN o ADVISOR, permite el acceso
    if (currentUser && (userProfile?.role === UserRole.ADMIN || userProfile?.role === UserRole.ADVISOR)) {
        return <>{children}</>;
    }

    // Si no es admin, redirige al dashboard de cliente o al login
    return <Navigate to={currentUser ? "/portal/dashboard" : "/portal/login"} />;
};