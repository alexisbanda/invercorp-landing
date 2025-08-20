// src/components/admin/ClientManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { getAllClients, Client } from '../../services/clientService';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientData, setClientData] = useState<{[key: string]: {loans: Loan[], savings: ProgrammedSaving[]}}>({});

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
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleClientUpdated = () => {
    fetchAllData(); // Re-fetch all data to show updated info
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
                <td className="px-6 py-4 whitespace-nowrap">{client.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {clientData[client.id]?.loans.length > 0 && (
                    <Link to={`/portal/admin/management/${clientData[client.id]?.loans[0].id}`} className="text-blue-600 hover:text-blue-900 mr-4">Ver Préstamo</Link>
                  )}
                  {clientData[client.id]?.savings.length > 0 && (
                     <Link to={`/portal/admin/savings/${client.id}/${clientData[client.id]?.savings[0].numeroCartola}`} className="text-green-600 hover:text-green-900">Ver Ahorro</Link>
                  )}
                  <button onClick={() => handleEditClick(client)} className="text-yellow-600 hover:text-yellow-900 ml-4">Editar</button>
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
    </div>
  );
};

export default ClientManagementPage;
