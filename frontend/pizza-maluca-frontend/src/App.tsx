import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Game from './Game';
import './index.css';
import type { PlayerState } from './structures';

const socket: Socket = io('http://localhost:3001');

const App: React.FC = () => {
  const [me, setMe] = useState<{id: string; name: string} | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [gameOver, setGameOver] = useState<{winner: string; name: string} | null>(null);

  useEffect(() => {
    socket.on('joined', setMe);
    socket.on('state', state => setPlayers(state.players));
    socket.on('gameOver', setGameOver);
  }, []);

  const join = () => { const name = prompt('Seu nome:') || 'Jogador'; socket.emit('join', name); };

  if (gameOver) return <div className="card"><h2>Vencedor: {gameOver.name}</h2></div>;
  if (!me) return <div id="wrapper"><div id="sidebar"><button onClick={join}>Entrar na Pizzaria</button></div></div>;
  return <div id="wrapper"><div id="sidebar"><h2>Jogadores</h2><ul className="player-list">{players.map(p => <li key={p.id}>{p.name}: {p.score}</li>)}</ul></div><div id="main"><Game socket={socket} me={me} players={players} gameOver={gameOver}/></div></div>;
};

export default App;
