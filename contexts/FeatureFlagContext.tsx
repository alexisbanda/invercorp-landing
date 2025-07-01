import React, { createContext, useContext, useMemo } from 'react';

// 1. Definimos la forma de nuestras flags
interface FeatureFlags {
    isChatbotEnabled: boolean;
    isLoanSimulatorEnabled: boolean;
    isClientPortalEnabled: boolean;
}

// 2. Creamos el Context
const FeatureFlagContext = createContext<FeatureFlags | undefined>(undefined);

// 3. Creamos el Proveedor del Contexto
export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Usamos useMemo para que este objeto solo se calcule una vez
    const flags = useMemo((): FeatureFlags => {
        // Leemos las variables de entorno de Vite y las convertimos a booleanos
        return {
            isChatbotEnabled: import.meta.env.VITE_FEATURE_CHATBOT_ENABLED === 'true',
            isLoanSimulatorEnabled: import.meta.env.VITE_FEATURE_LOAN_SIMULATOR_ENABLED === 'true',
            isClientPortalEnabled: import.meta.env.VITE_FEATURE_CLIENT_PORTAL_ENABLED === 'true',
        };
    }, []);

    return (
        <FeatureFlagContext.Provider value={flags}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

// 4. Creamos un Hook personalizado para usar las flags fácilmente
export const useFeatureFlags = (): FeatureFlags => {
    const context = useContext(FeatureFlagContext);
    if (context === undefined) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
};