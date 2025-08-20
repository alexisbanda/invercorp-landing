// src/components/admin/EditClientModal.tsx
import React, { useState, useEffect } from 'react';
import { Client, updateClient } from '../../services/clientService';

interface EditClientModalProps {
  client: Client | null;
  onClose: () => void;
  onClientUpdated: () => void;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ client, onClose, onClientUpdated }) => {
  const [formData, setFormData] = useState<Partial<Client>>({});

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        cedula: client.cedula,
        email: client.email,
        phone: client.phone,
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    try {
      await updateClient(client.id, formData);
      onClientUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  if (!client) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Cliente</h3>
          <form onSubmit={handleSubmit} className="mt-2 px-7 py-3">
            <input
              type="text"
              name="name"
              placeholder="Nombre"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full p-2 mb-3 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              name="cedula"
              placeholder="Cédula"
              value={formData.cedula || ''}
              onChange={handleChange}
              className="w-full p-2 mb-3 border border-gray-300 rounded-md"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full p-2 mb-3 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              name="phone"
              placeholder="Teléfono"
              value={formData.phone || ''}
              onChange={handleChange}
              className="w-full p-2 mb-3 border border-gray-300 rounded-md"
            />
            <div className="items-center px-4 py-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Guardar Cambios
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

export default EditClientModal;
