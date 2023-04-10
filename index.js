import { createServer } from 'http';
import { parse } from 'url';
import WebSocket, { WebSocketServer } from 'ws';

const server = createServer();
const wss1 = new WebSocketServer({ noServer: true });
const wss2 = new WebSocketServer({ noServer: true });

wss1.on('connection', function connection(ws) {
  ws.on('error', console.error);

  // chat data
  ws.on('message', () => {
    wss1.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send('msg');
      }
    });
  });

  ws.on('close', () => {
    ws.close();
  });

  // check for closed clients
  setInterval(() => {
    wss1.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.CLOSED) {
        client.close();
      }
    });
  }, 600000);
});

wss2.on('connection', function connection(ws) {
  ws.on('error', console.error);

  // typing, takes in username, don't send data to self
  ws.on('message', (data, isBinary) => {
    wss2.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  ws.on('close', () => {
    ws.close();
  });

  setInterval(() => {
    wss2.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.CLOSED) {
        client.close();
      }
    });
  }, 600000);
});

server.on('upgrade', function upgrade(request, socket, head) {
  const { pathname } = parse(request.url);

  if (pathname === '/chat') {
    wss1.handleUpgrade(request, socket, head, function done(ws) {
      wss1.emit('connection', ws, request, socket);
    });
  } else if (pathname === '/typing') {
    wss2.handleUpgrade(request, socket, head, function done(ws) {
      wss2.emit('connection', ws, request, socket);
    });
  } else {
    socket.destroy();
  }
});

server.listen(8080);
