import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from './game';

const app = express();
// Cria o servidor HTTP
const server = http.createServer(app);
// Inicializa o Socket.IO permitindo conexões de qualquer origem
const io = new Server(server, { cors: { origin: '*' } });
// Instancia o jogo, passando o servidor socket
new Game(io);

// Endpoint simples para teste
app.get('/', (_req: any, res: { send: (arg0: string) => any; }) => res.send('Pizzaria Maluca API'));
// Inicia o servidor na porta 3001
server.listen(3001, () => console.log('Backend running on http://localhost:3001'));

/**
 * Fluxo principal do servidor:
 * 1. O servidor Express é iniciado, criando um servidor HTTP.
 * 2. O Socket.IO é configurado para permitir conexões de qualquer origem.
 * 3. Uma nova instância do jogo é criada, com o servidor Socket.IO sendo passado como parâmetro.
 * 4. Um endpoint de teste é criado, respondendo com uma mensagem simples.
 * 5. O servidor é iniciado em uma porta específica (3001), e uma mensagem de log é exibida indicando o URL de acesso.
 */
