import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Wallet, Medal, Star } from 'lucide-react';

function formatPrice(lakh) {
    if (lakh >= 100) return `₹${(lakh / 100).toFixed(2)} Cr`;
    return `₹${lakh} L`;
}

export default function Leaderboard() {
    const { auctionHistory, teams } = useAuction();

    // Most expensive players
    const sortedByPrice = [...auctionHistory].sort((a, b) => b.price - a.price);

    // Team spending
    const teamSpending = teams
        .map(t => ({ ...t, spent: 12500 - t.purse, count: t.players.length }))
        .sort((a, b) => b.spent - a.spent);

    // By category
    const categoryStats = {};
    auctionHistory.forEach(h => {
        const cat = h.player.specialism;
        if (!categoryStats[cat]) categoryStats[cat] = { total: 0, count: 0, highest: 0, highestPlayer: null };
        categoryStats[cat].total += h.price;
        categoryStats[cat].count++;
        if (h.price > categoryStats[cat].highest) {
            categoryStats[cat].highest = h.price;
            categoryStats[cat].highestPlayer = h.player.name;
        }
    });

    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="min-h-screen pt-20 px-4 pb-8">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <h1 className="font-display text-3xl font-black gradient-text mb-2">LEADERBOARD</h1>
                    <p className="text-white/40">{auctionHistory.length} players sold so far</p>
                </motion.div>

                {auctionHistory.length === 0 ? (
                    <div className="glass-strong p-12 text-center max-w-md mx-auto">
                        <Trophy size={48} className="text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">No players sold yet. Start the auction to see the leaderboard!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Most Expensive Players */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={18} className="text-ipl-gold" />
                                <h2 className="font-display text-lg font-bold text-white">MOST EXPENSIVE</h2>
                            </div>
                            <div className="space-y-2">
                                {sortedByPrice.slice(0, 15).map((item, i) => {
                                    const team = teams.find(t => t.shortName === item.team);
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center gap-3 glass px-4 py-3"
                                            style={{ borderRadius: '10px', borderColor: team?.primaryColor + '30' }}
                                        >
                                            <span className="text-lg w-8 text-center">{i < 3 ? medals[i] : <span className="text-white/30 text-sm">{i + 1}</span>}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-white truncate">{item.player.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-white/40">
                                                    <span style={{ color: team?.primaryColor }}>{item.teamName}</span>
                                                    <span>•</span>
                                                    <span>{item.player.specialism}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-display text-sm font-bold gradient-text">{formatPrice(item.price)}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>

                        {/* Team Spending */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-strong p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Wallet size={18} className="text-ipl-gold" />
                                <h2 className="font-display text-lg font-bold text-white">TEAM SPENDING</h2>
                            </div>
                            <div className="space-y-3">
                                {teamSpending.map((team, i) => (
                                    <motion.div
                                        key={team.shortName}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + i * 0.05 }}
                                    >
                                        <div className="flex items-center gap-3 mb-1">
                                            <img src={team.logo} alt="" className="w-8 h-8 object-contain"
                                                onError={e => { e.target.style.display = 'none'; }} />
                                            <span className="font-bold text-sm flex-1" style={{ color: team.primaryColor }}>{team.shortName}</span>
                                            <span className="text-white/40 text-xs">{team.count} players</span>
                                            <span className="font-display text-sm font-bold text-white">{formatPrice(team.spent)}</span>
                                        </div>
                                        <div className="purse-bar ml-11">
                                            <div
                                                className="purse-bar-fill"
                                                style={{
                                                    width: `${(team.spent / 12500) * 100}%`,
                                                    background: team.primaryColor
                                                }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Category Breakdown */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-strong p-6 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <Star size={18} className="text-ipl-gold" />
                                <h2 className="font-display text-lg font-bold text-white">CATEGORY BREAKDOWN</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {Object.entries(categoryStats).map(([cat, stats]) => {
                                    const icons = { 'BATTER': '🏏', 'BOWLER': '🎯', 'ALL-ROUNDER': '⚡', 'WICKETKEEPER': '🧤' };
                                    return (
                                        <div key={cat} className="glass p-4 text-center">
                                            <span className="text-2xl">{icons[cat]}</span>
                                            <h3 className="font-display text-sm font-bold text-white mt-2">
                                                {cat === 'ALL-ROUNDER' ? 'ALL-ROUNDERS' : cat === 'WICKETKEEPER' ? 'WK' : cat + 'S'}
                                            </h3>
                                            <p className="text-white/40 text-xs">{stats.count} sold</p>
                                            <div className="mt-3 space-y-1">
                                                <div>
                                                    <p className="text-white/30 text-[10px]">Total Spent</p>
                                                    <p className="font-display text-sm font-bold text-ipl-gold">{formatPrice(stats.total)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-white/30 text-[10px]">Highest</p>
                                                    <p className="font-display text-sm font-bold text-white">{formatPrice(stats.highest)}</p>
                                                    <p className="text-[10px] text-white/40 truncate">{stats.highestPlayer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
