import React, { useState, useEffect } from 'react';
import { useAuction } from '../context/AuctionContext';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronDown } from 'lucide-react';

const roleFilters = ['ALL', 'BATTER', 'BOWLER', 'ALL-ROUNDER', 'WICKETKEEPER'];
const statusFilters = ['ALL', 'Capped', 'Uncapped'];
const priceFilters = ['ALL', '200', '150', '100', '75', '50', '40', '30'];

const roleIcons = {
    'BATTER': '🏏',
    'BOWLER': '🎯',
    'ALL-ROUNDER': '⚡',
    'WICKETKEEPER': '🧤'
};

function formatPrice(lakh) {
    if (lakh >= 100) return `₹${(lakh / 100).toFixed(2)} Cr`;
    return `₹${lakh} L`;
}

export default function PlayerPool() {
    const { allPlayers } = useAuction();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priceFilter, setPriceFilter] = useState('ALL');
    const [expandedId, setExpandedId] = useState(null);

    const filtered = allPlayers.filter(p => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.country.toLowerCase().includes(search.toLowerCase())) return false;
        if (roleFilter !== 'ALL' && p.specialism !== roleFilter) return false;
        if (statusFilter !== 'ALL' && p.cappedStatus !== statusFilter) return false;
        if (priceFilter !== 'ALL' && p.basePrice !== parseInt(priceFilter)) return false;
        return true;
    });

    const grouped = {};
    filtered.forEach(p => {
        if (!grouped[p.specialism]) grouped[p.specialism] = [];
        grouped[p.specialism].push(p);
    });

    return (
        <div className="min-h-screen pt-20 px-4 pb-8">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
                    <h1 className="font-display text-3xl font-black gradient-text mb-2">PLAYER POOL</h1>
                    <p className="text-white/40">{allPlayers.length} players from the TATA IPL 2026 Auction List</p>
                </motion.div>

                {/* Filters */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-3 text-white/30" />
                            <input
                                type="text"
                                placeholder="Search players..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="input-glass pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {roleFilters.map(role => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`category-tab text-xs ${roleFilter === role ? 'active' : ''}`}
                                >
                                    {role === 'ALL' ? '📋 All' : `${roleIcons[role]} ${role === 'ALL-ROUNDER' ? 'AR' : role === 'WICKETKEEPER' ? 'WK' : role}`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-3">
                        <div className="flex items-center gap-1 text-white/40 text-xs"><Filter size={12} /> Status:</div>
                        {statusFilters.map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1 rounded-full text-xs transition-all ${statusFilter === s ? 'bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30' : 'bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                        <div className="flex items-center gap-1 text-white/40 text-xs ml-2">Base ₹:</div>
                        {priceFilters.map(p => (
                            <button
                                key={p}
                                onClick={() => setPriceFilter(p)}
                                className={`px-3 py-1 rounded-full text-xs transition-all ${priceFilter === p ? 'bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30' : 'bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}
                            >
                                {p === 'ALL' ? 'All' : `${p}L`}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Results count */}
                <p className="text-white/30 text-sm mb-4">{filtered.length} players found</p>

                {/* Player sections by role */}
                {['BATTER', 'BOWLER', 'ALL-ROUNDER', 'WICKETKEEPER'].map(role => {
                    const players = grouped[role];
                    if (!players || players.length === 0) return null;
                    return (
                        <motion.div key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">{roleIcons[role]}</span>
                                <h2 className="font-display text-lg font-bold text-white">
                                    {role === 'ALL-ROUNDER' ? 'ALL-ROUNDERS' : role === 'WICKETKEEPER' ? 'WICKET-KEEPERS' : role + 'S'}
                                </h2>
                                <span className="text-white/30 text-sm">({players.length})</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {players.map((player, i) => (
                                    <motion.div
                                        key={player.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                                        className="glass p-4 cursor-pointer hover:bg-white/5 transition-all"
                                        onClick={() => setExpandedId(expandedId === player.id ? null : player.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ipl-gold/20 to-ipl-blue/20 flex items-center justify-center text-sm font-bold text-ipl-gold font-display border border-ipl-gold/20">
                                                {player.firstName[0]}{player.surname[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-white text-sm truncate">{player.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-white/40">
                                                    <span>{player.country}</span>
                                                    <span>•</span>
                                                    <span>Age {player.age}</span>
                                                    {player.team2025 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-ipl-gold/60">{player.team2025}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-display text-sm font-bold text-ipl-gold">{formatPrice(player.basePrice)}</p>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${player.cappedStatus === 'Capped' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                                                    }`}>
                                                    {player.cappedStatus}
                                                </span>
                                            </div>
                                        </div>

                                        {expandedId === player.id && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 pt-3 border-t border-white/10">
                                                <div className="flex flex-wrap gap-2 mb-2">
                                                    {player.battingStyle && <span className="glass px-2 py-1 text-[10px] text-white/50" style={{ borderRadius: '6px' }}>🏏 {player.battingStyle}</span>}
                                                    {player.bowlingStyle && <span className="glass px-2 py-1 text-[10px] text-white/50" style={{ borderRadius: '6px' }}>🎯 {player.bowlingStyle}</span>}
                                                </div>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { label: 'Tests', val: player.testCaps },
                                                        { label: 'ODIs', val: player.odiCaps },
                                                        { label: 'T20Is', val: player.t20Caps },
                                                        { label: 'IPL', val: player.iplCaps },
                                                    ].map(s => (
                                                        <div key={s.label} className="text-center">
                                                            <p className="font-display text-sm font-bold text-ipl-gold">{s.val || '-'}</p>
                                                            <p className="text-[9px] text-white/30">{s.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
