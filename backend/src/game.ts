import { Queue, Stack, Order, EventCard } from './structures';
import { Server, Socket } from 'socket.io';

// Representa um jogador, incluindo se está ativo
interface Player { id: string; name: string; score: number; socket: Socket; active: boolean; }

export class Game {
  private io: Server;
  private players: Player[] = [];
  private turnQueue = new Queue<Player>();
  private orderQueue = new Queue<Order>();
  private eventStack = new Stack<EventCard>();
  private gameOver = false; // Indica se o jogo terminou

  constructor(io: Server) {
    this.io = io;
    this.setup();
  }

  // Inicializa o jogo, pedidos, eventos e listeners de conexão
  private setup() {
    this.initOrders();
    this.initEvents();
    this.io.on('connection', socket => {
      // Quando um cliente envia 'join', adiciona o jogador
      socket.on('join', name => this.addPlayer(socket, name));
    });
  }

  // Adiciona pedidos à fila de pedidos
  private initOrders() {
    this.orderQueue.enqueue({ id: 'o1', ingredients: ['Queijo', 'Tomate'] });
    this.orderQueue.enqueue({ id: 'o2', ingredients: ['Presunto', 'Cogumelo', 'Queijo'] });
    this.orderQueue.enqueue({ id: 'o3', ingredients: ['Tomate', 'Queijo'] });
  }

  // Adiciona cartas de evento à pilha, cada uma com um impacto diferente
  private initEvents() {
    const definitions: { desc: string; impact: number }[] = [
      { desc: 'Ingrediente em falta', impact: -2 },
      { desc: 'Entrega dupla', impact: +2 },
      { desc: 'Cliente impaciente', impact: -1 }
    ];
    definitions.forEach((d, i) => this.eventStack.push({ id: `e${i}`, description: d.desc, impact: d.impact }));
  }

  // Adiciona um novo jogador ao jogo
  private addPlayer(socket: Socket, name: string) {
    if (this.gameOver) return; // Não permite novos jogadores após o fim
    const player: Player = { id: socket.id, name, score: 0, socket, active: true };
    this.players.push(player);
    this.turnQueue.enqueue(player);
    // Informa ao jogador que entrou
    socket.emit('joined', { id: player.id, name });
    this.broadcastState();
    // Inicia o jogo se houver pelo menos 2 jogadores ativos
    if (this.players.filter(p => p.active).length >= 2) this.startRound();
  }

  // Inicia uma rodada: seleciona jogador, pedido e evento, e aguarda resposta
  private startRound() {
    if (this.gameOver) return;
    const current = this.turnQueue.dequeue();
    if (!current) return;
    const order = this.orderQueue.dequeue();
    // Escolhe um evento aleatório (90% de chance) se houver eventos disponíveis
    let card: EventCard | null = null;
    if (Math.random() < 0.9 && this.eventStack.size() > 0) {
      card = this.eventStack.pop()!;
    }
    // Envia ao jogador o pedido e o evento
    current.socket.emit('yourTurn', { order, event: card });
    // Aguarda resposta do jogador (entregou ou falhou)
    current.socket.once('deliver', success => {
      if (order) {
        // Calcula pontuação baseada no sucesso e impacto do evento
        const base = success ? order.ingredients.length : 0;
        let total = base;
        if (card) total += card.impact;
        // Garante que a pontuação não fique negativa
        current.score = Math.max(0, current.score + total);
      }
      if (order) this.orderQueue.enqueue(order);
      // Verifica condição de vitória
      if (current.score >= 20) {
        this.gameOver = true;
        this.io.emit('gameOver', { winner: current.id, name: current.name });
        return;
      }
      // Coloca o jogador de volta na fila e atualiza o estado
      this.turnQueue.enqueue(current);
      this.broadcastState();
      // Aguarda meio segundo antes de iniciar a próxima rodada
      setTimeout(() => this.startRound(), 500);
    });
  }

  // Envia o estado atual do jogo para todos os clientes
  private broadcastState() {
    this.io.emit('state', {
      players: this.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
      orders: this.orderQueue.size(),
      events: this.eventStack.size()
    });
  }
}
