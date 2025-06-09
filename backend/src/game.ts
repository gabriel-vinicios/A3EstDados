import { Server, Socket } from 'socket.io';

interface Player {
  id: string;
  name: string;
  position: number;
  flavor: string,
  ingredients: string[];
  pendingCard?: { desc: string; effect: (p: Player, sala: Room) => void } | null;
}

interface Room {
  id: string;
  players: Player[];
  started: boolean;
  turn: number;
  board: ('normal' | 'ingredient' | 'event')[];
  winner?: Player;
  maxPlayers: number;
  diceNumber?: number;
}

const pizzaFlavors: Record<string, string[]> = {
  Portuguesa: ['Presunto', 'Queijo', 'Azeitona', 'Cebola', 'Ovo'],
  Toscana: ['Presunto', 'Azeitona', 'Tomate', 'Linguiça', 'Cebola'],
  Calabresa: ['Linguiça', 'Queijo', 'Azeitona', 'Cebola', 'Oregano'],
  Romana: ['Presunto', 'Queijo', 'Ervilha', 'Milho', 'Cebola'],
  Vegetariana: ['Tomate', 'Broccoli', 'Milho', 'Ovo', 'Ervilha'],
  Marguerita: ['Tomate', 'Queijo', 'Cebola', 'Oregano', 'Azeitona'],
};

const flavors = Object.keys(pizzaFlavors);

