import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { motion } from 'framer-motion';
import { Copy, Check, Users, Play, Shield, Crown } from 'lucide-react';

export default function Lobby() {
    const navigate = useNavigate();
    const { roomCode, teams, isHost, startAuction, phase, myTeam, playerName } = useAuction();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!roomCode) navigate('/');
        if (phase === 'auction') navigate('/auction');
    }, [roomCode, phase, navigate]);

    const copyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const humanTeams = teams.filter(t => !t.isBot);
    const botTeams = teams.filter(t => t.isBot);

    return (
        <div className="min-h-screen pt-20 px-4 pb-8">
            <div className="max-w-5xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <h1 className="font-display text-3xl font-black gradient-text mb-2">AUCTION LOBBY</h1>
                    <p className="text-white/40">Share the room code with friends to join</p>
                </motion.div>

                {/* Room Code */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass-strong p-8 text-center mb-8 max-w-md mx-auto"
                >
                    <p className="text-white/50 text-sm mb-2">ROOM CODE</p>
                    <div className="flex items-center justify-center gap-4">
                        <span className="font-display text-5xl font-black tracking-[0.3em] gradient-text">
                            {roomCode}
                        </span>
                        <button
                            onClick={copyCode}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                        >
                            {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} className="text-white/60" />}
                        </button>
                    </div>
                </motion.div>

                {/* Connected Players */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Users size={18} className="text-ipl-gold" />
                        <h2 className="font-display text-lg font-bold text-white">
                            PLAYERS ({humanTeams.length}/10)
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {humanTeams.map(team => (
                            <div key={team.shortName} className="glass p-4 text-center" style={{ borderColor: team.primaryColor + '60' }}>
                                <img src={team.logo} alt={team.shortName} className="w-12 h-12 mx-auto mb-2 object-contain"
                                    onError={e => { e.target.style.display = 'none'; }} />
                                <p className="font-bold text-sm" style={{ color: team.primaryColor }}>{team.shortName}</p>
                                <p className="text-white/50 text-xs">{team.ownerName}</p>
                                {team.owner && team.shortName === myTeam && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-ipl-gold mt-1">
                                        <Crown size={10} /> You
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Bot Teams */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield size={18} className="text-cyan-400" />
                        <h2 className="font-display text-lg font-bold text-white">
                            AI TEAMS ({botTeams.length})
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {botTeams.map(team => (
                            <div key={team.shortName} className="glass p-4 text-center opacity-60" style={{ borderColor: team.primaryColor + '30' }}>
                                <img src={team.logo} alt={team.shortName} className="w-10 h-10 mx-auto mb-2 object-contain opacity-50"
                                    onError={e => { e.target.style.display = 'none'; }} />
                                <p className="font-bold text-sm" style={{ color: team.primaryColor }}>{team.shortName}</p>
                                <p className="text-white/30 text-xs">🤖 Bot</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Start Button */}
                {isHost && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center">
                        <button
                            onClick={startAuction}
                            className="btn-primary text-xl px-12 py-5 flex items-center gap-3 mx-auto glow-gold-strong"
                        >
                            <Play size={24} />
                            START AUCTION
                        </button>
                        <p className="text-white/30 text-xs mt-3">
                            Only the host (you) can start the auction. Remaining teams will be controlled by AI.
                        </p>
                    </motion.div>
                )}
                {!isHost && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
                        <div className="glass p-4 max-w-sm mx-auto">
                            <p className="text-white/60 text-sm">Waiting for host to start the auction...</p>
                            <div className="mt-3 flex justify-center">
                                <div className="w-8 h-8 border-2 border-ipl-gold border-t-transparent rounded-full animate-spin" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
