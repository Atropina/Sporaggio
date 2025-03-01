import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserPlus, FaDoorOpen } from 'react-icons/fa';
import { database } from '../firebase/config';
import { ref, get } from 'firebase/database';
import DarkModeToggle from './DarkModeToggle';
import Navbar from './Navbar';

function JoinRoom() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomExists, setRoomExists] = useState(false);
  const [roomName, setRoomName] = useState('');

  // Verificar se a sala existe ao carregar
  useEffect(() => {
    const checkRoom = async () => {
      try {
        setLoading(true);
        const roomRef = ref(database, `rooms/${roomCode}`);
        const snapshot = await get(roomRef);
        
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          setRoomExists(true);
          setRoomName(roomData.task?.title || 'Sala de Planning Poker');
        } else {
          setError('Esta sala não existe ou foi encerrada.');
        }
      } catch (err) {
        setError('Erro ao verificar a sala. Tente novamente.');
        console.error('Erro ao verificar sala:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkRoom();
  }, [roomCode]);

  // Entrar na sala com o nome fornecido
  const handleJoinRoom = (e) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError('Por favor, digite seu nome para continuar.');
      return;
    }
    
    navigate(`/room/${roomCode}`, { state: { displayName: displayName.trim() } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Navbar atualizada */}
      <Navbar 
        showBackButton={true}
        onBackClick={() => navigate('/')}
        pageTitle="Entrar em uma Sala"
      />
      
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700"
        >
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-700 dark:text-gray-300">Verificando sala...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="text-red-500 text-5xl mb-4">😕</div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Oops!</h2>
              <p className="mb-6 text-red-500">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition-colors"
              >
                Voltar para o início
              </motion.button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <FaDoorOpen className="text-4xl text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Ingressar na Sala</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Você está prestes a entrar em: <span className="font-medium text-gray-800 dark:text-gray-200">{roomName}</span>
                </p>
              </div>
              
              <form onSubmit={handleJoinRoom}>
                <div className="mb-6">
                  <label htmlFor="displayName" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Como devemos chamá-lo?
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    autoFocus
                  />
                  {error && error.includes("nome") && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                  )}
                </div>
                
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors flex items-center justify-center font-medium"
                >
                  <FaUserPlus className="mr-2" /> Entrar na Sala
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default JoinRoom; 