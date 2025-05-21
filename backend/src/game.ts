import { Queue, Stack, Order, EventCard } from './structures';
import { Server, Socket } from 'socket.io';

// Representa um jogador na partida
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

  // Configura eventos iniciais e listeners de conexão
  private setup() {
    this.initOrders();
    this.initEvents();
    this.io.on('connection', socket => {
      // Quando um jogador entra, chama addPlayer
      socket.on('join', name => this.addPlayer(socket, name));
    });
  }

  // Inicializa a fila de pedidos
  private initOrders() {
    this.orderQueue.enqueue({ id: 'o1', ingredients: ['Queijo', 'Tomate'] });
    this.orderQueue.enqueue({ id: 'o2', ingredients: ['Presunto', 'Cogumelo', 'Queijo'] });
    this.orderQueue.enqueue({ id: 'o3', ingredients: ['Tomate', 'Queijo'] });
  }

  // Inicializa a pilha de cartas de evento
  private initEvents() {
    ['Ingrediente em falta','Entrega dupla','Cliente impaciente'].forEach((desc, i) => {
      this.eventStack.push({ id: `e${i}`, description: desc });
    });
  }

  // Adiciona um novo jogador ao jogo
  private addPlayer(socket: Socket, name: string) {
    const player: Player = { id: socket.id, name, score: 0, socket };
    this.players.push(player);
    this.turnQueue.enqueue(player);
    // Informa ao jogador que entrou
    socket.emit('joined', { id: player.id, name });
    this.broadcastState();
    // Inicia rodada se houver pelo menos 2 jogadores
    if (this.players.length >= 2) this.startRound();
  }

  // Inicia uma rodada, passando o turno para o próximo jogador
  private startRound() {
    const current = this.turnQueue.dequeue();
    if (!current) return;
    const order = this.orderQueue.dequeue();
    const card = this.eventStack.pop();
    // Envia o pedido e evento ao jogador da vez
    current.socket.emit('yourTurn', { order, event: card });
    // Aguarda resposta do jogador (entregou ou falhou)
    current.socket.once('deliver', success => {
      if (success && order) current.score += order.ingredients.length;
      if (order) this.orderQueue.enqueue(order);
      this.turnQueue.enqueue(current);
      this.broadcastState();
      // Aguarda meio segundo antes de passar para o próximo
      setTimeout(() => this.startRound(), 500);
    });
  }

  // Envia o estado atualizado do jogo para todos os jogadores
  private broadcastState() {
    this.io.emit('state', {
      players: this.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      orders: this.orderQueue.size(),
      events: this.eventStack.size()
    });
  }
}

