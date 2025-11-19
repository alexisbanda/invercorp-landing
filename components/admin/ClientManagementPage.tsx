// src/components/admin/ClientManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { getAllClients, Client, deleteClient } from '../../services/clientService';
import { getAllLoans } from '../../services/loanService';
import { getAllProgrammedSavings } from '../../services/savingsService';
import EditClientModal from './EditClientModal';
import { Link } from 'react-router-dom';
import { Loan, ProgrammedSaving } from '../../types';

const ClientManagementPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientData, setClientData] = useState<{[key: string]: {loans: Loan[], savings: ProgrammedSaving[]}}>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [allClients, allLoans, allSavings] = await Promise.all([
        getAllClients(),
        getAllLoans(),
        getAllProgrammedSavings(),
      ]);

      const data: {[key: string]: {loans: Loan[], savings: ProgrammedSaving[]}} = {};

      allClients.forEach(client => {
        data[client.id] = {
          loans: allLoans.filter(loan => loan.userId === client.id),
          savings: allSavings.filter(saving => saving.clienteId === client.id),
        };
      });

      setClients(allClients);
      setClientData(data);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
  };

  const handleCloseModal = () => {
    setSelectedClient(null);
  };

  const handleClientUpdated = () => {
    fetchAllData(); // Re-fetch all data to show updated info
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    // Validar si el cliente tiene préstamos o ahorros activos
    const hasLoans = clientData[clientToDelete.id]?.loans.length > 0;
    const hasSavings = clientData[clientToDelete.id]?.savings.length > 0;

    if (hasLoans || hasSavings) {
      alert('No se puede eliminar el cliente porque tiene préstamos o ahorros registrados. Por favor, elimine primero los servicios asociados.');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteClient(clientToDelete.id);
      await fetchAllData(); // Recargar la lista
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
      alert('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar el cliente. Por favor, intente nuevamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Cargando clientes...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Administración de Clientes</h1>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o email..."
          className="w-full p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cédula</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Cartola</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap">{client.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.cedula}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.numeroCartola}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {clientData[client.id]?.loans.length > 0 && (
                    <Link to={`/portal/admin/management/${clientData[client.id]?.loans[0].id}`} className="text-blue-600 hover:text-blue-900 mr-4">Ver Préstamo</Link>
                  )}
                  {clientData[client.id]?.savings.length > 0 && (
                     <Link to={`/portal/admin/savings/${client.id}/${clientData[client.id]?.savings[0].numeroCartola}`} className="text-green-600 hover:text-green-900 mr-4">Ver Ahorro</Link>
                  )}
                  <button onClick={() => handleEditClick(client)} className="text-yellow-600 hover:text-yellow-900 mr-4">Editar</button>
                  <button onClick={() => handleDeleteClick(client)} className="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EditClientModal
        client={selectedClient}
        onClose={handleCloseModal}
        onClientUpdated={handleClientUpdated}
      />

      {/* Modal de confirmación de eliminación */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Confirmar Eliminación</h2>
            <p className="mb-4">
              ¿Está seguro que desea eliminar al cliente <strong>{clientToDelete.name}</strong>?
            </p>
            <p className="mb-2 text-sm text-gray-600">
              <strong>Cédula:</strong> {clientToDelete.cedula}
            </p>
            <p className="mb-4 text-sm text-gray-600">
              <strong>Email:</strong> {clientToDelete.email}
            </p>
            
            {(clientData[clientToDelete.id]?.loans.length > 0 || clientData[clientToDelete.id]?.savings.length > 0) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-700 font-semibold">⚠️ Este cliente tiene servicios activos:</p>
                <ul className="list-disc list-inside text-red-600 text-sm mt-2">
                  {clientData[clientToDelete.id]?.loans.length > 0 && (
                    <li>{clientData[clientToDelete.id].loans.length} préstamo(s)</li>
                  )}
                  {clientData[clientToDelete.id]?.savings.length > 0 && (
                    <li>{clientData[clientToDelete.id].savings.length} ahorro(s)</li>
                  )}
                </ul>
                <p className="text-red-600 text-sm mt-2">
                  No se puede eliminar hasta que se eliminen todos los servicios asociados.
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isDeleting || clientData[clientToDelete.id]?.loans.length > 0 || clientData[clientToDelete.id]?.savings.length > 0}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagementPage;
