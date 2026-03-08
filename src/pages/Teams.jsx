import React from 'react';
import { useAuction } from '../context/AuctionContext';
import { motion } from 'framer-motion';
import { Wallet, Users, Crown, Bot } from 'lucide-react';
import { TeamLogo } from '../utils/flags';

function formatPrice(lakh) {
    if (lakh >= 100) return `₹${(lakh / 100).toFixed(2)} Cr`;
    return `₹${lakh} L`;
}

export default function Teams() {
    const { teams, myTeam } = useAuction();

    return (
        <div className="min-h-screen pt-28 px-4 pb-8">
            <div className="max-w-7xl mx-auto">


                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teams.map((team, i) => (
                        <motion.div
                            key={team.shortName}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`glass-strong p-6 relative overflow-hidden ${team.shortName === myTeam ? 'ring-2 ring-ipl-gold' : ''}`}
                        >
                            {/* Background accent */}
                            <div
                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10"
                                style={{ background: team.primaryColor }}
                            />

                            <div className="relative z-10">
                                {/* Team Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <TeamLogo team={team} size={64} />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-display text-lg font-bold" style={{ color: team.primaryColor }}>{team.name}</h3>
                                            {team.shortName === myTeam && <Crown size={14} className="text-ipl-gold" />}
                                            {team.isBot && <Bot size={14} className="text-cyan-400" />}
                                        </div>
                                        {team.ownerName && (
                                            <p className="text-white/40 text-sm">{team.isBot ? '🤖 AI Controlled' : `👤 ${team.ownerName}`}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Purse */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="text-white/50 flex items-center gap-1"><Wallet size={12} /> Purse</span>
                                        <span className="font-display font-bold text-ipl-gold">{formatPrice(team.purse)}</span>
                                    </div>
                                    <div className="purse-bar">
                                        <div
                                            className="purse-bar-fill"
                                            style={{
                                                width: `${(team.purse / 12500) * 100}%`,
                                                background: `linear-gradient(90deg, ${team.primaryColor}, ${team.secondaryColor || team.primaryColor})`
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-white/30 mt-1">
                                        <span>Spent: {formatPrice(12500 - team.purse)}</span>
                                        <span>{team.players.length}/25 players</span>
                                    </div>
                                </div>

                                {/* Players bought */}
                                {team.players.length > 0 ? (
                                    <div>
                                        <p className="text-white/50 text-xs mb-2 flex items-center gap-1">
                                            <Users size={12} /> Squad ({team.players.length})
                                        </p>
                                        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                                            {team.players.map((p, j) => (
                                                <div key={j} className="flex items-center justify-between glass px-3 py-2 text-xs" style={{ borderRadius: '8px' }}>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ipl-gold/20 to-blue-500/20 flex items-center justify-center text-[8px] font-bold text-white/60">
                                                            {p.name.split(' ').map(w => w[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <span className="text-white font-medium">{p.name}</span>
                                                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${p.specialism === 'BATTER' ? 'badge-batter' :
                                                                p.specialism === 'BOWLER' ? 'badge-bowler' :
                                                                    p.specialism === 'ALL-ROUNDER' ? 'badge-allrounder' :
                                                                        'badge-wicketkeeper'
                                                                }`}>
                                                                {p.specialism === 'ALL-ROUNDER' ? 'AR' : p.specialism === 'WICKETKEEPER' ? 'WK' : p.specialism.slice(0, 3)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="font-display font-bold text-ipl-gold">{formatPrice(p.soldPrice)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-white/20 text-sm text-center py-4">No players bought yet</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
