import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import type { Order, EventCard, PlayerState } from './structures';

interface Props { socket: Socket; me: {id: string; name: string}; players: PlayerState[]; }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Game: React.FC<Props> = ({ socket, me, players }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [event, setEvent] = useState<EventCard | null>(null);

  useEffect(() => {
    socket.on('yourTurn', ({order, event}) => {
      setOrder(order); setEvent(event);
    });
  }, [socket]);

  const deliver = (success: boolean) => {
    socket.emit('deliver', success);
    setOrder(null); setEvent(null);
  };

  return (
    <>
      {order ? (
        <div className="card">
          <h3>Seu Turno, {me.name}!</h3>
          <p><strong>Pedido:</strong> {order.ingredients.join(', ')}</p>
          <p><strong>Evento:</strong> {event?.description}</p>
          <button className="deliver" onClick={() => deliver(true)}>Entregar</button>
          <button className="fail" onClick={() => deliver(false)}>Falhar</button>
        </div>
      ) : (
        <div className="card"><p>Aguarde seu turno...</p></div>
      )}
    </>
  );
};

export default Game;

