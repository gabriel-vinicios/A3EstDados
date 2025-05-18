import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Game } from './game';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
new Game(io);

app.get('/', (_req: any, res: { send: (arg0: string) => any; }) => res.send('Pizzaria Maluca API'));
server.listen(3001, () => console.log('Backend running on http://localhost:3001'));
