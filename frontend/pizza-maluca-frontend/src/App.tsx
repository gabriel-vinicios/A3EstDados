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
  const [gameOver, setGameOver] = useState<{name: string} | null>(null);
  // --- NOVO ESTADO E FLUXO ---
  const [step, setStep] = useState<'welcome'|'lobby'|'game'|'end'>('welcome');
  const [room, setRoom] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [instructions, setInstructions] = useState(false);
  const [minPlayers] = useState(2);
  const [maxPlayers] = useState(2);
  const [salas, setSalas] = useState<string[]>([]);
  const [carregandoSalas, setCarregandoSalas] = useState(false);
  const [erro, setErro] = useState<string>('');
  // Novo estado para ingredientes do vencedor
  const [winnerIngredients, setWinnerIngredients] = useState<string[]>([]);

  useEffect(() => {
    socket.on('joined', (me) => {
      setMe(me);
      setStep('lobby');
      setErro('');
      socket.emit('listarSalas');
    });
    socket.on('state', state => {
      setPlayers(state.players); // Atualiza sempre os jogadores, incluindo posição
      if(state.started) setStep('game');
      if(state.winner) setGameOver({ name: state.winner.name });
    });
    socket.on('gameOver', (data) => {
      setGameOver({ name: data.name });
      setWinnerIngredients(data.ingredients || []);
      setStep('end');
    });
    socket.on('gameRestarted', () => {
      setGameOver(null);
      setWinnerIngredients([]);
      setStep('lobby');
    });
    socket.on('salasDisponiveis', (lista) => setSalas(lista));
    socket.on('erro', (msg) => {
      setErro(msg);
    });
    socket.on('disconnect', () => {
      setMe(null);
      setStep('welcome');
      setErro('Desconectado do servidor.');
    });
    // Solicita lista de salas ao abrir tela de boas-vindas
    if (step === 'welcome') {
      setCarregandoSalas(true);
      socket.emit('listarSalas');
      setTimeout(() => setCarregandoSalas(false), 500);
    }
    return () => {
      socket.off('joined');
      socket.off('state');
      socket.off('gameOver');
      socket.off('gameRestarted');
      socket.off('salasDisponiveis');
      socket.off('erro');
      socket.off('disconnect');
    };
  }, [step]);

  const handleJoin = (sala?: string) => {
    setErro('');
    if (!name || (!room && !sala)) {
      setErro('Preencha nome e sala!');
      return;
    }
    const salaEscolhida = sala || room;
    setRoom(salaEscolhida);
    socket.emit('joinRoom', { name, room: salaEscolhida });
  };
  const handleStart = () => socket.emit('startGame', room);
  const handleLeave = () => {
    socket.emit('leaveRoom', room);
    setMe(null);
    setStep('welcome');
    setTimeout(() => socket.emit('listarSalas'), 500);
  };
  const handleRestart = () => {
    socket.emit('restartGame', room);
    setGameOver(null);
    setStep('lobby');
  };
  const handleCriarSala = () => {
    setErro('');
    if (!name || !room) {
      setErro('Preencha nome e sala!');
      return;
    }
    handleJoin();
  };
  const handleAtualizarSalas = () => {
    setCarregandoSalas(true);
    socket.emit('listarSalas');
    setTimeout(() => setCarregandoSalas(false), 500);
  };

  // --- TELAS ---
  if (instructions) return (
    <div className="card">
      <h2>Instruções</h2>
      <ul>
        <li>Entre com seu nome e selecione ou crie uma sala para jogar.</li>
        <li>Espere outro jogador entrar no lobby.</li>
        <li>O jogo começa quando ambos estiverem prontos.</li>
        <li>Complete sua pizza com 6 ingredientes únicos para vencer!</li>
      </ul>
      <button onClick={() => setInstructions(false)}>Voltar</button>
    </div>
  );
  if (step === 'welcome') return (
    <div className="card">
      <h2>Bem-vindo à Pizzaria Maluca!</h2>
      {erro && <div style={{color:'red',marginBottom:8}}>{erro}</div>}
      <input placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} />
      <div style={{margin:'1em 0'}}>
        <strong>Salas Disponíveis:</strong>
        <button style={{marginLeft:8}} onClick={handleAtualizarSalas} disabled={carregandoSalas}>Atualizar</button>
        <ul className="player-list">
          {salas.length === 0 && <li>Nenhuma sala disponível</li>}
          {salas.map(sala => (
            <li key={sala}>
              <button style={{marginRight:8}} onClick={() => handleJoin(sala)}>Entrar</button>
              {sala}
            </li>
          ))}
        </ul>
      </div>
      <input placeholder="Criar nova sala" value={room} onChange={e => setRoom(e.target.value)} />
      <button onClick={handleCriarSala}>Criar e Entrar</button>
      <button onClick={() => setInstructions(true)}>Instruções</button>
    </div>
  );
  if (step === 'lobby') return (
    <div className="card">
      <h2>Lobby da Sala: {room}</h2>
      {erro && <div style={{color:'red',marginBottom:8}}>{erro}</div>}
      <div>Jogadores ({players.length}/{maxPlayers}):</div>
      <ul className="player-list">{players.map(p => <li key={p.id}>{p.name}</li>)}</ul>
      <div>Mínimo: {minPlayers} | Máximo: {maxPlayers}</div>
      <button onClick={handleStart} disabled={players.length < minPlayers}>Iniciar Jogo</button>
      <button onClick={handleLeave}>Sair</button>
    </div>
  );
  if (step === 'end' || gameOver) return (
    <div className="card">
      <h2>Vencedor: {gameOver?.name}</h2>
      {winnerIngredients.length > 0 ? (
        <div style={{margin:'1em 0'}}>
          <strong>Ingredientes coletados:</strong>
          <div style={{fontSize:'2em',marginTop:4}}>
            {winnerIngredients.map((i, idx) => <span key={idx} style={{margin:'0 4px'}}>{i}</span>)}
          </div>
        </div>
      ) : (
        <div style={{margin:'1em 0'}}>Nenhum ingrediente coletado.</div>
      )}
      <button onClick={handleRestart}>Reiniciar</button>
    </div>
  );
  // Tela principal do jogo
  return (
    <div id="wrapper">
      <div id="sidebar">
        <h2>Jogadores</h2>
        <ul className="player-list">{players.map(p => <li key={p.id}>{p.name}</li>)}</ul>
        <button onClick={handleLeave}>Sair</button>
      </div>
      <div id="main">
        <Game socket={socket} me={me!} players={players} gameOver={gameOver} room={room} winnerIngredients={winnerIngredients}/>
      </div>
    </div>
  );
};

export default App;
