// src/components/admin/EditAdvisorModal.tsx
import React, { useState, useEffect } from 'react';
import { Advisor, createAdvisor, updateAdvisor } from '../../services/advisorService';

interface EditAdvisorModalProps {
  advisor: Advisor | null;
  onClose: () => void;
  onAdvisorUpdated: () => void;
}

const EditAdvisorModal: React.FC<EditAdvisorModalProps> = ({ advisor, onClose, onAdvisorUpdated }) => {
  const [formData, setFormData] = useState<Omit<Advisor, 'id'>>({ nombre: '', telefono: '', correo: '' });

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
    try {
      if (advisor) {
        await updateAdvisor(advisor.id, formData);
      } else {
        await createAdvisor(formData);
      }
      onAdvisorUpdated();
      onClose();
    } catch (error) {
      console.error("Error saving advisor:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{advisor ? 'Editar Asesor' : 'Agregar Asesor'}</h3>
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
