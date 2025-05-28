import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { GameServer } from './game';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

new GameServer(io);

app.get('/', (req, res) => { res.send('Pizza Game API'); });
server.listen(3001, () => console.log('Backend running on http://localhost:3001'));

/**
 * Fluxo principal do servidor:
 * 1. O servidor Express é iniciado, criando um servidor HTTP.
 * 2. O Socket.IO é configurado para permitir conexões de qualquer origem.
 * 3. Uma nova instância do jogo é criada, com o servidor Socket.IO sendo passado como parâmetro.
 * 4. Um endpoint de teste é criado, respondendo com uma mensagem simples.
 * 5. O servidor é iniciado em uma porta específica (3001), e uma mensagem de log é exibida indicando o URL de acesso.
 */
