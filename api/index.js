import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { getAllPlayers, getPlayersByCategory } from '../server/data/players.js';
import { getTeams } from '../server/data/teams.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const USERS_FILE = './server/data/users.json';
let users = {};
try {
    if (existsSync(USERS_FILE)) {
        users = JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
    }
} catch (e) { users = {}; }

function saveUsers() {
    try { writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); } catch (e) { }
}

app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    if (users[email]) return res.status(409).json({ error: 'Email already registered' });
    users[email] = { name, password, email, createdAt: Date.now(), auctionHistory: [] };
    saveUsers();
    res.json({ success: true, user: { name, email } });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = users[email];
    if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ success: true, user: { name: user.name, email: user.email, auctionHistory: user.auctionHistory } });
});

// ============ GAME STATE ============
const rooms = new Map();

function createRoom(hostId, hostName, hostTeam) {
    const roomCode = uuidv4().slice(0, 6).toUpperCase();
    const teams = getTeams();
    const players = getAllPlayers();
    const categories = getPlayersByCategory();

    const room = {
        code: roomCode,
        hostId,
        phase: 'lobby', // lobby | auction | completed
        teams: teams.map(t => {
            // Initialize with retained players
            const retained = (t.retainedPlayers || []).map(rp => ({
                ...rp,
                id: 'retained_' + rp.name.replace(/\s/g, '_'),
                retained: true,
                soldPrice: 0
            }));
            return {
                ...t,
                purse: 12500, // 125 crore = 12500 lakh
                players: retained,
                retainedCount: retained.length,
                maxSlots: 25,
                owner: null,
                ownerName: null,
                isBot: true
            };
        }),
        players: players.map(p => ({ ...p, sold: false, soldTo: null, soldPrice: null })),
        categories,
        currentCategoryIndex: 0,
        currentPlayerIndex: -1,
        currentBid: null,
        currentBidder: null,
        highestBid: 0,
        highestBidder: null,
        timer: null,
        timerValue: 15,
        auctionHistory: [],
        unsoldPlayers: [],
        connectedUsers: new Map(),
        categoryOrder: ['BATTER', 'BOWLER', 'ALL-ROUNDER', 'WICKETKEEPER']
    };

    // Assign host team
    const teamIdx = room.teams.findIndex(t => t.shortName === hostTeam);
    if (teamIdx !== -1) {
        room.teams[teamIdx].owner = hostId;
        room.teams[teamIdx].ownerName = hostName;
        room.teams[teamIdx].isBot = false;
    }
    room.connectedUsers.set(hostId, { name: hostName, team: hostTeam });

    rooms.set(roomCode, room);
    return room;
}

function getBotBid(room, player) {
    const botTeams = room.teams.filter(t => t.isBot && t.purse >= room.highestBid + getMinIncrement(room.highestBid));
    if (botTeams.length === 0) return null;

    // More aggressive bidding for capped/star players
    const isHighProfile = player.cappedStatus === 'Capped' && player.basePrice >= 150;
    const bidChance = isHighProfile ? 0.65 : 0.35;

    if (Math.random() > bidChance) return null;

    const eligible = botTeams.filter(t => {
        const remainingSlots = 25 - t.players.length;
        if (remainingSlots <= 0) return false;
        const minNeeded = (remainingSlots - 1) * 30; // reserve min for remaining
        return t.purse - (room.highestBid + getMinIncrement(room.highestBid)) >= minNeeded;
    });

    if (eligible.length === 0) return null;

    const botTeam = eligible[Math.floor(Math.random() * eligible.length)];
    const increment = getMinIncrement(room.highestBid);
    const maxBid = Math.min(
        botTeam.purse,
        player.basePrice * (isHighProfile ? 15 : 6),
        room.highestBid + increment * (1 + Math.floor(Math.random() * 3))
    );

    if (maxBid < room.highestBid + increment) return null;

    return {
        team: botTeam.shortName,
        amount: room.highestBid + increment
    };
}

function getMinIncrement(currentBid) {
    if (currentBid < 100) return 5;
    if (currentBid < 200) return 10;
    if (currentBid < 500) return 15;
    if (currentBid < 1000) return 20;
    return 25;
}

function getPlayersForCurrentCategory(room) {
    const cat = room.categoryOrder[room.currentCategoryIndex];
    return room.players.filter(p => p.specialism === cat && !p.sold);
}

