// components/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase-config';
import toast from 'react-hot-toast';
// --- CAMBIO: Importar el servicio y los tipos de usuario ---
import { getUserProfile } from '../services/userService';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const navigate = useNavigate();

    const submitPasswordReset = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const target = resetEmail || email;
        if (!target) {
            toast.error('Ingresa un correo válido.');
            return;
        }
        setResetLoading(true);
        const notifyId = toast.loading('Enviando correo de restablecimiento...');
        try {
            await sendPasswordResetEmail(auth, target);
            toast.success('Correo de restablecimiento enviado. Revisa tu bandeja.', { id: notifyId });
            setIsResetModalOpen(false);
        } catch (err: any) {
            console.error('Error enviando correo de restablecimiento:', err);
            if (err.code === 'auth/user-not-found') {
                toast.error('No existe una cuenta con ese correo.', { id: notifyId });
            } else {
                toast.error('No fue posible enviar el correo. Intenta más tarde.', { id: notifyId });
            }
        } finally {
            setResetLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // --- INICIO DE LA MEJORA ---
            // Después del login, obtenemos el perfil del usuario para saber su rol
            const profile = await getUserProfile(userCredential.user.uid);

            if (!profile) {
                // Caso crítico: Usuario en Auth pero sin perfil en Firestore
                await auth.signOut(); // Desconectar inmediatamente
                setError('Error de cuenta: No se encontró el perfil de usuario. Contacte a soporte.');
                return;
            }

            // Redirigimos según el rol del usuario
            if (profile.role === UserRole.ADMIN) {
                navigate('/portal/admin');
            } else {
                navigate('/portal/dashboard');
            }
            // --- FIN DE LA MEJORA ---

        } catch (err: any) {
            console.error("Error de inicio de sesión:", err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('El correo electrónico o la contraseña son incorrectos.');
            } else {
                setError('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-[#2F4F4F] mb-6">Iniciar Sesión</h2>
                <form onSubmit={handleLogin}>
                    {/* ... (resto del formulario sin cambios) ... */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Correo Electrónico</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                        <div className="text-right">
                            <button type="button" onClick={() => { setResetEmail(email); setIsResetModalOpen(true); }} className="text-sm text-blue-600 hover:underline">¿Olvidaste tu contraseña?</button>
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50"
                        >
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </div>
                </form>
                {/* Modal de restablecimiento de contraseña */}
                {isResetModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-bold mb-4">Restablecer contraseña</h3>
                            <form onSubmit={submitPasswordReset}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium mb-1">Correo electrónico</label>
                                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="w-full p-2 border rounded" placeholder="correo@ejemplo.com" required />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                                    <button type="submit" disabled={resetLoading} className="px-4 py-2 bg-blue-600 text-white rounded">{resetLoading ? 'Enviando...' : 'Enviar correo'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};