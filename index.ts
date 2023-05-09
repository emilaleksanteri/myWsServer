import { createServer } from 'http';
import { parse } from 'url';
import WebSocket, { WebSocketServer } from 'ws';

const server = createServer();
const wss1 = new WebSocketServer({ noServer: true });
const wss2 = new WebSocketServer({ noServer: true });
const wss3 = new WebSocketServer({ noServer: true });

const wss1ChatClients: Set<{ ws: WebSocket; chatId?: string }> = new Set();
const wss2ChatClients: Set<{ ws: WebSocket; chatId?: string }> = new Set();
const wss3ChatClients: Set<{ ws: WebSocket; chatId?: string }> = new Set();

// chat socket
wss1.on('connection', function connection(ws, req) {
  ws.on('error', console.error);
  wss1ChatClients.add({
    ws: ws,
    chatId: req.url?.split('?id=')[1],
  });

  ws.on('message', (data) => {
    let clientsToSend: WebSocket[] = [];
    for (const member of wss1ChatClients) {
      if (member.chatId === data.toString()) {
        clientsToSend.push(member.ws);
      }
    }
    wss1.clients.forEach(function each(client) {
      if (
        client.readyState === WebSocket.OPEN &&
        clientsToSend.includes(client)
      ) {
        client.send('msg for u');
      }
    });
  });
});

// typing socket
wss2.on('connection', function connection(ws, req) {
  ws.on('error', console.error);
  wss2ChatClients.add({
    ws: ws,
    chatId: req.url?.split('?id=')[1],
  });
  // typing, takes in username, don't send data to self
  ws.on('message', (data, isBinary) => {
    const sentData: { chatId: string; username: string } = JSON.parse(
      data.toString()
    );
    let clientsToSend: WebSocket[] = [];
    for (const member of wss2ChatClients) {
      if (member.chatId === sentData.chatId) {
        clientsToSend.push(member.ws);
      }
    }
    wss2.clients.forEach(function each(client) {
      if (
        client.readyState === WebSocket.OPEN &&
        clientsToSend.includes(client)
      ) {
        client.send(sentData.username, { binary: isBinary });
      }
    });
  });
});

// sound effect socker
wss3.on('connection', function connection(ws, req) {
  ws.on('error', console.error);
  wss3ChatClients.add({
    ws: ws,
    chatId: req.url?.split('?id=')[1],
  });

  // sends back index for which sound effect to play on client
  ws.on('message', (data, isBinary) => {
    const sentData: { chatId: string; fileIdx: string } = JSON.parse(
      data.toString()
    );
    let clientsToSend: WebSocket[] = [];
    for (const member of wss3ChatClients) {
      if (member.chatId === sentData.chatId) {
        clientsToSend.push(member.ws);
      }
    }
    wss3.clients.forEach(function each(client) {
      if (
        client.readyState === WebSocket.OPEN &&
        clientsToSend.includes(client)
      ) {
        client.send(sentData.fileIdx, { binary: isBinary });
      }
    });
  });
});

server.on('upgrade', function upgrade(request, socket, head) {
  if (request.url) {
    const { pathname } = parse(request.url);

    if (pathname === '/chat') {
      wss1.handleUpgrade(request, socket, head, function done(ws) {
        wss1.emit('connection', ws, request, socket);
      });
    } else if (pathname === '/typing') {
      wss2.handleUpgrade(request, socket, head, function done(ws) {
        wss2.emit('connection', ws, request, socket);
      });
    } else if (pathname === '/sounds') {
      wss3.handleUpgrade(request, socket, head, function done(ws) {
        wss3.emit('connection', ws, request, socket);
      });
    } else {
      socket.destroy();
    }
  }
});

server.listen(8080);
