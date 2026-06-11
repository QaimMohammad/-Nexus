// Quick integration test: two authenticated socket clients exchange
// WebRTC signaling messages through the server relay.
import { io } from '../node_modules/socket.io-client/build/esm/index.js';

const API = 'http://localhost:5000';

async function login(email) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' })
  });
  const json = await res.json();
  return json.data.token;
}

const [tokenA, tokenB] = await Promise.all([
  login('sarah@techwave.io'),
  login('michael@vcinnovate.com')
]);

const a = io(API, { auth: { token: tokenA } });
const b = io(API, { auth: { token: tokenB } });

const room = 'test-room-1';
const results = [];

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('timeout')), 8000);

  // A joins first, then B joins; A should be told B arrived
  a.on('connect', () => a.emit('video:join-room', { roomId: room }));
  b.on('connect', () =>
    setTimeout(() => b.emit('video:join-room', { roomId: room }), 300)
  );

  a.on('video:user-joined', ({ socketId, userName }) => {
    results.push(`A saw join: ${userName}`);
    a.emit('video:offer', { roomId: room, targetSocketId: socketId, offer: { type: 'offer', sdp: 'fake-sdp' } });
  });

  b.on('video:offer', ({ from, userName, offer }) => {
    results.push(`B got offer from ${userName} (sdp=${offer.sdp})`);
    b.emit('video:answer', { targetSocketId: from, answer: { type: 'answer', sdp: 'fake-answer' } });
  });

  a.on('video:answer', ({ answer }) => {
    results.push(`A got answer (sdp=${answer.sdp})`);
    b.emit('video:toggle', { roomId: room, kind: 'audio', enabled: false });
  });

  a.on('video:peer-toggled', ({ kind, enabled }) => {
    results.push(`A saw toggle: ${kind}=${enabled}`);
    b.emit('video:leave-room', { roomId: room });
  });

  a.on('video:user-left', () => {
    results.push('A saw B leave');
    clearTimeout(timeout);
    resolve();
  });
});

console.log(results.join('\n'));
a.disconnect();
b.disconnect();
process.exit(0);
