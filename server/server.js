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
        safeRooms[code] = {
            code,
            maxUsers: room.maxUsers,
            isPrivate: room.isPrivate
        }
    }

    res.json(safeRooms);
});

app.post('/api/rooms', async (req, res) => {
    const { username, password, maxUsers = 10, isPrivate = false} = req.body;
    let hashedPassword = null;
    let code;
    let attempts = 0;

    if (password && password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
        return res.status(403).json({ error: 'Username must be 2-20 characters' });
    }

    if (password) {
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
        users: [],
        password: hashedPassword,
        maxUsers: parseInt(maxUsers),
        isPrivate,
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

const PORT = process.env.PORT || 5000;

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


app.listen(PORT, () => { console.log(`Server started on port ${PORT}`)});

