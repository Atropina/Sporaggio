import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaRedo, FaEye, FaUsers, FaLink, FaCheck, FaBolt, FaArrowUp, FaArrowDown, FaTrophy, FaRegLightbulb, FaSignOutAlt, FaTimes, FaUserSlash, FaFeather, FaCoffee, FaInfinity, FaQuestion, FaExclamationTriangle, FaCheckCircle, FaArrowRight, FaLightbulb } from 'react-icons/fa';
import DarkModeToggle from './DarkModeToggle';
import { database } from '../firebase/config';
import { ref, onValue, set, remove, update, onDisconnect, off } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';
import Navbar from './Navbar';

const fibonacciCards = [1, 2, 3, 5, 8, 13, 21, 34, 55];

const Card = ({ value, onClick, selected, disabled }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={selected ? { 
        scale: [1, 1.05, 1],
        boxShadow: ["0px 0px 0px rgba(59, 130, 246, 0)", "0px 0px 15px rgba(59, 130, 246, 0.5)", "0px 0px 10px rgba(59, 130, 246, 0.3)"]
      } : {}}
      transition={{ 
        repeat: selected ? Infinity : 0,
        repeatDelay: 1.5
      }}
      onClick={() => !disabled && onClick(value)}
      className={`cursor-pointer p-4 m-2 w-20 h-20 flex items-center justify-center rounded-lg border text-xl font-bold transition-colors 
      ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-gray-300'}
      ${disabled && 'opacity-50 cursor-not-allowed'}`}
    >
      {value}
    </motion.div>
  );
};

