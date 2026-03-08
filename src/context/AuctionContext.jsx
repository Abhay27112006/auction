import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const AuctionContext = createContext(null);

export function useAuction() {
    return useContext(AuctionContext);
}

export function AuctionProvider({ children }) {
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [roomCode, setRoomCode] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [myTeam, setMyTeam] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [phase, setPhase] = useState('home'); // home | lobby | auction | completed
    const [teams, setTeams] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [currentCategory, setCurrentCategory] = useState('BATTER');
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [playerIndex, setPlayerIndex] = useState(0);
    const [totalInCategory, setTotalInCategory] = useState(0);
    const [timer, setTimer] = useState(15);
    const [highestBid, setHighestBid] = useState(0);
    const [highestBidder, setHighestBidder] = useState(null);
    const [bidHistory, setBidHistory] = useState([]);
    const [lastBid, setLastBid] = useState(null);
    const [soldPlayer, setSoldPlayer] = useState(null);
    const [unsoldPlayer, setUnsoldPlayer] = useState(null);
    const [auctionHistory, setAuctionHistory] = useState([]);
    const [connectedUsers, setConnectedUsers] = useState([]);
    const [error, setError] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [allTeamsData, setAllTeamsData] = useState([]);

    useEffect(() => {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        // Use environment variable if provided (for production), otherwise fallback
        const backendUrl = import.meta.env.VITE_BACKEND_URL || (isLocal ? 'http://localhost:5000' : window.location.origin);

        const s = io(backendUrl, { transports: ['websocket', 'polling'] });

        socketRef.current = s;
        setSocket(s);

        s.on('connect', () => setConnected(true));
        s.on('disconnect', () => setConnected(false));

        s.on('roomCreated', ({ code, teams: t, yourTeam }) => {
            setRoomCode(code);
            setTeams(t);
            setMyTeam(yourTeam);
            setIsHost(true);
            setPhase('lobby');
        });

        s.on('joinedRoom', ({ code, teams: t, yourTeam }) => {
            setRoomCode(code);
            setTeams(t);
            setMyTeam(yourTeam);
            setIsHost(false);
            setPhase('lobby');
        });

        s.on('playerJoined', ({ teams: t, connectedUsers: users }) => {
            setTeams(t);
            setConnectedUsers(users);
        });

        s.on('auctionStarted', ({ categories, firstCategory }) => {
            setPhase('auction');
            setCurrentCategory(firstCategory);
            setCurrentCategoryIndex(0);
        });

        s.on('categoryChange', ({ category, categoryIndex }) => {
            setCurrentCategory(category);
            setCurrentCategoryIndex(categoryIndex);
        });

        s.on('newPlayer', ({ player, category, categoryIndex, playerIndex: pIdx, totalInCategory: total }) => {
            setCurrentPlayer(player);
            setCurrentCategory(category);
            setCurrentCategoryIndex(categoryIndex);
            setPlayerIndex(pIdx);
            setTotalInCategory(total);
            setHighestBid(player.basePrice);
            setHighestBidder(null);
            setBidHistory([]);
            setLastBid(null);
            setSoldPlayer(null);
            setUnsoldPlayer(null);
        });

        s.on('bidUpdate', ({ team, amount, isBot, teamName, playerName: pName }) => {
            setHighestBid(amount);
            setHighestBidder(team);
            const bid = { team, amount, isBot, teamName, playerName: pName, timestamp: Date.now() };
            setLastBid(bid);
            setBidHistory(prev => [...prev, bid]);
        });

        s.on('timerUpdate', (val) => {
            setTimer(val);
        });

        s.on('playerSold', ({ player, team, teamName, price, teamColor }) => {
            setSoldPlayer({ player, team, teamName, price, teamColor });
            setAuctionHistory(prev => [...prev, { player, team, teamName, price }]);
            // Update teams purse
            setTeams(prev => prev.map(t => {
                if (t.shortName === team) {
                    return { ...t, purse: t.purse - price, players: [...t.players, { ...player, soldPrice: price }] };
                }
                return t;
            }));
        });

        s.on('playerUnsold', ({ player }) => {
            setUnsoldPlayer(player);
        });

        s.on('auctionCompleted', ({ teams: t, history, unsold }) => {
            setPhase('completed');
            setTeams(t);
        });

        s.on('playerLeft', ({ playerName: name, team }) => {
            console.log(`${name} (${team}) disconnected`);
        });

        s.on('error', ({ message }) => {
            setError(message);
            setTimeout(() => setError(null), 5000);
        });

        // Fetch static data
        fetch(`${url}/api/players`).then(r => r.json()).then(setAllPlayers).catch(() => { });
        fetch(`${url}/api/teams`).then(r => r.json()).then(setAllTeamsData).catch(() => { });

        return () => s.disconnect();
    }, []);

    const createRoom = useCallback((name, teamChoice) => {
        setPlayerName(name);
        socketRef.current?.emit('createRoom', { playerName: name, teamChoice });
    }, []);

    const joinRoom = useCallback((code, name, teamChoice) => {
        setPlayerName(name);
        socketRef.current?.emit('joinRoom', { roomCode: code, playerName: name, teamChoice });
    }, []);

    const startAuction = useCallback(() => {
        socketRef.current?.emit('startAuction', { roomCode });
    }, [roomCode]);

    const placeBid = useCallback((amount) => {
        socketRef.current?.emit('placeBid', { roomCode, amount });
    }, [roomCode]);

    const skipPlayer = useCallback(() => {
        socketRef.current?.emit('skipPlayer', { roomCode });
    }, [roomCode]);

    const getMinIncrement = useCallback(() => {
        if (highestBid < 100) return 5;
        if (highestBid < 200) return 10;
        if (highestBid < 500) return 15;
        if (highestBid < 1000) return 20;
        return 25;
    }, [highestBid]);

    const value = {
        socket, connected, roomCode, playerName, myTeam, isHost,
        phase, setPhase, teams, currentPlayer, currentCategory,
        currentCategoryIndex, playerIndex, totalInCategory,
        timer, highestBid, highestBidder, bidHistory, lastBid,
        soldPlayer, unsoldPlayer, auctionHistory, connectedUsers,
        error, allPlayers, allTeamsData,
        createRoom, joinRoom, startAuction, placeBid, skipPlayer,
        getMinIncrement
    };

    return (
        <AuctionContext.Provider value={value}>
            {children}
        </AuctionContext.Provider>
    );
}
