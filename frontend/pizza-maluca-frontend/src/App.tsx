import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Game from './Game';
import './index.css';
import type { PlayerState } from './structures';

// Cria a conexão com o backend via Socket.IO
const socket: Socket = io('http://localhost:3001');

const App: React.FC = () => {
  // Estado do jogador atual
  const [me, setMe] = useState<{id: string; name: string} | null>(null);
  // Estado da lista de jogadores
  const [players, setPlayers] = useState<PlayerState[]>([]);
  // Estado de fim de jogo (vencedor)
  const [gameOver, setGameOver] = useState<{winner: string; name: string} | null>(null);

  useEffect(() => {
    // Recebe confirmação de entrada
    socket.on('joined', setMe);
    // Recebe atualizações do estado do jogo
    socket.on('state', state => setPlayers(state.players));
    // Recebe evento de fim de jogo
    socket.on('gameOver', setGameOver);
  }, []);

  // Função para entrar no jogo
  const join = () => { const name = prompt('Seu nome:') || 'Jogador'; socket.emit('join', name); };

  // Tela de fim de jogo
  if (gameOver) return <div className="card"><h2>Vencedor: {gameOver.name}</h2></div>;
  // Tela de entrada
  if (!me) return <div id="wrapper"><div id="sidebar"><button onClick={join}>Entrar na Pizzaria</button></div></div>;
  // Tela principal do jogo
  return <div id="wrapper"><div id="sidebar"><h2>Jogadores</h2><ul className="player-list">{players.map(p => <li key={p.id}>{p.name}: {p.score}</li>)}</ul></div><div id="main"><Game socket={socket} me={me} players={players} gameOver={gameOver}/></div></div>;
};

export default App;
