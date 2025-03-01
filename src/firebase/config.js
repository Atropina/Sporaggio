import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {

  };
// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Inicialize o Realtime Database e obtenha uma referência para o serviço
const database = getDatabase(app);

export { database }; 