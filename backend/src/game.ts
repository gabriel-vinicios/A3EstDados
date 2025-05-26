import { Queue, Stack, Order, EventCard } from './structures';
import { Server, Socket } from 'socket.io';

interface Player { id: string; name: string; score: number; socket: Socket; active: boolean; }

export class Game {
  private io: Server;
  private players: Player[] = [];
  private turnQueue = new Queue<Player>();
  private orderQueue = new Queue<Order>();
  private eventStack = new Stack<EventCard>();
  private gameOver = false;

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
    const definitions: { desc: string; impact: number }[] = [
      { desc: 'Ingrediente em falta', impact: -2 },
      { desc: 'Entrega dupla', impact: +2 },
      { desc: 'Cliente impaciente', impact: -1 }
    ];
    definitions.forEach((d, i) => this.eventStack.push({ id: `e${i}`, description: d.desc, impact: d.impact }));
  }

  private addPlayer(socket: Socket, name: string) {
    if (this.gameOver) return;
    const player: Player = { id: socket.id, name, score: 0, socket, active: true };
    this.players.push(player);
    this.turnQueue.enqueue(player);
    socket.emit('joined', { id: player.id, name });
    this.broadcastState();
    if (this.players.filter(p => p.active).length >= 2) this.startRound();
  }

  private startRound() {
    if (this.gameOver) return;
    const current = this.turnQueue.dequeue();
    if (!current) return;
    const order = this.orderQueue.dequeue();
    // escolher evento aleatório ou nenhum
    let card: EventCard | null = null;
    if (Math.random() < 0.9 && this.eventStack.size() > 0) {
      card = this.eventStack.pop()!;
    }
    current.socket.emit('yourTurn', { order, event: card });
    current.socket.once('deliver', success => {
      if (order) {
        const base = success ? order.ingredients.length : 0;
        let total = base;
        if (card) total += card.impact;
        current.score = Math.max(0, current.score + total);
      }
      if (order) this.orderQueue.enqueue(order);
      // vitória?
      if (current.score >= 20) {
        this.gameOver = true;
        this.io.emit('gameOver', { winner: current.id, name: current.name });
        return;
      }
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
