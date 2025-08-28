// src/components/admin/AdvisorManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { getAllAdvisors, deleteAdvisor } from '../../services/advisorService';
import { Advisor } from '../../types';
import EditAdvisorModal from './EditAdvisorModal';

const AdvisorManagementPage: React.FC = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAdvisors = async () => {
    try {
      setLoading(true);
      const allAdvisors = await getAllAdvisors();
      setAdvisors(allAdvisors);
    } catch (error) {
      console.error("Error fetching advisors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const handleEditClick = (advisor: Advisor) => {
    setSelectedAdvisor(advisor);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedAdvisor(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAdvisor(null);
  };

  const handleAdvisorUpdated = () => {
    fetchAdvisors();
  };

  const handleDeleteClick = async (advisorId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este asesor?')) {
      try {
        await deleteAdvisor(advisorId);
        fetchAdvisors();
      } catch (error) {
        console.error("Error deleting advisor:", error);
      }
    }
  };

  if (loading) {
    return <div>Cargando asesores...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Administración de Asesores</h1>
      
      <div className="mb-4">
        <button onClick={handleAddClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Agregar Asesor
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {advisors.map((advisor) => (
              <tr key={advisor.id}>
                <td className="px-6 py-4 whitespace-nowrap">{advisor.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap">{advisor.telefono}</td>
                <td className="px-6 py-4 whitespace-nowrap">{advisor.correo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEditClick(advisor)} className="text-yellow-600 hover:text-yellow-900 ml-4">Editar</button>
                  <button onClick={() => handleDeleteClick(advisor.id)} className="text-red-600 hover:text-red-900 ml-4">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && (
        <EditAdvisorModal
          advisor={selectedAdvisor}
          onClose={handleCloseModal}
          onAdvisorUpdated={handleAdvisorUpdated}
        />
      )}
    </div>
  );
};

export default AdvisorManagementPage;
