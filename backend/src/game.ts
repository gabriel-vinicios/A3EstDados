import { Queue, Stack, Order, EventCard } from './structures';
import { Server, Socket } from 'socket.io';

interface Player { id: string; name: string; score: number; socket: Socket; }

export class Game {
  private io: Server;
  private players: Player[] = [];
  private turnQueue = new Queue<Player>();
  private orderQueue = new Queue<Order>();
  private eventStack = new Stack<EventCard>();

  constructor(io: Server) {
    this.io = io;
    this.setup();
  }

  private setup() {
    this.initOrders();
    this.initEvents();
    this.io.on('connection', socket => {
      socket.on('join', name => this.addPlayer(socket, name));
    });
  }

  private initOrders() {
    this.orderQueue.enqueue({ id: 'o1', ingredients: ['Queijo', 'Tomate'] });
    this.orderQueue.enqueue({ id: 'o2', ingredients: ['Presunto', 'Cogumelo', 'Queijo'] });
    this.orderQueue.enqueue({ id: 'o3', ingredients: ['Tomate', 'Queijo'] });
  }

  private initEvents() {
    ['Ingrediente em falta','Entrega dupla','Cliente impaciente'].forEach((desc, i) => {
      this.eventStack.push({ id: `e${i}`, description: desc });
    });
  }

  private addPlayer(socket: Socket, name: string) {
    const player: Player = { id: socket.id, name, score: 0, socket };
    this.players.push(player);
    this.turnQueue.enqueue(player);
    socket.emit('joined', { id: player.id, name });
    this.broadcastState();
    if (this.players.length >= 2) this.startRound();
  }

  private startRound() {
    const current = this.turnQueue.dequeue();
    if (!current) return;
    const order = this.orderQueue.dequeue();
    const card = this.eventStack.pop();
    current.socket.emit('yourTurn', { order, event: card });
    current.socket.once('deliver', success => {
      if (success && order) current.score += order.ingredients.length;
      if (order) this.orderQueue.enqueue(order);
      this.turnQueue.enqueue(current);
      this.broadcastState();
      setTimeout(() => this.startRound(), 500);
    });
  }

  private broadcastState() {
    this.io.emit('state', {
      players: this.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      orders: this.orderQueue.size(),
      events: this.eventStack.size()
    });
  }
}

