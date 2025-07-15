
import React, { useState } from 'react';

interface WorkWithUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WorkWithUsModal: React.FC<WorkWithUsModalProps> = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    const whatsappNumber = '573138312929'; // Reemplaza con tu número de WhatsApp
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Trabaja con nosotros</h2>
        <p className="mb-4">Te estamos esperando, tenemos varias posiciones que son adecuadas para ti, déjanos un mensaje y nos pondremos en contacto contigo lo más pronto posible.</p>
        <textarea
          className="w-full p-2 border rounded-lg mb-4"
          rows={5}
          placeholder="Escribe tu mensaje aquí..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 font-bold px-4 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleSendMessage}
            className="bg-green-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkWithUsModal;