function Room() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { displayName, userId: passedUserId } = location.state || {};

  // Se o nome não estiver disponível, redireciona para a página de ingresso
  useEffect(() => {
    if (!displayName) {
      navigate(`/join/${roomCode}`);
    }
  }, [displayName, navigate, roomCode]);

  const [userVote, setUserVote] = useState(null);
  const [players, setPlayers] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [task, setTask] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [userId] = useState(passedUserId || uuidv4());
  const [isCreator, setIsCreator] = useState(false);
  const [roomCreatorId, setRoomCreatorId] = useState(null);
  const [showVoteComparisonLocal, setShowVoteComparisonLocal] = useState(false);
  const [votingProgress, setVotingProgress] = useState(0);
  const [showOwnerChangedNotification, setShowOwnerChangedNotification] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [previousOwnerId, setPreviousOwnerId] = useState(null);
  const [playerToKick, setPlayerToKick] = useState(null);
  const [showKickConfirmation, setShowKickConfirmation] = useState(false);
  const [wasKicked, setWasKicked] = useState(false);
  const [showHighFive, setShowHighFive] = useState(false);
  const [showUnderstandingModal, setShowUnderstandingModal] = useState(false);
  const [showComplexTaskModal, setShowComplexTaskModal] = useState(false);

  // Conectar à sala e manipular desconexão
  useEffect(() => {
    if (!displayName) return;

    // Referências para a sala e jogadores
    const roomRef = ref(database, `rooms/${roomCode}`);
    const playerRef = ref(database, `rooms/${roomCode}/players/${userId}`);
    const creatorRef = ref(database, `rooms/${roomCode}/creatorId`);
    
    // Adicionar jogador à sala
    set(playerRef, {
      name: displayName,
      vote: null,
      online: true,
      joinedAt: Date.now()
    });
    
    // Se eu sou o criador, configurar presença com onDisconnect
    onValue(creatorRef, (snapshot) => {
      const creatorId = snapshot.val();
      if (creatorId === userId) {
        // Se eu sou o criador, configurar o que acontece quando eu desconecto
        onDisconnect(creatorRef).set(null);
      }
    }, { onlyOnce: true });
    
    // Configurar limpeza ao desconectar para todos
    onDisconnect(playerRef).remove();
    
    // Escutar mudanças na sala
    const roomListener = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      // Verificar se o criador mudou
      if (data.creatorId !== roomCreatorId) {
        const previousCreatorId = roomCreatorId;
        setRoomCreatorId(data.creatorId);
        
        if (previousCreatorId && data.creatorId) {
          // O criador mudou (não é a primeira vez que carregamos)
          setPreviousOwnerId(previousCreatorId);
          
          // Verificar se o novo dono está na lista de jogadores para mostrar notificação
          if (data.players && data.players[data.creatorId]) {
            setNewOwnerName(data.players[data.creatorId].name);
            setShowOwnerChangedNotification(true);
            
            // Ocultar notificação após alguns segundos
            setTimeout(() => {
              setShowOwnerChangedNotification(false);
            }, 5000);
          }
        }
        
        // Verificar se eu sou o novo criador
        setIsCreator(data.creatorId === userId);
      }
      
      // Atualizar estado de revelação
      if (data.revealed !== undefined) {
        setRevealed(data.revealed);
      }
      
      // Atualizar título e descrição da tarefa
      if (data.task) {
        setTask(data.task.title || 'Nova Estimativa');
        setTaskDescription(data.task.description || 'Adicione uma descrição mais detalhada aqui.');
      }
      
      // Atualizar jogadores
      if (data.players) {
        const playerList = Object.entries(data.players).map(([id, player]) => ({
          id,
          ...player
        }));
        setPlayers(playerList);
        
        // Atualizar voto do usuário atual
        const currentUser = playerList.find(p => p.id === userId);
        if (currentUser) {
          setUserVote(currentUser.vote);
        }
      }
    });
    
    // Limpar ao desmontar
    return () => {
      // Remover jogador quando sair
      remove(playerRef);
    };
  }, [displayName, roomCode, userId, roomCreatorId]);

  // Verificar criador ausente e promover novo dono
  useEffect(() => {
    if (!players.length || !roomCreatorId) return;
    
    // Verificar se o criador existe na lista de jogadores
    const creatorExists = players.some(player => player.id === roomCreatorId && player.online);
    
    if (!creatorExists) {
      // O criador não está presente, promover o jogador mais antigo como novo dono
      const onlinePlayers = players.filter(player => player.online);
      if (onlinePlayers.length) {
        // Ordenar por tempo de entrada (do mais antigo para o mais recente)
        const sortedPlayers = [...onlinePlayers].sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
        const newCreator = sortedPlayers[0];
        
        if (newCreator) {
          // Atualizar o creatorId na sala
          const roomRef = ref(database, `rooms/${roomCode}`);
          update(roomRef, { creatorId: newCreator.id });
        }
      }
    }
  }, [players, roomCreatorId, roomCode]);

  // Verificar se o usuário foi expulso
  useEffect(() => {
    const kickedPlayersRef = ref(database, `rooms/${roomCode}/kickedPlayers/${userId}`);
    
    const kickedListener = onValue(kickedPlayersRef, (snapshot) => {
      if (snapshot.exists()) {
        // O usuário atual foi expulso
        setWasKicked(true);
        
        // Redirecionar para a home após um breve delay
        setTimeout(() => {
          navigate('/', { 
            state: { 
              kickMessage: 'Você foi removido da sala pelo organizador.' 
            }
          });
        }, 2000);
      }
    });
    
    return () => {
      off(kickedPlayersRef, 'value', kickedListener);
    };
  }, [roomCode, userId, navigate]);

  // Manipular votação
  const handleCardClick = (value) => {
    // Impedir mudança de voto após a revelação
    if (revealed) return;
    
    // Atualizar voto no Firebase
    const playerRef = ref(database, `rooms/${roomCode}/players/${userId}`);
    update(playerRef, { vote: value });
    setUserVote(value);
  };

  // Função melhorada para tratar valores especiais e normais corretamente
  const getExtremeVoters = () => {
    console.log("Calculando extreme voters");
    
    if (!players.length) return { lowest: null, highest: null };
    
    // Filtrar jogadores que votaram
    const votedPlayersCopy = players.filter(p => p.vote !== null && p.vote !== undefined);
    console.log("Voted players:", votedPlayersCopy);
    
    if (votedPlayersCopy.length === 0) return { lowest: null, highest: null };
    
    // Separar votos normais (numéricos) e especiais
    const numericVoters = [];
    const specialVoters = [];
    
    votedPlayersCopy.forEach(player => {
      // Se o voto for um número, ou uma string que pode ser convertida para número
      if (
        // É um número diretamente
        (typeof player.vote === 'number') || 
        // É uma string que pode ser convertida para número
        (typeof player.vote === 'string' && !isNaN(Number(player.vote)))
      ) {
        // Certifique-se de converter para número
        const playerWithNumericVote = {
          ...player,
          vote: typeof player.vote === 'string' ? Number(player.vote) : player.vote
        };
        numericVoters.push(playerWithNumericVote);
      } 
      // Se for um voto especial
      else if (
        player.vote === "∞" || 
        player.vote === "?" || 
        player.vote === "☕" || 
        player.vote === "complexo demais"
      ) {
        specialVoters.push(player);
      }
    });
    
    console.log("Numeric voters:", numericVoters);
    console.log("Special voters:", specialVoters);
    
    // Se temos votos especiais, o mais alto é sempre o especial
    if (specialVoters.length > 0) {
      if (numericVoters.length > 0) {
        // Se temos ambos os tipos, ordene os numéricos para encontrar o mais baixo
        const sortedNumeric = [...numericVoters].sort((a, b) => a.vote - b.vote);
        return {
          lowest: sortedNumeric[0],
          highest: specialVoters[0]
        };
      } else {
        // Se temos apenas especiais, use um valor fictício para o mais baixo
        return {
          lowest: { name: "N/A", vote: 0 },
          highest: specialVoters[0]
        };
      }
    }
    
    // Se temos apenas votos numéricos (caso normal)
    if (numericVoters.length > 0) {
      const sortedVoters = [...numericVoters].sort((a, b) => a.vote - b.vote);
      return {
        lowest: sortedVoters[0],
        highest: sortedVoters[sortedVoters.length - 1]
      };
    }
    
    // Fallback
    return { lowest: null, highest: null };
  };

  // Função explícita para verificar se os votos são diferentes
  const hasDifferentVotes = () => {
    const extremeVoters = getExtremeVoters();
    
    if (!extremeVoters.lowest || !extremeVoters.highest) {
      return false;
    }
    
    console.log("Comparing votes:", extremeVoters.lowest.vote, extremeVoters.highest.vote);
    
    // Certifique-se de que estamos comparando números, se possível
    const lowestVote = typeof extremeVoters.lowest.vote === 'string' && !isNaN(Number(extremeVoters.lowest.vote)) 
      ? Number(extremeVoters.lowest.vote) 
      : extremeVoters.lowest.vote;
      
    const highestVote = typeof extremeVoters.highest.vote === 'string' && !isNaN(Number(extremeVoters.highest.vote)) 
      ? Number(extremeVoters.highest.vote) 
      : extremeVoters.highest.vote;
    
    return lowestVote !== highestVote;
  };

  // Função para verificar se há votos especiais
  const hasSpecialVotes = () => {
    return players.some(p => 
      p.vote === "∞" || 
      p.vote === "?" || 
      p.vote === "☕" || 
      p.vote === "complexo demais"
    );
  };

  // Adicionando debug console para diagnóstico
  const debugState = (msg) => {
    console.log(`[DEBUG] ${msg} - revealed: ${revealed}, showVoteComparison: ${showVoteComparisonLocal}`);
  };

  // Função para verificar se todos votaram com valores especiais
  const allVotedSpecial = () => {
    if (votedPlayers.length <= 0) return false;
    
    // Verificar se todos os votos são complexo demais, ?, etc
    return votedPlayers.every(player => 
      player.vote === "∞" || 
      player.vote === "?" || 
      player.vote === "☕" || 
      player.vote === "complexo demais"
    );
  };

  // Qual valor especial foi votado por todos
  const getCommonSpecialVote = () => {
    if (!allVotedSpecial() || votedPlayers.length === 0) return null;
    return votedPlayers[0].vote;
  };

  // Modificar a função handleReveal para considerar o novo cenário
  const handleReveal = () => {
    console.log("handleReveal chamado");
    
    // Atualiza o Firebase
    const roomRef = ref(database, `rooms/${roomCode}`);
    update(roomRef, { revealed: true });
    
    if (votedPlayers.length <= 1) {
      console.log("Menos de 2 votantes, não mostrando nada");
      return; // Não há comparação com menos de 2 votos
    }
    
    // Novo caso - todos votaram em valores especiais
    if (allVotedSpecial()) {
      console.log("Todos votaram valores especiais, mostrando modal de tarefa complexa");
      setShowComplexTaskModal(true);
      update(roomRef, { showComplexTaskModal: true });
      return;
    }
    
    if (allVotesEqual() && !hasSpecialVotes()) {
      console.log("Todos votaram igual, mostrando modal de entendimento completo");
      // Ativar modal de entendimento completo
      setShowUnderstandingModal(true);
      update(roomRef, { showUnderstandingModal: true });
      
      // Ainda exibe o high-five rapidamente para celebração visual
      setShowHighFive(true);
      setTimeout(() => {
        setShowHighFive(false);
      }, 2000);
    } else {
      // Nos demais casos, temos votos diferentes ou votos especiais misturados
      console.log("Votos diferentes ou especiais, mostrando comparação");
      setShowVoteComparisonLocal(true);
      update(roomRef, { showVoteComparison: true });
    }
  };

  // Adicione essa função que está faltando
  const closeVoteComparison = () => {
    console.log("Fechando modal de comparação de votos");
    setShowVoteComparisonLocal(false);
  };

  // Função existente para fechar o modal de entendimento
  const closeUnderstandingModal = () => {
    console.log("Fechando modal de entendimento");
    setShowUnderstandingModal(false);
  };

  // Função para fechar o modal de tarefa complexa
  const closeComplexTaskModal = () => {
    setShowComplexTaskModal(false);
  };

  // Modificar a função handleReset para incluir o novo modal
  const handleReset = () => {
    console.log("Reset iniciado");
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    // Ao resetar a sala, garante que todos os modais sejam fechados
    update(roomRef, {
      revealed: false,
      showVoteComparison: false,
      showUnderstandingModal: false,
      showComplexTaskModal: false
    });
    
    // Reset de estados locais
    setShowVoteComparisonLocal(false);
    setShowUnderstandingModal(false);
    setShowComplexTaskModal(false);
    
    // Limpar os votos de todos
    const playersRef = ref(database, `rooms/${roomCode}/players`);
    onValue(playersRef, (snapshot) => {
      const playersData = snapshot.val();
      if (playersData) {
        Object.keys(playersData).forEach((playerId) => {
          const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
          update(playerRef, { vote: null });
        });
      }
      // Importante: desconectar este listener depois de usá-lo
      off(playersRef);
    }, { onlyOnce: true });
    
    // Limpar estado local
    setUserVote(null);
  };

  // Efeito adicional para processar o reset do round
  useEffect(() => {
    if (!revealed) {
      // Limpar animações e estados quando voltamos para o estado não revelado
      setVotingProgress(0);
    }
  }, [revealed]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Calcular estatísticas
  const calculateStats = () => {
    if (!players.length) return { average: 0, mode: 0 };
    
    // Filtrar jogadores com votos
    const votes = players
      .filter(player => player.vote !== null)
      .map(player => player.vote);
    
    if (!votes.length) return { average: 0, mode: 0 };
    
    // Calcular média
    const sum = votes.reduce((acc, vote) => acc + vote, 0);
    const average = (sum / votes.length).toFixed(1);
    
    // Calcular moda (voto mais frequente)
    const voteCounts = votes.reduce((acc, vote) => {
      acc[vote] = (acc[vote] || 0) + 1;
      return acc;
    }, {});
    
    const maxVote = Object.entries(voteCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      average,
      mode: maxVote ? maxVote[0] : 0
    };
  };

  const stats = calculateStats();
  const onlinePlayers = players.filter(player => player.online);
  const votedPlayers = players.filter(player => player.vote !== null && player.vote !== undefined);
  const allVoted = () => {
    if (!players.length) return false;
    // Verifica se todos os jogadores votaram (exceto espectadores)
    return players.filter(p => !p.isSpectator).every(p => p.vote !== null && p.vote !== undefined);
  };

  // Definição dos valores de carta disponíveis com ícones
  const cardValues = [
    { value: '0', icon: <FaFeather />, label: 'Tranquilo' },
    { value: '1', icon: null, label: 'XS' },
    { value: '2', icon: null, label: 'S' },
    { value: '3', icon: null, label: 'S+' },
    { value: '5', icon: null, label: 'M' },
    { value: '8', icon: null, label: 'L' },
    { value: '13', icon: null, label: 'XL' },
    { value: '21', icon: null, label: 'XXL' },
    { value: '34', icon: null, label: 'XXXL' },
    { value: '55', icon: null, label: 'Gigante' },
    { value: '89', icon: null, label: 'Colossal' },
    { value: '144', icon: null, label: 'Épico' },
    { value: '233', icon: null, label: 'Lendário' },
    { value: '?', icon: <FaQuestion />, label: 'Não sei' },
    { value: '∞', icon: <FaInfinity />, label: 'Complexo demais' },
  ];

  // Função para converter valor de voto para comparação numérica
  const getVoteValue = (vote) => {
    if (vote === '∞') return Infinity;
    if (vote === '?') return -1; // Tratar '?' como valor baixo para ordenação
    return parseFloat(vote);
  };

  // Função para determinar o papel do jogador (criador ou regular)
  const getPlayerRole = (playerId) => {
    if (players && players.some(player => player.id === playerId && player.role === 'creator')) {
      return 'creator';
    }
    return 'player';
  };

  // Verifica se um jogador realmente votou
  const hasPlayerVoted = (vote) => {
    return vote !== undefined && vote !== null;
  };

  // Função para calcular média numérica (ignorando valores não numéricos)
  const calculateNumericAverage = () => {
    const votes = Object.values(players)
      .filter(player => player.vote)
      .map(player => player.vote)
      .filter(vote => !isNaN(parseFloat(vote)) && vote !== '∞' && vote !== '?');
    
    if (votes.length === 0) return 'N/A';
    
    const sum = votes.reduce((total, vote) => total + parseFloat(vote), 0);
    return (sum / votes.length).toFixed(1);
  };
  
  // Função para calcular a moda (valor mais frequente)
  const calculateMode = () => {
    const votes = Object.values(players)
      .filter(player => player.vote)
      .map(player => player.vote);
    
    if (votes.length === 0) return 'N/A';
    
    // Conta a frequência de cada valor
    const frequency = {};
    votes.forEach(vote => {
      frequency[vote] = (frequency[vote] || 0) + 1;
    });
    
    // Encontra o(s) valor(es) mais frequente(s)
    let maxFrequency = 0;
    let modes = [];
    
    for (const vote in frequency) {
      if (frequency[vote] > maxFrequency) {
        maxFrequency = frequency[vote];
        modes = [vote];
      } else if (frequency[vote] === maxFrequency) {
        modes.push(vote);
      }
    }
    
    // Retorna o(s) valor(es) mais frequente(s)
    return modes.join(', ');
  };
  
  // Função para calcular a mediana (valor central)
  const calculateMedian = () => {
    // Filtra apenas valores numéricos válidos
    const votes = Object.values(players)
      .filter(player => player.vote)
      .map(player => player.vote)
      .filter(vote => !isNaN(parseFloat(vote)) && vote !== '∞' && vote !== '?')
      .map(vote => parseFloat(vote))
      .sort((a, b) => a - b);
    
    if (votes.length === 0) return 'N/A';
    
    const middle = Math.floor(votes.length / 2);
    
    if (votes.length % 2 === 0) {
      // Se houver um número par de votos, a mediana é a média dos dois valores centrais
      return ((votes[middle - 1] + votes[middle]) / 2).toFixed(1);
    } else {
      // Se houver um número ímpar de votos, a mediana é o valor central
      return votes[middle].toString();
    }
  };
  
  // Verifica se todos os votos são iguais para esconder o "versus"
  const allVotesEqual = () => {
    const votes = Object.values(players)
      .filter(player => hasPlayerVoted(player.vote))
      .map(player => player.vote);
    
    if (votes.length <= 1) return true;
    
    const firstVote = votes[0];
    return votes.every(vote => vote === firstVote);
  };

  // Função para verificar se há votos infinitos
  const hasInfiniteVotes = () => {
    return players.some(player => 
      player.vote === '∞' && 
      player.vote !== null && 
      player.vote !== undefined
    );
  };

  // Função para verificar se a diferença é significativa
  const hasSigificantDifference = () => {
    const extremeVoters = getExtremeVoters();
    
    if (!extremeVoters.lowest || !extremeVoters.highest) {
      return false;
    }
    
    // Se algum voto for especial, já consideramos significativo
    if (hasSpecialVotes()) {
      return true;
    }
    
    // Certifique-se de que estamos trabalhando com números
    const lowestVote = typeof extremeVoters.lowest.vote === 'string' && !isNaN(Number(extremeVoters.lowest.vote)) 
      ? Number(extremeVoters.lowest.vote) 
      : extremeVoters.lowest.vote;
      
    const highestVote = typeof extremeVoters.highest.vote === 'string' && !isNaN(Number(extremeVoters.highest.vote)) 
      ? Number(extremeVoters.highest.vote) 
      : extremeVoters.highest.vote;
    
    // Verifica se ambos são números
    if (typeof lowestVote === 'number' && typeof highestVote === 'number') {
      // Diferença significativa se:
      // 1. A proporção entre o maior e o menor é >=2 (ex: 8 vs 4)
      // 2. A diferença absoluta é >= 5 (ex: 13 vs 8)
      return (lowestVote > 0 && highestVote / lowestVote >= 2) || 
             (highestVote - lowestVote >= 5);
    }
    
    return false;
  };

  // Componente para exibir erro de cálculo com glitch
  const GlitchText = ({ text }) => {
    return (
      <motion.div
        className="inline-block relative font-mono"
        animate={{
          x: [0, -3, 5, -2, 0, 2, -5, 3, 0],
          y: [0, 2, -1, 0, -2, 1, 0]
        }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        <motion.span
          className="absolute top-0 left-0 text-red-500 opacity-70"
          animate={{
            x: [-1, 1, 0, -2, 0, 1, 0],
            opacity: [0.7, 0.3, 0.7]
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity
          }}
        >
          {text}
        </motion.span>
        
        <motion.span
          className="absolute top-0 left-0 text-blue-500 opacity-70"
          animate={{
            x: [1, -1, 0, 2, 0, -1, 0],
            opacity: [0.7, 0.5, 0.7]
          }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            repeat: Infinity
          }}
        >
          {text}
        </motion.span>
        
        <span className="relative">
          {text}
        </span>
      </motion.div>
    );
  };

  // 1. Adicione um botão de debug temporário (no topo)
  useEffect(() => {
    // Log de montagem e desmontagem do componente
    console.log("Room component mounted - roomCode:", roomCode);
    
    // Adiciona botão de debug temporário
    const addDebugButton = () => {
      const existingButton = document.getElementById('debug-modal-button');
      if (!existingButton) {
        const button = document.createElement('button');
        button.id = 'debug-modal-button';
        button.innerText = 'Abrir Modal (Debug)';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.right = '10px';
        button.style.zIndex = '9999';
        button.style.padding = '8px 16px';
        button.style.background = '#ff5722';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.onclick = () => {
          console.log("Botão debug clicado");
          setShowVoteComparisonLocal(true);
        };
        document.body.appendChild(button);
      }
    };
    
    //addDebugButton();
    
    return () => {
      console.log("Room component unmounted");
      const button = document.getElementById('debug-modal-button');
      if (button) button.remove();
    };
  }, []);

  // Mantenha também o listener do Firebase
  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}/showVoteComparison`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const showComparison = snapshot.val();
      console.log("showVoteComparison do Firebase atualizado:", showComparison);
      
      // Apenas EXIBE o modal quando Firebase diz para mostrar
      if (showComparison === true) {
        setShowVoteComparisonLocal(true);
      }
      // Quando o valor é false, isso significa um reset da sala, então fechamos
      // Isso permite que um novo jogo force o fechamento dos modais para todos
      else if (showComparison === false) {
        setShowVoteComparisonLocal(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  // Adicionar listener para o estado do modal de entendimento no Firebase
  useEffect(() => {
    const modalRef = ref(database, `rooms/${roomCode}/showUnderstandingModal`);
    
    const unsubscribe = onValue(modalRef, (snapshot) => {
      const showModal = snapshot.val();
      console.log("showUnderstandingModal do Firebase atualizado:", showModal);
      
      // Apenas EXIBE o modal quando Firebase diz para mostrar
      if (showModal === true) {
        setShowUnderstandingModal(true);
      }
      // Quando o valor é false, isso significa um reset da sala, então fechamos
      else if (showModal === false) {
        setShowUnderstandingModal(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  // Adicionar listener para o estado do modal de tarefa complexa no Firebase
  useEffect(() => {
    const modalRef = ref(database, `rooms/${roomCode}/showComplexTaskModal`);
    
    const unsubscribe = onValue(modalRef, (snapshot) => {
      const showModal = snapshot.val();
      console.log("showComplexTaskModal do Firebase atualizado:", showModal);
      
      if (showModal === true) {
        setShowComplexTaskModal(true);
      } else if (showModal === false) {
        setShowComplexTaskModal(false);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  // Componente de Confetes
  const Confetti = () => {
    const confettiCount = 150;
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    // Gera confetes com tamanhos, cores e posições aleatórias
    const confetti = [...Array(confettiCount)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -20 - Math.random() * 100,
      size: 5 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
    }));

    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ 
              x: `${piece.x}vw`, 
              y: `${piece.y}vh`, 
              rotate: piece.rotation 
            }}
            animate={{ 
              y: '120vh',
              x: `${piece.x + (Math.random() * 20 - 10)}vw`,
              rotate: piece.rotation + (Math.random() * 360)
            }}
            transition={{ 
              duration: 4 + Math.random() * 4,
              delay: Math.random() * 2,
              ease: [0.1, 0.4, 0.8, 1]
            }}
            style={{ 
              position: 'absolute',
              width: `${piece.size}px`,
              height: `${piece.size * 0.4}px`,
              backgroundColor: piece.color,
              borderRadius: '2px',
            }}
          />
        ))}
      </div>
    );
  };

  // Componente principal de Fogos de Artifício
  

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Navbar com informações contextuais */}
      <Navbar 
        showBackButton={true}
        onBackClick={() => navigate('/')}
        pageTitle={`Sala ${roomCode}`}
      />
      
      {/* Notificação de expulsão */}
      <AnimatePresence>
        {wasKicked && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50"
          >
            <div className="bg-red-600 text-white p-8 rounded-lg shadow-2xl flex flex-col items-center">
              <FaUserSlash className="text-4xl mb-3" />
              <h2 className="text-2xl font-bold mb-2">Você foi removido da sala</h2>
              <p>O organizador removeu você desta sessão.</p>
              <p className="mt-2">Redirecionando para a página inicial...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modal de confirmação de expulsão */}
      <AnimatePresence>
        {showKickConfirmation && playerToKick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-red-600 dark:text-red-400">
                <FaUserSlash className="mr-2" /> Remover Jogador
              </h3>
              <p className="mb-6">
                Tem certeza que deseja remover <strong>{playerToKick.name}</strong> da sala?
                Este jogador não poderá retornar com o mesmo ID.
              </p>
              <div className="flex justify-end space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelKickPlayer}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={confirmKickPlayer}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Remover
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className="flex flex-col items-center p-6">
        <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full mb-4 text-blue-600 dark:text-blue-300 flex items-center">
          <FaUsers className="mr-2" /> 
          <span>{onlinePlayers.length} jogadores online</span>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto p-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                {task}</h2>
              <p className="text-gray-600 dark:text-gray-300">{taskDescription}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Progresso de votação com animação de preenchimento */}
        {!revealed && players.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span>Progresso da votação</span>
              <motion.span
                animate={{ scale: votedPlayers.length === players.length ? [1, 1.1, 1] : 1 }}
                transition={{ repeat: votedPlayers.length === players.length ? Infinity : 0, repeatDelay: 1 }}
                className={votedPlayers.length === players.length ? "font-bold text-green-500" : ""}
              >
                {votedPlayers.length} de {players.length} jogadores votaram
              </motion.span>
            </div>
            <div className="w-full bg-gray-300 dark:bg-gray-700 h-4 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(votedPlayers.length / players.length) * 100}%` }}
                className={`h-full ${votedPlayers.length === players.length ? 'bg-green-500' : 'bg-blue-600'}`}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
        
        {/* Cartões de votação - versão simplificada e garantida */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-6">Escolha seu cartão:</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {cardValues.map(card => (
              <motion.div
                key={card.value}
                onClick={() => !revealed && handleCardClick(card.value)}
                whileHover={{ scale: revealed ? 1 : 1.05 }}
                whileTap={{ scale: revealed ? 1 : 0.95 }}
                className={`
                  bg-white dark:bg-gray-800 rounded-xl shadow-md
                  h-40 flex flex-col items-center justify-center p-3 relative
                  border-2 ${userVote === card.value 
                    ? 'border-blue-500 ring-2 ring-blue-400' 
                    : 'border-gray-200 dark:border-gray-700'}
                  ${revealed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Valor no canto superior esquerdo */}
                <div className="absolute top-2 left-2 text-lg font-bold">
                  {card.value}
                </div>
                
                {/* Conteúdo central */}
                <div className="flex flex-col items-center">
                  {card.icon && (
                    <div className="text-3xl mb-2 text-blue-500">
                      {card.icon}
                    </div>
                  )}
                  <div className="text-3xl font-bold">
                    {card.value}
                  </div>
                </div>
                
                {/* Valor no canto inferior direito */}
                <div className="absolute bottom-2 right-2 text-lg font-bold rotate-180">
                  {card.value}
                </div>
                
                {/* Etiqueta descritiva */}
                <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-600 dark:text-gray-400">
                  {card.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* 6. Modal VS - correções para funcionar com todos os tipos de votos */}
        <AnimatePresence>
          {(showVoteComparisonLocal) && (
            <motion.div
              key="vote-comparison-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            >
              {console.log("Renderizando modal com extreme voters:", getExtremeVoters())}
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl m-4 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl shadow-2xl text-white overflow-hidden relative"
              >
                {/* Botão de fechar */}
                <button 
                  onClick={closeVoteComparison}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                >
                  <FaTimes />
                </button>
                
                <div className="px-6 py-8">
                  <h3 className="text-center text-2xl font-bold mb-8 flex items-center justify-center">
                    <FaBolt className="mr-2 text-yellow-300" /> Confronto de Estimativas
                  </h3>
                  
                  <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
                    {/* Estimativa mais baixa */}
                    <motion.div 
                      initial={{ x: "-100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ 
                        type: "spring", 
                        damping: 25, 
                        stiffness: 120,
                        delay: 0.3 
                      }}
                      className="bg-blue-700 p-6 rounded-lg shadow-lg flex-1 text-center w-full"
                    >
                      <div className="flex items-center justify-center mb-3">
                        <FaArrowDown className="text-blue-300 mr-2 text-xl" />
                        <span className="font-semibold text-lg">Estimativa Mais Baixa</span>
                      </div>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring" }}
                        className="text-5xl font-bold mb-3"
                      >
                        {getExtremeVoters().lowest?.vote || "-"}
                      </motion.div>
                      <div className="font-medium text-xl">{getExtremeVoters().lowest?.name || ""}</div>
                    </motion.div>
                    
                    {/* VS no meio */}
                    <div className="flex items-center justify-center">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1,
                          opacity: 1
                        }}
                        transition={{ 
                          type: "spring",
                          damping: 5,
                          stiffness: 80,
                          delay: 0.8
                        }}
                        className="relative"
                      >
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, 0, -5, 0],
                            color: ["#ffffff", "#ffdd00", "#ffffff"]
                          }}
                          transition={{ 
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 0.5
                          }}
                          className="text-6xl font-bold px-6"
                          style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}
                        >
                          VS
                        </motion.div>
                      </motion.div>
                    </div>
                    
                    {/* Estimativa mais alta */}
                    <motion.div 
                      initial={{ x: "100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ 
                        type: "spring", 
                        damping: 25, 
                        stiffness: 120,
                        delay: 0.3 
                      }}
                      className="bg-purple-700 p-6 rounded-lg shadow-lg flex-1 text-center w-full"
                    >
                      <div className="flex items-center justify-center mb-3">
                        <FaArrowUp className="text-purple-300 mr-2 text-xl" />
                        <span className="font-semibold text-lg">Estimativa Mais Alta</span>
                      </div>
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.6, type: "spring" }}
                        className="text-5xl font-bold mb-3"
                      >
                        {/* Formata o valor para exibição especial de complexo demais */}
                        {getExtremeVoters().highest?.vote === "∞" || 
                         getExtremeVoters().highest?.vote === "complexo demais" ? 
                         "∞" : getExtremeVoters().highest?.vote || "-"}
                      </motion.div>
                      <div className="font-medium text-xl">{getExtremeVoters().highest?.name || ""}</div>
                    </motion.div>
                  </div>
                  
                  {/* Detalhes da diferença - com mensagem de diferença significativa */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="mt-8 text-center"
                  >
                    <p className="text-white opacity-90 flex items-center justify-center text-lg flex-wrap">
                      
                      {hasSpecialVotes() ? (
                        <span>
                         
                        </span>
                      ) : (
                        <>
                          Diferença de: 
                          <span className="font-bold mx-1">
                            {getExtremeVoters().highest && getExtremeVoters().lowest && 
                             typeof getExtremeVoters().highest.vote === 'number' && 
                             typeof getExtremeVoters().lowest.vote === 'number' ? 
                              (getExtremeVoters().highest.vote - getExtremeVoters().lowest.vote) : "-"}
                          </span> pontos!
                        </>
                      )}
                    </p>
                    
                    {/* Mensagem sobre diferença significativa */}
                    {!hasSpecialVotes() && hasSigificantDifference() && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                        className="mt-3 text-yellow-200 bg-yellow-600/20 p-3 rounded-lg mx-auto max-w-2xl"
                      >
                        <FaExclamationTriangle className="inline-block mr-2" />
                        Essa diferença significativa pode indicar um entendimento diverso sobre a tarefa ou perspectivas diferentes sobre sua complexidade.
                      </motion.div>
                    )}
                    
                    {/* Mensagem específica para valores especiais (já existe, mantida para referência) */}
                    {hasSpecialVotes() && (
                      <motion.div
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="mt-3 text-yellow-200 bg-yellow-600/20 p-3 rounded-lg mx-auto max-w-2xl"
                      >
                        <FaQuestion className="inline-block mr-2" />
                        Essa estimativa sugere que a tarefa precisa ser melhor compreendida ou dividida antes de ser estimada.
                      </motion.div>
                    )}
                  </motion.div>
                  
                  {/* Botão para fechar o modal */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                    onClick={closeVoteComparison}
                    className="mt-8 px-8 py-3 bg-white/20 hover:bg-white/30 rounded-full mx-auto block transition-colors"
                  >
                    Entendi
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Novo Modal de Entendimento Completo - exibindo pontos no lugar do emoji */}
        <AnimatePresence>
          {showUnderstandingModal && (
            <>
              {/* Componentes de celebração */}
              <Confetti />
             
              
              <motion.div
                key="understanding-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-4xl m-4 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl shadow-2xl text-white overflow-hidden relative"
                >
                  {/* Botão de fechar */}
                  <button 
                    onClick={closeUnderstandingModal}
                    className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                  >
                    <FaTimes />
                  </button>
                  
                  <div className="px-6 py-8">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="text-center text-2xl font-bold mb-4 flex items-center justify-center">
                        <FaCheckCircle className="mr-2 text-green-200" /> Entendimento Completo!
                      </h3>
                      
                      <div className="flex justify-center">
                        {/* Pontuação em destaque no lugar do emoji */}
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: 1
                          }}
                          transition={{ 
                            type: "tween",
                            duration: 1.5,
                            delay: 0.4
                          }}
                          className="flex flex-col items-center mb-6"
                        >
                          <div className="text-xs uppercase tracking-wider text-green-200 mb-1">Estimativa</div>
                          <div className="text-9xl font-bold relative">
                            {allVoted() ? votedPlayers[0].vote : ''}
                            
                            {/* Efeito de brilho */}
                            <motion.div 
                              className="absolute inset-0 rounded-full"
                              style={{ 
                                boxShadow: "0 0 30px rgba(0, 255, 170, 0.8), 0 0 15px rgba(0, 255, 200, 0.4)",
                                zIndex: -1
                              }}
                              animate={{ 
                                opacity: [0.5, 0.8, 0.5]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                          </div>
                          <div className="text-xl text-green-200 mt-1">pontos</div>
                        </motion.div>
                      </div>
                      
                      <div className="text-center text-xl mb-4">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          Todos concordaram com esta estimativa!
                        </motion.div>
                      </div>
                      
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="mt-6 bg-green-700/30 p-4 rounded-lg max-w-2xl mx-auto text-center"
                      >
                        <p className="flex items-center justify-center flex-wrap">
                          <FaRegLightbulb className="mr-2 text-green-200" />
                          Este alinhamento demonstra um entendimento comum sobre o escopo e complexidade da tarefa.
                        </p>
                      </motion.div>
                      
                      {votedPlayers.length >= 3 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="mt-4 text-center text-green-200"
                        >
                          <FaTrophy className="inline-block mr-2" />
                          Alinhamento perfeito entre {votedPlayers.length} participantes!
                        </motion.div>
                      )}
                    </motion.div>
                    
                    {/* Botão para fechar o modal */}
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      onClick={closeUnderstandingModal}
                      className="mt-8 px-8 py-3 bg-white/20 hover:bg-white/30 rounded-full mx-auto block transition-colors"
                    >
                      Entendi
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        {/* Corrigindo o Modal para Tarefas Complexas - fechando todas as tags corretamente */}
        <AnimatePresence>
          {showComplexTaskModal && (
            <motion.div
              key="complex-task-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl m-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-2xl text-white overflow-hidden relative"
              >
                {/* Botão de fechar */}
                <button 
                  onClick={closeComplexTaskModal}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
                >
                  <FaTimes />
                </button>
                
                <div className="px-6 py-8">
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-center text-2xl font-bold mb-4 flex items-center justify-center">
                      <FaExclamationTriangle className="mr-2 text-yellow-200" /> 
                      Tarefa Precisa de Refinamento
                    </h3>
                    
                    <div className="flex justify-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center mb-6"
                      >
                        <div className="text-xs uppercase tracking-wider text-yellow-200 mb-1">
                          Todos votaram
                        </div>
                        <div className="text-9xl font-bold">
                          {getCommonSpecialVote() === "∞" || 
                           getCommonSpecialVote() === "complexo demais" ? "∞" : 
                           getCommonSpecialVote() === "?" ? "?" :
                           getCommonSpecialVote() === "☕" ? "☕" : "?"}
                        </div>
                        <div className="text-xl text-yellow-200 mt-1">
                          {getCommonSpecialVote() === "∞" || 
                           getCommonSpecialVote() === "complexo demais" ? "Complexo Demais" : 
                           getCommonSpecialVote() === "?" ? "Incerteza" :
                           getCommonSpecialVote() === "☕" ? "Pausa" : "Valor Especial"}
                        </div>
                      </motion.div>
                    </div>
                    
                    <div className="text-center text-xl mb-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        Todos os {votedPlayers.length} participantes concordam: esta tarefa precisa de atenção!
                      </motion.div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="mt-6 bg-orange-700/30 p-4 rounded-lg max-w-3xl mx-auto"
                    >
                      <h4 className="font-bold text-center mb-3 flex items-center justify-center">
                        <FaLightbulb className="mr-2 text-yellow-200" /> Sugestões:
                      </h4>
                      
                      {getCommonSpecialVote() === "∞" || getCommonSpecialVote() === "complexo demais" ? (
                        <ul className="space-y-3">
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Divida esta tarefa em partes menores e mais gerenciáveis</span>
                          </li>
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Discuta os requisitos específicos com as partes interessadas</span>
                          </li>
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Considere uma sessão de refinamento separada para esta tarefa</span>
                          </li>
                        </ul>
                      ) : getCommonSpecialVote() === "?" ? (
                        <ul className="space-y-3">
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Esclareça os critérios de aceitação com o Product Owner</span>
                          </li>
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Identifique quais informações técnicas estão faltando</span>
                          </li>
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Considere um spike técnico para explorar a solução</span>
                          </li>
                        </ul>
                      ) : (
                        <ul className="space-y-3">
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Discuta com a equipe para entender melhor as preocupações</span>
                          </li>
                          <li className="flex items-start">
                            <FaArrowRight className="mt-1 mr-2 flex-shrink-0 text-yellow-200" />
                            <span>Revise os requisitos e esclareça o escopo da tarefa</span>
                          </li>
                        </ul>
                      )}
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="mt-6 text-center"
                    >
                      <p className="text-yellow-200 italic">
                        Este não é um fracasso! Identificar problemas cedo economiza tempo e recursos.
                      </p>
                    </motion.div>
                  </motion.div>
                  
                  {/* Botão para fechar o modal */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    onClick={closeComplexTaskModal}
                    className="mt-8 px-8 py-3 bg-white/20 hover:bg-white/30 rounded-full mx-auto block transition-colors"
                  >
                    Entendi
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Botões com animações */}
        <div className="flex justify-center my-8 space-x-4">
          {/* Botão de revelar - agora verifica se é o criador */}
          {userVote && !revealed && (isCreator || roomCreatorId === null) && (
            <motion.button
              onClick={handleReveal}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={allVoted() ? { 
                scale: [1, 1.05, 1],
                boxShadow: ["0px 0px 0px rgba(59, 130, 246, 0)", "0px 0px 15px rgba(59, 130, 246, 0.5)", "0px 0px 10px rgba(59, 130, 246, 0.3)"]
              } : {}}
              transition={{ 
                repeat: allVoted() ? Infinity : 0,
                repeatDelay: 1
              }}
              disabled={!allVoted() && players.length > 1}
              className={`px-6 py-3 text-white rounded transition-colors flex items-center ${
                !allVoted() && players.length > 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <FaEye className="mr-2" /> 
              {players.length > 1 && !allVoted() ? 'Aguardando votos...' : 'Revelar Votos'}
            </motion.button>
          )}
          
          {/* Mensagem para não criadores */}
          {userVote && !revealed && !isCreator && roomCreatorId !== null && (
            <motion.div 
              animate={{ 
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-gray-600 dark:text-gray-300 text-center"
            >
              Aguardando o organizador revelar os votos...
            </motion.div>
          )}
          
          {/* Botão de nova rodada - somente para o criador */}
          {revealed && (isCreator || roomCreatorId === null) && (
            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
              className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
            >
              <FaRedo className="mr-2" /> Nova Rodada
            </motion.button>
          )}
        </div>
        
        {/* Lista de jogadores com lógica de voto corrigida */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <FaUsers className="mr-2 text-blue-500" /> Participantes ({Object.keys(players).length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(players).map(([playerId, player]) => (
              <div 
                key={playerId}
                className={`
                  p-3 rounded-md flex items-center justify-between
                  ${hasPlayerVoted(player.vote) ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}
                  ${playerId === userId ? 'border-2 border-blue-400 dark:border-blue-500' : ''}
                `}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {player.name} {playerId === userId && "(Você)"}
                    {getPlayerRole(playerId) === 'creator' && (
                      <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
                        Organizador
                      </span>
                    )}
                  </div>
                  
                  {/* Status de voto corrigido */}
                  {hasPlayerVoted(player.vote) ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {revealed ? (
                        <span className="font-mono font-medium text-green-600 dark:text-green-400">
                          {player.vote}
                        </span>
                      ) : (
                        "Votou ✓"
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Não votou
                    </div>
                  )}
                </div>
                
                {isCreator && playerId !== userId && (
                  <button
                    onClick={() => handleKickPlayer(player)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    title="Remover jogador"
                  >
                    <FaUserSlash />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Notificação de mudança de dono */}
        <AnimatePresence>
          {showOwnerChangedNotification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center"
            >
              <FaTrophy className="text-yellow-300 mr-3 text-xl" />
              <div>
                <p className="font-semibold">Transferência de propriedade da sala!</p>
                <p>
                  {previousOwnerId === userId 
                    ? `Você saiu e ${newOwnerName} é o novo organizador.` 
                    : `${newOwnerName} é o novo organizador da sala.`}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Resultados da votação quando revelados */}
        {revealed && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-6">
            <h3 className="text-xl font-bold mb-4">
              Média: {hasInfiniteVotes() ? (
                <GlitchText text="ERROR" />
              ) : (
                calculateNumericAverage()
              )}
            </h3>
            
            {hasInfiniteVotes() && (
              <motion.div 
                className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-yellow-700 dark:text-yellow-500 mb-4"
                animate={{opacity: [0.7, 1, 0.7]}}
                transition={{duration: 2, repeat: Infinity}}
              >
                <FaRegLightbulb className="inline-block mr-2" />
                Não é possível calcular a média de "∞" (infinito).
              </motion.div>
            )}
            
            {/* Quadro com estatísticas dos votos */}
            
            
            {/* Votos de alta vs baixa - apenas quando há divergência */}
            {!allVotesEqual() && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
                <h4 className="text-lg font-semibold mb-3">Maiores vs. Menores</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-green-600 dark:text-green-400 mb-2">Estimativas Mais Baixas</h5>
                    <div className="space-y-2">
                      {getExtremeVoters().lowest && getExtremeVoters().highest && getExtremeVoters().lowest.vote !== getExtremeVoters().highest.vote && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded flex justify-between">
                          <span>{getExtremeVoters().lowest.name}</span>
                          <span className="font-mono font-bold">{getExtremeVoters().lowest.vote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-600 dark:text-red-400 mb-2">Estimativas Mais Altas</h5>
                    <div className="space-y-2">
                      {getExtremeVoters().highest && getExtremeVoters().lowest && getExtremeVoters().highest.vote !== getExtremeVoters().lowest.vote && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded flex justify-between">
                          <span>{getExtremeVoters().highest.name}</span>
                          <span className="font-mono font-bold">{getExtremeVoters().highest.vote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Room;