function startNextPlayer(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    clearInterval(room.timer);

    const available = getPlayersForCurrentCategory(room);
    room.currentPlayerIndex++;

    if (room.currentPlayerIndex >= available.length) {
        // Move to next category
        room.currentCategoryIndex++;
        room.currentPlayerIndex = 0;

        if (room.currentCategoryIndex >= room.categoryOrder.length) {
            room.phase = 'completed';
            io.to(roomCode).emit('auctionCompleted', {
                teams: room.teams,
                history: room.auctionHistory,
                unsold: room.unsoldPlayers
            });
            return;
        }

        io.to(roomCode).emit('categoryChange', {
            category: room.categoryOrder[room.currentCategoryIndex],
            categoryIndex: room.currentCategoryIndex
        });
    }

    const currentPlayers = getPlayersForCurrentCategory(room);
    if (currentPlayers.length === 0) {
        room.currentCategoryIndex++;
        room.currentPlayerIndex = 0;
        if (room.currentCategoryIndex >= room.categoryOrder.length) {
            room.phase = 'completed';
            io.to(roomCode).emit('auctionCompleted', {
                teams: room.teams,
                history: room.auctionHistory,
                unsold: room.unsoldPlayers
            });
            return;
        }
        startNextPlayer(roomCode);
        return;
    }

    const player = currentPlayers[room.currentPlayerIndex];
    if (!player) {
        room.currentCategoryIndex++;
        room.currentPlayerIndex = -1;
        startNextPlayer(roomCode);
        return;
    }

    room.currentBid = player.basePrice;
    room.highestBid = player.basePrice;
    room.highestBidder = null;
    room.currentBidder = null;
    room.timerValue = 15;

    io.to(roomCode).emit('newPlayer', {
        player,
        category: room.categoryOrder[room.currentCategoryIndex],
        categoryIndex: room.currentCategoryIndex,
        playerIndex: room.currentPlayerIndex,
        totalInCategory: currentPlayers.length
    });

    startTimer(roomCode);
}

function startTimer(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    clearInterval(room.timer);
    room.timerValue = 15;

    room.timer = setInterval(() => {
        room.timerValue--;
        io.to(roomCode).emit('timerUpdate', room.timerValue);

        // Bot bidding during timer
        if (room.timerValue > 2 && room.timerValue % 3 === 0) {
            const currentPlayers = getPlayersForCurrentCategory(room);
            const player = currentPlayers[room.currentPlayerIndex];
            if (player) {
                const botBid = getBotBid(room, player);
                if (botBid && botBid.amount > room.highestBid) {
                    room.highestBid = botBid.amount;
                    room.highestBidder = botBid.team;
                    room.timerValue = Math.max(room.timerValue, 8); // Reset timer a bit

                    io.to(roomCode).emit('bidUpdate', {
                        team: botBid.team,
                        amount: botBid.amount,
                        isBot: true,
                        teamName: room.teams.find(t => t.shortName === botBid.team)?.name || botBid.team
                    });
                }
            }
        }

        if (room.timerValue <= 0) {
            clearInterval(room.timer);
            sellPlayer(roomCode);
        }
    }, 1000);
}

function sellPlayer(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) return;

    const currentPlayers = getPlayersForCurrentCategory(room);
    const player = currentPlayers[room.currentPlayerIndex];
    if (!player) return;

    if (room.highestBidder) {
        // Player sold
        const teamIdx = room.teams.findIndex(t => t.shortName === room.highestBidder);
        if (teamIdx !== -1) {
            room.teams[teamIdx].purse -= room.highestBid;
            room.teams[teamIdx].players.push({
                ...player,
                soldPrice: room.highestBid
            });
        }

        // Mark player as sold
        const pIdx = room.players.findIndex(p => p.id === player.id);
        if (pIdx !== -1) {
            room.players[pIdx].sold = true;
            room.players[pIdx].soldTo = room.highestBidder;
            room.players[pIdx].soldPrice = room.highestBid;
        }

        room.auctionHistory.push({
            player: player,
            soldTo: room.highestBidder,
            soldPrice: room.highestBid,
            teamName: room.teams[teamIdx]?.name
        });

        io.to(roomCode).emit('playerSold', {
            player,
            team: room.highestBidder,
            teamName: room.teams[teamIdx]?.name,
            price: room.highestBid,
            teamColor: room.teams[teamIdx]?.primaryColor
        });
    } else {
        // Unsold
        room.unsoldPlayers.push(player);
        io.to(roomCode).emit('playerUnsold', { player });
    }

    // Next player after delay
    setTimeout(() => startNextPlayer(roomCode), 3000);
}

