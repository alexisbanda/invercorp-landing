import React, { useState, useEffect } from 'react';
import { createAdvisor, updateAdvisor } from '../../services/advisorService';
import { Advisor } from '../../types';

interface EditAdvisorModalProps {
  advisor: Advisor | null;
  onClose: () => void;
  onAdvisorUpdated: () => void;
}

const EditAdvisorModal: React.FC<EditAdvisorModalProps> = ({ advisor, onClose, onAdvisorUpdated }) => {
  const [formData, setFormData] = useState<Omit<Advisor, 'id'>>({ nombre: '', telefono: '', correo: '' });
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (advisor) {
      setFormData({
        nombre: advisor.nombre,
        telefono: advisor.telefono,
        correo: advisor.correo,
      });
    } else {
      setFormData({ nombre: '', telefono: '', correo: '' });
    }
  }, [advisor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (advisor) {
        await updateAdvisor(advisor.id, formData);
        onAdvisorUpdated();
        onClose();
      } else {
        // Al crear, recibimos la contraseña temporal
        const { tempPassword } = await createAdvisor(formData);
        if (tempPassword) {
            setTempPassword(tempPassword);
            onAdvisorUpdated(); // Actualizamos la lista de fondo
        } else {
            onAdvisorUpdated();
            onClose();
        }
      }
    } catch (error: any) {
      console.error("Error saving advisor:", error);
      setError(error.message || "Error al guardar el asesor");
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
        navigator.clipboard.writeText(tempPassword);
        alert("Contraseña copiada al portapapeles");
    }
  };

  if (tempPassword) {
      return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">¡Asesor Creado!</h3>
                    <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500 mb-4">
                            Se ha creado el usuario de acceso. Por favor comparte estas credenciales con el asesor:
                        </p>
                        <p className="text-left font-bold text-gray-700">Usuario:</p>
                        <p className="text-left bg-gray-100 p-2 rounded mb-2">{formData.correo}</p>
                        <p className="text-left font-bold text-gray-700">Contraseña Temporal:</p>
                        <div className="flex items-center bg-gray-100 p-2 rounded mb-4">
                            <span className="flex-grow text-left font-mono">{tempPassword}</span>
                            <button onClick={handleCopyPassword} className="text-blue-500 hover:text-blue-700 ml-2" title="Copiar">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                </svg>
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{advisor ? 'Editar Asesor' : 'Agregar Asesor'}</h3>
          
          {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 mt-2" role="alert">
                  <span className="block sm:inline">{error}</span>
              </div>
          )}

          <form onSubmit={handleSubmit} className="mt-2 px-7 py-3">
            <input
              type="text"
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre || ''}
              onChange={handleChange}
              className="w-full p-2 mb-3 border border-gray-300 rounded-md"
              required
            />
            <input
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={formData.telefono || ''}
              onChange={handleChange}
              className="w-full p-2 mb-3 border border-gray-300 rounded-md"
              required
            />
            <input
              type="email"
              name="correo"
              placeholder="Correo"
              value={formData.correo || ''}
              onChange={handleChange}
              className="w-full p-2 mb-3 border border-gray-300 rounded-md"
              required
            />
            <div className="items-center px-4 py-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Guardar
              </button>
            </div>
          </form>
          <div className="items-center px-4 py-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAdvisorModal;
