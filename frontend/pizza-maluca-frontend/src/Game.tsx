import React from 'react';
import { Socket } from 'socket.io-client';
import type { PlayerState } from './structures';

interface Props {
  socket: Socket;
  me: { id: string; name: string };
  players: PlayerState[];
  gameOver: { name?: string } | null;
  room: string;
  winnerIngredients?: string[];
}

const Game: React.FC<Props> = ({ socket, me, players, gameOver, room, winnerIngredients = [] }) => {
  // Busca sempre o estado mais recente do jogador e do turno
  const myPlayer = players.find(p => p.id === me.id) || null;
  // O backend controla o turno, então usamos o campo 'turn' se disponível
  const [turn, setTurn] = React.useState<number>(0);
  React.useEffect(() => {
    type StateMsg = { turn: number };
    const onState = (state: StateMsg) => {
      if (typeof state.turn === 'number') setTurn(state.turn);
    };
    socket.on('state', onState);
    return () => { socket.off('state', onState); };
  }, [socket]);
  const jogadorDaVez = players.length > 0 ? players[turn % players.length] : null;
  const pizzaCompleta = myPlayer && new Set(myPlayer.ingredients).size >= 6;

  // Estado de carta de evento
  const [card, setCard] = React.useState<string|null>(null);
  React.useEffect(() => {
    const onCard = (data: { description: string }) => setCard(data.description);
    socket.on('card', onCard);
    return () => { socket.off('card', onCard); };
  }, [socket]);

  // Função para confirmar carta e limpar imediatamente
  const handleConfirmCard = () => {
    socket.emit('confirmCard', room);
    setCard(null);
  };

  const boardSize = 10;
  const boardTypes = [
    'normal', 'ingredient', 'normal', 'event', 'ingredient', 'normal', 'event', 'ingredient', 'normal', 'ingredient'
  ];

  function renderBoard(players: PlayerState[]) {
    return (
      <div style={{ display: 'flex', gap: 8, margin: '16px 0', justifyContent: 'center' }}>
        {Array.from({ length: boardSize }, (_, idx) => {
          const playersHere = players.filter(p => p.position === idx);
          let bg = '#eee';
          let label = '';
          if (idx === 9) { bg = '#ffe066'; label = '🏁'; } // Casa de vitória
          else if (boardTypes[idx] === 'ingredient') { bg = '#d4f5d4'; label = '🍕'; }
          else if (boardTypes[idx] === 'event') { bg = '#ffe0e0'; label = '🎲'; }
          return (
            <div key={idx} style={{
              width: 48, height: 48, border: '2px solid #888', borderRadius: 8, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <div style={{fontWeight:'bold'}}>{idx+1}</div>
              <div>{label}</div>
              <div style={{position:'absolute', bottom:2, left:0, right:0, fontSize:'0.8em'}}>
                {playersHere.map(p => <span key={p.id} style={{color: p.id === me.id ? '#007bff' : '#333'}}>{p.name[0]}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {renderBoard(players)}
      <div className="card">
        <h3>Jogador da vez: {jogadorDaVez ? jogadorDaVez.name : '-'}</h3>
        <p>Sua posição no tabuleiro: {myPlayer ? myPlayer.position+1 : '-'}</p>
        <p>Seus ingredientes: {myPlayer && myPlayer.ingredients.length > 0
          ? (myPlayer.ingredients.map((i, idx) => <span key={idx} style={{fontSize:'2em',margin:'0 4px'}}>{i}</span>) as React.ReactNode[])
          : '-'}</p>
        {pizzaCompleta && <div style={{color:'green',fontWeight:'bold'}}>🍕 Pizza Completa!</div>}
        {myPlayer && jogadorDaVez && myPlayer.id === jogadorDaVez.id && !gameOver && !card && (
          <button onClick={() => socket.emit('rollDice', room)}>Jogar Dado</button>
        )}
      </div>
      {card && (
        <div className="card">
          <h3>Carta Sorteada</h3>
          <p>{card}</p>
          <button onClick={handleConfirmCard}>Confirmar Carta</button>
        </div>
      )}
      {gameOver && typeof gameOver === 'object' && gameOver !== null && (gameOver as { name?: string }).name && (
        <div className="card" style={{background:'#e0ffe0'}}>
          <h2>Vencedor: {(gameOver as { name: string }).name}</h2>
          {/* Mostra ingredientes do vencedor */}
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
          <button onClick={() => socket.emit('restartGame', room)}>Reiniciar</button>
        </div>
      )}
    </div>
  );
};

export default Game;