// ============ API ROUTES ============
app.get('/api/players', (req, res) => {
    res.json(getAllPlayers());
});

app.get('/api/players/categories', (req, res) => {
    res.json(getPlayersByCategory());
});

app.get('/api/teams', (req, res) => {
    res.json(getTeams());
});

app.get('/api/room/:code', (req, res) => {
    const room = rooms.get(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json({
        code: room.code,
        phase: room.phase,
        teams: room.teams,
        connectedUsers: Array.from(room.connectedUsers.entries()).map(([id, u]) => ({ id, ...u })),
        categories: room.categoryOrder,
        currentCategoryIndex: room.currentCategoryIndex
    });
});

// ============ SOCKET.IO ============
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('createRoom', ({ playerName, teamChoice }) => {
        const room = createRoom(socket.id, playerName, teamChoice);
        socket.join(room.code);
        socket.emit('roomCreated', {
            code: room.code,
            teams: room.teams,
            yourTeam: teamChoice
        });
    });

    socket.on('joinRoom', ({ roomCode, playerName, teamChoice }) => {
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        if (room.phase !== 'lobby') {
            socket.emit('error', { message: 'Auction already started' });
            return;
        }

        const teamIdx = room.teams.findIndex(t => t.shortName === teamChoice);
        if (teamIdx === -1) {
            socket.emit('error', { message: 'Invalid team' });
            return;
        }
        if (!room.teams[teamIdx].isBot) {
            socket.emit('error', { message: 'Team already taken' });
            return;
        }

        room.teams[teamIdx].owner = socket.id;
        room.teams[teamIdx].ownerName = playerName;
        room.teams[teamIdx].isBot = false;
        room.connectedUsers.set(socket.id, { name: playerName, team: teamChoice });

        socket.join(roomCode);

        io.to(roomCode).emit('playerJoined', {
            teams: room.teams,
            connectedUsers: Array.from(room.connectedUsers.entries()).map(([id, u]) => ({ id, ...u }))
        });

        socket.emit('joinedRoom', {
            code: roomCode,
            teams: room.teams,
            yourTeam: teamChoice
        });
    });

    socket.on('startAuction', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;

        room.phase = 'auction';
        room.currentCategoryIndex = 0;
        room.currentPlayerIndex = -1;

        io.to(roomCode).emit('auctionStarted', {
            categories: room.categoryOrder,
            firstCategory: room.categoryOrder[0]
        });

        setTimeout(() => startNextPlayer(roomCode), 2000);
    });

    socket.on('placeBid', ({ roomCode, amount }) => {
        const room = rooms.get(roomCode);
        if (!room || room.phase !== 'auction') return;

        const user = room.connectedUsers.get(socket.id);
        if (!user) return;

        const team = room.teams.find(t => t.shortName === user.team);
        if (!team) return;

        const minBid = room.highestBid + getMinIncrement(room.highestBid);
        if (amount < minBid || amount > team.purse) return;

        // Check remaining slots
        if (team.players.length >= 25) return;

        room.highestBid = amount;
        room.highestBidder = user.team;
        room.timerValue = Math.max(room.timerValue, 8);

        io.to(roomCode).emit('bidUpdate', {
            team: user.team,
            amount,
            isBot: false,
            teamName: team.name,
            playerName: user.name
        });
    });

    socket.on('skipPlayer', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room || room.hostId !== socket.id) return;
        clearInterval(room.timer);
        sellPlayer(roomCode);
    });

    socket.on('getRoomState', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        socket.emit('roomState', {
            code: room.code,
            phase: room.phase,
            teams: room.teams,
            currentCategoryIndex: room.currentCategoryIndex,
            categories: room.categoryOrder,
            auctionHistory: room.auctionHistory,
            unsoldPlayers: room.unsoldPlayers
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const [code, room] of rooms.entries()) {
            if (room.connectedUsers.has(socket.id)) {
                const user = room.connectedUsers.get(socket.id);
                // Don't remove the team, just mark player as disconnected
                room.connectedUsers.delete(socket.id);
                io.to(code).emit('playerLeft', {
                    playerName: user.name,
                    team: user.team
                });
            }
        }
    });
});

export default httpServer;