export class GameServer {
  private io: Server;
  private rooms: Map<string, Room> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.setup();
  }

  private setup() {
    this.io.on('connection', (socket) => {
      // Listar salas
      socket.on('listarSalas', () => {
        socket.emit('salasDisponiveis', Array.from(this.rooms.keys()));
      });

      // Entrar em sala
      socket.on('joinRoom', ({ name, room }) => {
        if (!name || !room) {
          socket.emit('erro', 'Nome e sala são obrigatórios.');
          return;
        }
        let sala = this.rooms.get(room);
        if (!sala) {
          sala = {
            id: room,
            players: [],
            started: false,
            turn: 0,
            board: [],
            winner: undefined,
            maxPlayers: 2
          };
          this.rooms.set(room, sala);
        }
        if (sala.players.length >= sala.maxPlayers) {
          socket.emit('erro', 'Sala cheia!');
          return;
        }
        if (!sala.players.find(p => p.id === socket.id)) {
          sala.players.push({ id: socket.id, name, position: 0, flavor: '', ingredients: [] });
        }
        socket.join(room);
        socket.emit('joined', { id: socket.id, name });
        this.emitRoomState(room);
        this.io.emit('salasDisponiveis', Array.from(this.rooms.keys()));
      });

      // Sair da sala
      socket.on('leaveRoom', (room) => {
        this.removePlayerFromRoom(socket, room);
      });

      // Desconectar
      socket.on('disconnect', () => {
        for (const room of this.rooms.values()) {
          this.removePlayerFromRoom(socket, room.id, false);
        }
      });

      socket.on('startGame', (roomId) => {
        this.startGame(roomId);
      });

      // Jogada de dado
      socket.on('rollDice', (roomId) => {
        this.handleRoll(socket, roomId);
      });
      socket.on('confirmCard', (roomId) => {
        this.handleConfirmCard(socket, roomId);
      });
      socket.on('restartGame', (roomId) => {
        this.restartGame(roomId);
      });
    });
  }

  private startGame(roomId: string) {
    const sala = this.rooms.get(roomId);
    if (!sala || sala.players.length < 2) return;
    sala.started = true;
    sala.turn = 0;
    sala.board = [
      'normal', 'ingredient', 'normal', 'event', 'ingredient', 'normal', 'event', 'ingredient', 'normal', 'ingredient',
    ];
    sala.players.forEach((p, idx) => {
      let randomFlavorIndex = Math.floor(Math.random() * flavors.length);
      let randomFlavor = flavors[randomFlavorIndex];
      p.position = 0;
      p.ingredients = [];
      p.flavor = randomFlavor;
    });
    sala.winner = undefined;
    this.emitRoomState(roomId);
  }

  private removePlayerFromRoom(socket: Socket, roomId: string, emitState = true) {
    const sala = this.rooms.get(roomId);
    if (!sala) return;
    sala.players = sala.players.filter(p => p.id !== socket.id);
    socket.leave(roomId);
    if (emitState) this.emitRoomState(roomId);
    if (sala.players.length === 0) {
      this.rooms.delete(roomId);
    }
    this.io.emit('salasDisponiveis', Array.from(this.rooms.keys()));
  }

  private emitRoomState(roomId: string, dice?: number, ingredienteObtido?: string) {
    const sala = this.rooms.get(roomId);
    if (!sala) return;
    this.io.to(roomId).emit('state', {
      players: sala.players,
      started: !!sala.started,
      turn: sala.turn,
      board: sala.board,
      winner: sala.winner,
      diceNumber: dice,
      ingredienteObtido: ingredienteObtido
    });
  }

  private weightedRandom<T extends { weight: number }>(items: T[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of items) {
      if (random < item.weight) {
        return item;
      }
      random -= item.weight;
    }
    // Fallback (Não vai executar se a probabilidade > 0)
    return items[items.length - 1];
  }
  

  private handleRoll(socket: Socket, roomId: string) {
    const sala = this.rooms.get(roomId);
    if (!sala || !sala.started || sala.winner) return;
    const playerIdx = sala.players.findIndex(p => p.id === socket.id);
    if (playerIdx === -1 || sala.turn % sala.players.length !== playerIdx) return; // Só o jogador da vez pode jogar
    const player = sala.players[playerIdx];
    const dice = Math.floor(Math.random() * 6) + 1;
    player.position = (player.position + dice) % sala.board.length;
    const casa = sala.board[player.position];
    // NOVA CONDIÇÃO DE VITÓRIA
    const saborDoJogador = pizzaFlavors[player.flavor];
    const ingredientesColetados = new Set(player.ingredients);
    const venceu = saborDoJogador.every(ing => ingredientesColetados.has(ing));
    if (player.position === 9 && venceu) {
      sala.winner = player;
      sala.started = false;
      this.emitRoomState(roomId, dice);
      this.io.to(roomId).emit('gameOver', { name: player.name, ingredients: player.ingredients });
      return;
    } else if (player.position === 9 && !venceu) {
      // Não venceu, volta para o início
      player.position = 0;
      this.emitRoomState(roomId, dice);
    }
    
    if (casa === 'ingredient') {
      // Sorteia ingrediente
      const ingredientes = ['Presunto', 'Queijo', 'Azeitona', 'Cebola', 'Ovo', 'Tomate', 'Linguiça', 'Oregano', 'Ervilha', 'Milho', 'Broccoli'];
      const novo = ingredientes[Math.floor(Math.random() * ingredientes.length)];
      const saborDoJogador = pizzaFlavors[player.flavor];
      if (saborDoJogador.includes(novo) && !player.ingredients.includes(novo)) {
        player.ingredients.push(novo);
      }
      sala.turn++;
      this.emitRoomState(roomId, dice, novo);
    } else if (casa === 'event') {
      // Sorteia evento de acordo com probabilidade
      const eventos = [
        { desc: 'Volte 2 casas', effect: (p: Player, sala: Room) => { p.position = (p.position - 2); }, weight: 0.3 },
        { desc: 'Perca um ingrediente', effect: (p: Player, sala: Room) => { p.ingredients.pop(); }, weight: 0.2 },
        { desc: 'Avance 1 casa', effect: (p: Player, sala: Room) => { p.position = (p.position + 1); }, weight: 0.5 },
        { desc: 'Você queimou a pizza, perdeu tudo!', effect: (p: Player, sala: Room) => { while (p.ingredients.length > 0){p.ingredients.pop()}; }, weight: 0.05 },
      ];
      const evento = this.weightedRandom(eventos);
      player.pendingCard = evento;
      socket.emit('card', { description: evento.desc });
      // Não avança o turno ainda, só após confirmar
    } else {
      sala.turn++;
      this.emitRoomState(roomId, dice);
    }
  }

  private handleConfirmCard(socket: Socket, roomId: string) {
    const sala = this.rooms.get(roomId);
    if (!sala) return;
    const player = sala.players.find(p => p.id === socket.id);
    if (!player || !player.pendingCard) return;
    // Aplica o efeito da carta
    player.pendingCard.effect(player, sala);
    player.pendingCard = null;
    // NOVA CONDIÇÃO DE VITÓRIA APÓS CARTA
    if (player.position === 9) {
      const ingredientesUnicos = new Set(player.ingredients);
      if (ingredientesUnicos.size >= 6) {
        sala.winner = player;
        sala.started = false;
        this.emitRoomState(roomId);
        this.io.to(roomId).emit('gameOver', { name: player.name, ingredients: player.ingredients });
        return;
      } else {
        // Não venceu, volta para o início
        player.position = 0;
        this.emitRoomState(roomId);
      }
    }
    sala.turn++;
    this.emitRoomState(roomId);
  }

  private restartGame(roomId: string) {
    const sala = this.rooms.get(roomId);
    if (!sala) return;
    sala.started = false;
    sala.turn = 0;
    sala.board = [];
    sala.winner = undefined;
    sala.players.forEach(p => {
      p.position = 0;
      p.ingredients = [];
    });
    this.emitRoomState(roomId);
    this.io.to(roomId).emit('gameRestarted');
  }
}
