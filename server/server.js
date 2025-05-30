const express = require('express');
const bcrypt = require('bcrypt')
const app = express();
app.use(express.json());
require('dotenv').config();

const SALT_ROUNDS = 10;
const rooms = {};
const MAX_ATTEMPTS = 30;
const ROOM_EXPIRATION_MS = 2 * 60 * 1000;

app.get('/api/rooms', (req, res) => {
    const safeRooms = {};

    for (const [code, room] of Object.entries(rooms)) {
        if (!room.isPrivate) {
            safeRooms[code] = {
                maxUsers: room.maxUsers,
                hasPassword: room.hasPassword,
                userLength: room.users.length,
            }
        }
    }

    res.json(safeRooms);
});

app.post('/api/rooms', async (req, res) => {
    const { username, password, maxUsers = 10, isPrivate = false} = req.body;
    let hasPassword = false;
    let hashedPassword = null;
    let code;
    let attempts = 0;

    if (password && (password.length < 4 || password.length > 20)) {
        return res.status(400).json({ error: 'Password must be 4-20 characters' });
    }

    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
        return res.status(403).json({ error: 'Username must be 2-20 characters' });
    }

    if (maxUsers < 2 || maxUsers > 20) {
        return res.status(403).json({ error: 'User count must be 2-20 people'})
    }

    if (password) {
        hasPassword = true;
        hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    }

    do {
        code = generateRoomCode();
        attempts++;
        if (attempts > MAX_ATTEMPTS) {
            return res.status(500).json({ error: 'Could not generate unique room code' });
        }
    } while (rooms[code]);
    rooms[code] = { 
        users: [username],
        password: hashedPassword,
        maxUsers: parseInt(maxUsers),
        isPrivate,
        hasPassword,
    };

    res.json({roomCode: code});
});

app.post('/api/rooms/:code/join', async (req, res) => {
    const { code } = req.params;
    const { username = '', password = ''} = req.body;

    const room = rooms[code]
    if (!room)
        return res.status(404).json({error: 'Room Not Found'});

    if (room.password) {
        const match = await bcrypt.compare(password, room.password);
        if (!match) return res.status(403).json({error: 'Incorrect Password'});
    }

    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20)
        return res.status(403).json({ error: 'Username must be 2-20 characters' });

    if (room.users.length >= room.maxUsers)
        return res.status(403).json({error: 'Room is Full'});

    if (room.users.includes(trimmed))
        return res.status(403).json({ error: 'Username exists in this room'});

    if (room.users.length === 0 && cleanupTimers[code])
        cancelRoomCleanup(code);

    room.users.push(trimmed);
    io.to(code).emit('update-users', room.users);
    res.json({message: `User ${username} joined the room`, roomCode: code})
});

app.post('/api/rooms/:code/leave', (req, res) => {
    const {code} = req.params;
    const {username = ''} = req.body

    const room = rooms[code];
    if (!room) return res.status(404).json({ error: 'Room Not Found' });

    room.users = room.users.filter(u => u !== username);

    if (room.users.length === 0){
        scheduleRoomCleanup(code)
    }

    res.json({message: `User ${username} left the room`})
});

app.post('/api/rooms/:code/check-password', async (req, res) => {
    const { code } = req.params;

    const room = rooms[code];
    if (!room) {
        return res.status(404).json({ error: "Room Not Found" });
    }

    if (!room.password) {
        return res.json({ success: true, hasPassword: false});
    }
    
    return res.json({ success: true, hasPassword: true});
});

app.get('/api/rooms/:code/users', (req, res) => {
    const { code } = req.params;
    const room = rooms[code];

    if (!room) return res.status(404).json({ error: 'Room Not Found' });

    res.json({ users: room.users });
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Map socket.id => {username, roomCode}
const socketUsers = new Map();

// Helper to find socket by username in a room
function findSocketIdByUsername(roomCode, username) {
  for (const [id, user] of socketUsers.entries()) {
    if (user.roomCode === roomCode && user.username === username) return id;
  }
  return null;
}

io.on('connection', (socket) => {
    const { roomCode, username } = socket.handshake.auth;

    if (roomCode && username) {
        socketUsers.set(socket.id, { username, roomCode });
        socket.join(roomCode);
        console.log(`${username} connected to room ${roomCode}`);

        // Notify all in room
        io.to(roomCode).emit('chat-message', {
            system: true,
            message: `${username} has joined the room`,
            timestamp: Date.now()
        });

        // Send updated users list to clients for video grid
        const room = rooms[roomCode];
        if (room) {
            io.to(roomCode).emit('update-users', room.users);
        }

        // Chat message relay
        socket.on('chat-message', (msg) => {
            io.to(roomCode).emit('chat-message', msg);
        });

        // WebRTC Signaling events
        socket.on('offer', ({ toUsername, offer }) => {
            const targetSocketId = findSocketIdByUsername(roomCode, toUsername);
            if (targetSocketId) {
                io.to(targetSocketId).emit('offer', { fromUsername: username, offer });
            }
        });

        socket.on('answer', ({ toUsername, answer }) => {
            const targetSocketId = findSocketIdByUsername(roomCode, toUsername);
            if (targetSocketId) {
                io.to(targetSocketId).emit('answer', { fromUsername: username, answer });
            }
        });

        socket.on('ice-candidate', ({ toUsername, candidate }) => {
            const targetSocketId = findSocketIdByUsername(roomCode, toUsername);
            if (targetSocketId) {
                io.to(targetSocketId).emit('ice-candidate', { fromUsername: username, candidate });
            }
        });

        socket.on('media-state', ({ username, videoEnabled, audioEnabled }) => {
            socket.to(roomCode).emit('media-state', {
                username,
                videoEnabled,
                audioEnabled,
            });
        });

        // Rejoin room
        socket.on('rejoin-room', ({ username, code }) => {
            const room = rooms[code];
            if (!room) return;

            if (!room.users.includes(username)) {
                room.users.push(username);
            }

            socket.join(code);
            socketUsers.set(socket.id, { username, roomCode: code });
            io.to(code).emit('update-users', room.users);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const userData = socketUsers.get(socket.id);
            if (userData) {
                const {username, roomCode} = userData;
                const room = rooms[roomCode];
                if (room) {
                    room.users = room.users.filter(u => u !== username);

                    io.to(roomCode).emit('chat-message', {
                        system: true,
                        message: `${username} has left the room`,
                        timestamp: Date.now()
                    });
                    io.to(roomCode).emit('update-users', room.users);

                    if (room.users.length === 0) {
                        scheduleRoomCleanup(roomCode);
                    }
                }
                socketUsers.delete(socket.id);
                console.log(`User ${username} disconnected from room ${roomCode}`);
            } else {
                console.log(`Socket ${socket.id} disconnected`)
            }
        });
    } else {
        console.log('User connected with no roomCode or username');
    }
});

function generateRoomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

const cleanupTimers = {}
function scheduleRoomCleanup(code) {
    cleanupTimers[code] = setTimeout(() => {
        delete rooms[code];
        delete cleanupTimers[code];
        console.log(`Room ${code} inactive, freeing memory`)
    }, ROOM_EXPIRATION_MS);
}

function cancelRoomCleanup(code) {
    if (cleanupTimers[code]) {
        clearTimeout(cleanupTimers[code]);
        delete cleanupTimers[code];
    }
}

const PORT = 5001;
server.listen(PORT, "0.0.0.0");