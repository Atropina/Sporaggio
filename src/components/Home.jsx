import React, { useState, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaPlus, FaDoorOpen, FaRocket, FaUserSlash, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import DarkModeToggle from './DarkModeToggle';
import { database } from '../firebase/config';
import { ref, set, get } from 'firebase/database';
import Navbar from './Navbar';

// Componente input isolado e memoizado
const FormInput = memo(({ id, label, value, onChange, placeholder, required, type = "text", tooltip, rows }) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        {label}
        {tooltip && (
          <span className="ml-1 text-gray-500 dark:text-gray-400 inline-flex items-center" title={tooltip}>
            <FaInfoCircle size={14} />
          </span>
        )}
      </label>
      
      {rows ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
          rows={rows}
          required={required}
        ></textarea>
      ) : (
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
          required={required}
        />
      )}
      
      {tooltip && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {tooltip}
        </p>
      )}
    </div>
  );
});

// Botão padronizado e memoizado
const SubmitButton = memo(({ icon, children }) => {
  const Icon = icon;
  return (
    <motion.button
      type="submit"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
    >
      <Icon className="mr-2" /> {children}
    </motion.button>
  );
});

// Card container memoizado
const CardContainer = memo(({ children, title, icon }) => {
  const Icon = icon;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full overflow-hidden"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-800 dark:text-gray-100">
          <Icon className="text-blue-500 mr-2" /> {title}
        </h2>
        {children}
      </div>
    </motion.div>
  );
});

// Componente isolado para o formulário de criação
const CreateRoomForm = memo(({ onSubmit }) => {
  const [name, setName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      roomName,
      roomDescription
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1">
        <FormInput 
          id="createName"
          label="Seu Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como você quer ser chamado?"
          required={true}
        />
        
        <FormInput 
          id="roomName"
          label="Nome da Sala"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="Ex: Implementação do Login"
          tooltip="Opcional. Se não definido, será usado um nome padrão."
        />
        
        <FormInput 
          id="roomDescription"
          label="Descrição"
          value={roomDescription}
          onChange={(e) => setRoomDescription(e.target.value)}
          placeholder="Adicione detalhes sobre o que será estimado..."
          tooltip="Opcional. Descreva brevemente a tarefa a ser estimada."
          rows={3}
        />
      </div>
      
      <div className="mt-4">
        <SubmitButton icon={FaPlus}>
          Criar Sala
        </SubmitButton>
      </div>
    </form>
  );
});

// Componente isolado para o formulário de entrada
const JoinRoomForm = memo(({ onSubmit }) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      roomCode
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1">
        <FormInput 
          id="joinName"
          label="Seu Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Como você quer ser chamado?"
          required={true}
        />
        
        <FormInput 
          id="roomCode"
          label="Código da Sala"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Ex: ABCDEF"
          tooltip="Digite o código de 6 letras fornecido pelo criador da sala"
          required={true}
        />
        
        {/* Espaço adicional para compensar o campo a menos */}
        <div className="mb-4 invisible">
          <label className="block text-sm font-medium mb-2 text-transparent">Espaço</label>
          <div className="w-full h-24"></div>
        </div>
      </div>
      
      <div className="mt-4">
        <SubmitButton icon={FaDoorOpen}>
          Entrar na Sala
        </SubmitButton>
      </div>
    </form>
  );
});

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const kickMessage = location.state?.kickMessage;
  const [showKickMessage, setShowKickMessage] = useState(!!kickMessage);

  // Ocultar mensagem de expulsão após alguns segundos
  useEffect(() => {
    if (kickMessage) {
      const timer = setTimeout(() => {
        setShowKickMessage(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [kickMessage]);

  // Função para gerar código de sala aleatório
  const generateRoomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Criar sala
  const handleCreateRoom = async (formData) => {
    if (!formData.name) {
      alert('Por favor, digite seu nome antes de criar uma sala.');
      return;
    }
    
    const newRoomCode = generateRoomCode();
    const roomRef = ref(database, `rooms/${newRoomCode}`);
    
    // Use o nome da sala fornecido ou um valor padrão
    const finalRoomName = formData.roomName.trim() || 'Nova Estimativa';
    const finalRoomDescription = formData.roomDescription.trim() || 'Adicione uma descrição mais detalhada aqui.';
    
    try {
      // Criar a nova sala com nome personalizado
      const userId = uuidv4();
      
      await set(roomRef, {
        createdAt: Date.now(),
        creatorId: userId,
        task: {
          title: finalRoomName,
          description: finalRoomDescription
        },
        revealed: false
      });
      
      // Navegar para a sala com userId para identificar o criador
      navigate(`/room/${newRoomCode}`, { state: { displayName: formData.name, userId } });
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      alert('Erro ao criar sala. Tente novamente.');
    }
  };

  // Entrar em uma sala
  const handleJoinRoom = async (formData) => {
    if (!formData.name) {
      alert('Por favor, digite seu nome antes de entrar em uma sala.');
      return;
    }
    
    if (!formData.roomCode) {
      alert('Por favor, digite o código da sala.');
      return;
    }
    
    try {
      // Verificar se a sala existe
      const roomRef = ref(database, `rooms/${formData.roomCode.toUpperCase()}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        alert('Sala não encontrada. Verifique o código e tente novamente.');
        return;
      }
      
      // Navegar para a sala
      navigate(`/room/${formData.roomCode.toUpperCase()}`, { state: { displayName: formData.name } });
    } catch (error) {
      console.error('Erro ao verificar sala:', error);
      alert('Erro ao verificar sala. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Navbar simples para a página inicial */}
      <Navbar />
      
      {/* Mensagem de expulsão */}
      <AnimatePresence>
        {showKickMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500 text-white p-4 shadow-md"
          >
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center">
                <FaUserSlash className="mr-2" />
                <span>{kickMessage}</span>
              </div>
              <button 
                onClick={() => setShowKickMessage(false)}
                className="text-white hover:text-red-200"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Banner hero com largura reduzida */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 mb-8">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-3">Estimativas ágeis simplificadas</h1>
          <p className="text-xl mx-auto">
            Crie uma sala, convide seu time e comece a estimar tarefas juntos em tempo real.
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row items-stretch justify-center gap-8 p-6 container mx-auto">
        {/* Formulário de Criação */}
        <div className="flex-1 max-w-md flex">
          <CardContainer title="Criar Nova Sala" icon={FaRocket}>
            <CreateRoomForm onSubmit={handleCreateRoom} />
          </CardContainer>
        </div>
        
        {/* Formulário de Entrada */}
        <div className="flex-1 max-w-md flex">
          <CardContainer title="Entrar em uma Sala" icon={FaDoorOpen}>
            <JoinRoomForm onSubmit={handleJoinRoom} />
          </CardContainer>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-6 mt-auto border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-300">
          <p>© {new Date().getFullYear()} Sporaggio - Criado por Lucas</p>
          <p className="text-sm mt-2">Uma ferramenta para equipes ágeis realizarem estimativas de forma colaborativa</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
