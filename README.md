## 📋 Sobre o Projeto

Sporaggio é uma ferramenta moderna de Planning Poker para equipes ágeis realizarem estimativas de tarefas de forma colaborativa e eficiente. Desenvolvida com React e Firebase, oferece uma experiência intuitiva e em tempo real para todos os membros da equipe.

## ✨ Características Principais

- **Salas de Estimativa em Tempo Real**: Crie salas e convide sua equipe com um simples link
- **Votação Intuitiva**: Interface de cartões estilo baralho para facilitar a escolha de estimativas
- **Feedback Visual**: Visualize quem votou e compare os resultados após a revelação
- **Estatísticas Automáticas**: Cálculo automático da média das estimativas
- **Identificação de Divergências**: Compare automaticamente as estimativas mais altas e mais baixas
- **Modo Escuro**: Alternância entre modo claro e escuro para conforto visual
- **Opções Personalizadas**: Incluindo cartões especiais para tarefas "tranquilas" (0), complexas (∞) ou incertas (?)
- **Responsivo**: Funciona perfeitamente em dispositivos móveis e desktop

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: Firebase Realtime Database
- **Autenticação**: Firebase Authentication
- **Hospedagem**: Firebase Hosting
- **Gerenciamento de Estado**: React Hooks
- **Roteamento**: React Router
- **Ícones**: React Icons

## 📱 Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
 <img width="959" alt="image" src="https://github.com/user-attachments/assets/69e322ed-dc02-434b-8faf-acc089134aad" width="250" alt="Tela inicial" />
<img width="419" alt="image" src="https://github.com/user-attachments/assets/90c2b52f-c4d6-44ef-acde-f993e7fb96ec"  width="250" alt="Sala de Votação"/>
<img width="370" alt="image" src="https://github.com/user-attachments/assets/11c326f7-a281-4903-a978-9716e855fe69" width="250" alt="Resultados" />
</div>

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js
- npm ou yarn
- Conta no Firebase

### Instalação

1. Clone o repositório
   ```bash
   git clone https://github.com/seu-usuario/sporaggio.git
   cd sporaggio
   ```

2. Instale as dependências
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure o Firebase
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Ative o Realtime Database e a Autenticação
   - Adicione um arquivo `.env` na raiz do projeto com suas credenciais:
   ```
   VITE_FIREBASE_API_KEY=seu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=seu-auth-domain
   VITE_FIREBASE_PROJECT_ID=seu-project-id
   VITE_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
   VITE_FIREBASE_APP_ID=seu-app-id
   VITE_FIREBASE_DATABASE_URL=seu-database-url
   ```

4. Execute o projeto
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. Acesse `http://localhost:5173` no seu navegador

## 📖 Como Usar

### Criando uma Sala

1. Na tela inicial, insira seu nome e clique em "Criar Sala"
2. Adicione um título e descrição para a tarefa a ser estimada
3. Compartilhe o link ou código da sala com sua equipe

### Participando de uma Sala

1. Acesse o link compartilhado ou use o código da sala na tela inicial
2. Insira seu nome e clique em "Entrar"
3. Escolha um cartão que represente sua estimativa para a tarefa

### Revelando os Resultados

1. Quando todos votarem, o organizador pode clicar em "Revelar Votos"
2. O sistema exibirá a média das estimativas e destacará divergências 
3. Discuta os resultados e, se necessário, inicie uma nova rodada

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests para melhorar o projeto.

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE.md](LICENSE.md) para mais detalhes.

## 📬 Contato

Seu Nome - [lucasvieirajose@gmail.com](mailto:lucasvieirajose@gmail.com)

Link do Projeto: [https://github.com/Atropina/Sporaggio](https://github.com/Atropina/Sporaggio)

---

⭐️ **Dê uma estrela no GitHub** — isso ajuda!
