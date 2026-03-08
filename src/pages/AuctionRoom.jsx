import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Gavel, TrendingUp, SkipForward, ChevronDown, ChevronUp, Users, Shield, Lock } from 'lucide-react';
import { CountryFlag, TeamLogo, getPlayerAvatarSvg } from '../utils/flags';

const categoryColors = {
    'BATTER': { bg: 'from-blue-600/20 to-blue-900/20', badge: 'badge-batter', label: '🏏 BATTERS', color: '#3b82f6' },
    'BOWLER': { bg: 'from-red-600/20 to-red-900/20', badge: 'badge-bowler', label: '🎯 BOWLERS', color: '#ef4444' },
    'ALL-ROUNDER': { bg: 'from-purple-600/20 to-purple-900/20', badge: 'badge-allrounder', label: '⚡ ALL-ROUNDERS', color: '#8b5cf6' },
    'WICKETKEEPER': { bg: 'from-amber-600/20 to-amber-900/20', badge: 'badge-wicketkeeper', label: '🧤 WICKET-KEEPERS', color: '#f59e0b' }
};

function CircularTimer({ value, max = 15 }) {
    const r = 36, c = 2 * Math.PI * r;
    const off = c - (value / max) * c;
    const col = value <= 3 ? '#ef4444' : value <= 7 ? '#f59e0b' : '#22c55e';
    return (
        <div className="timer-circle" style={{ width: '90px', height: '90px' }}>
            <svg width="90" height="90">
                <circle cx="45" cy="45" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
                <circle cx="45" cy="45" r={r} stroke={col} strokeWidth="5" fill="none" strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={off}
                    style={{ transition: 'stroke-dashoffset 0.5s, stroke 0.5s', filter: `drop-shadow(0 0 6px ${col})` }} />
            </svg>
            <span className="timer-text" style={{ color: col, fontSize: '28px' }}>{value}</span>
        </div>
    );
}

function formatPrice(lakh) {
    if (lakh >= 100) return `₹${(lakh / 100).toFixed(2)} Cr`;
    return `₹${lakh} L`;
}

export default function AuctionRoom() {
    const navigate = useNavigate();
    const {
        roomCode, phase, teams, currentPlayer, currentCategory,
        currentCategoryIndex, playerIndex, totalInCategory,
        timer, highestBid, highestBidder, bidHistory,
        soldPlayer, unsoldPlayer, myTeam, isHost,
        placeBid, skipPlayer, getMinIncrement
    } = useAuction();
    const [showSold, setShowSold] = useState(false);
    const [showUnsold, setShowUnsold] = useState(false);
    const [showSquad, setShowSquad] = useState(true);
    const confettiRef = useRef(false);

    useEffect(() => { if (!roomCode) navigate('/'); }, [roomCode, navigate]);

    useEffect(() => {
        if (soldPlayer && !confettiRef.current) {
            confettiRef.current = true;
            setShowSold(true);
            confetti({ particleCount: soldPlayer.price >= 500 ? 150 : 60, spread: 100, origin: { y: 0.5 }, colors: [soldPlayer.teamColor || '#d4af37', '#fff', '#FFD700'] });
            setTimeout(() => { setShowSold(false); confettiRef.current = false; }, 2800);
        }
    }, [soldPlayer]);

    useEffect(() => { if (unsoldPlayer) { setShowUnsold(true); setTimeout(() => setShowUnsold(false), 2500); } }, [unsoldPlayer]);

    const myTeamData = teams.find(t => t.shortName === myTeam);
    const catInfo = categoryColors[currentCategory] || categoryColors['BATTER'];
    const minBid = highestBid + getMinIncrement();
    const slots = 25;
    const used = myTeamData ? myTeamData.players.length : 0;
    const avail = slots - used;
    const canBid = myTeamData && myTeamData.purse >= minBid && avail > 0 && highestBidder !== myTeam;

    const bidAmounts = [
        minBid,
        minBid + getMinIncrement(),
        minBid + getMinIncrement() * 2,
        minBid + getMinIncrement() * 5
    ].filter(a => a <= (myTeamData?.purse || 0));

    const mySquad = myTeamData ? {
        'BATTER': myTeamData.players.filter(p => p.specialism === 'BATTER'),
        'BOWLER': myTeamData.players.filter(p => p.specialism === 'BOWLER'),
        'ALL-ROUNDER': myTeamData.players.filter(p => p.specialism === 'ALL-ROUNDER'),
        'WICKETKEEPER': myTeamData.players.filter(p => p.specialism === 'WICKETKEEPER'),
    } : {};

    const teamBg = myTeamData
        ? `radial-gradient(ellipse at top left, ${myTeamData.primaryColor}12 0%, transparent 40%), radial-gradient(ellipse at bottom right, ${myTeamData.secondaryColor || myTeamData.primaryColor}08 0%, transparent 40%)`
        : '';

    if (phase === 'completed') {
        return (
            <div className="min-h-screen pt-16 flex items-center justify-center" style={{ background: teamBg }}>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong p-12 text-center max-w-lg">
                    <div className="text-6xl mb-4">🏆</div>
                    <h1 className="font-display text-3xl font-black gradient-text mb-3">AUCTION COMPLETED!</h1>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/teams')} className="btn-primary">View Teams</button>
                        <button onClick={() => navigate('/leaderboard')} className="btn-secondary">Leaderboard</button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden" style={{ background: teamBg }}>
            <div className="h-14 flex-shrink-0" />

            {/* Category Strip */}
            <motion.div key={currentCategory} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className={`bg-gradient-to-r ${catInfo.bg} border-b border-white/5 px-4 py-2 flex-shrink-0`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">{catInfo.label.split(' ')[0]}</span>
                        <div>
                            <h2 className="font-display text-base font-bold text-white">{catInfo.label.split(' ').slice(1).join(' ')}</h2>
                            <p className="text-white/40 text-xs">Set {currentCategoryIndex + 1}/4 • Player {playerIndex + 1}/{totalInCategory}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <CircularTimer value={timer} />
                        {isHost && (
                            <button onClick={skipPlayer} className="btn-secondary flex items-center gap-1 text-xs py-2 px-3"><SkipForward size={14} /> Skip</button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Main */}
            <div className="flex-1 flex overflow-hidden">
                {/* Player Card */}
                <div className="flex-1 flex flex-col overflow-y-auto p-3 lg:p-4">
                    <AnimatePresence mode="wait">
                        {currentPlayer && (
                            <motion.div
                                key={currentPlayer.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.35 }}
                                className="flex-1 flex flex-col relative overflow-hidden rounded-2xl"
                                style={{
                                    background: `linear-gradient(135deg, rgba(15,23,42,0.95), rgba(15,23,42,0.85))`,
                                    border: `1px solid ${catInfo.color}25`,
                                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 30px rgba(0,0,0,0.3)`
                                }}
                            >
                                {/* Sold / Unsold overlays */}
                                {showSold && soldPlayer && (
                                    <div className="sold-overlay">
                                        <div className="text-center">
                                            <div className="sold-badge mb-3">SOLD!</div>
                                            <p className="text-3xl font-display font-bold text-white">{formatPrice(soldPlayer.price)}</p>
                                            <div className="flex items-center justify-center gap-2 mt-2">
                                                <TeamLogo team={teams.find(t => t.shortName === soldPlayer.team) || {}} size={28} />
                                                <span className="text-lg" style={{ color: teams.find(t => t.shortName === soldPlayer.team)?.primaryColor }}>
                                                    {soldPlayer.teamName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {showUnsold && (
                                    <div className="sold-overlay">
                                        <div className="font-display text-4xl font-black text-white/40" style={{ transform: 'rotate(-12deg)', border: '4px solid rgba(255,255,255,0.2)', padding: '12px 32px', borderRadius: '8px' }}>UNSOLD</div>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 flex flex-col p-5 lg:p-6">
                                    {/* Player Info */}
                                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-5">
                                        {/* Avatar with player image attempt */}
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={getPlayerAvatarSvg(currentPlayer.name, catInfo.color)}
                                                alt={currentPlayer.name}
                                                className="rounded-full"
                                                style={{ width: 130, height: 130, border: `3px solid ${catInfo.color}30` }}
                                            />
                                            <div className="absolute -bottom-1 -right-1">
                                                <CountryFlag country={currentPlayer.country} size={28} />
                                            </div>
                                        </div>

                                        <div className="flex-1 text-center lg:text-left min-w-0">
                                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-2">
                                                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${catInfo.badge}`}>{currentPlayer.specialism}</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentPlayer.cappedStatus === 'Capped' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/50'
                                                    }`}>{currentPlayer.cappedStatus}</span>
                                                <CountryFlag country={currentPlayer.country} size={22} />
                                                <span className="text-white/40 text-base">{currentPlayer.country} • Age {currentPlayer.age}</span>
                                            </div>

                                            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-3 leading-tight">{currentPlayer.name}</h1>

                                            <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
                                                {currentPlayer.battingStyle && (
                                                    <span className="px-4 py-1.5 text-base text-white/50 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>🏏 {currentPlayer.battingStyle}</span>
                                                )}
                                                {currentPlayer.bowlingStyle && (
                                                    <span className="px-4 py-1.5 text-base text-white/50 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>🎯 {currentPlayer.bowlingStyle}</span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-4 gap-3 max-w-lg">
                                                {[
                                                    { label: 'Tests', val: currentPlayer.testCaps },
                                                    { label: 'ODIs', val: currentPlayer.odiCaps },
                                                    { label: 'T20Is', val: currentPlayer.t20Caps },
                                                    { label: 'IPL', val: currentPlayer.iplCaps },
                                                ].map(s => (
                                                    <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <p className="font-display text-2xl font-bold text-ipl-gold">{s.val || '-'}</p>
                                                        <p className="text-xs text-white/30">{s.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Base Price & Bid Buttons */}
                                    <div className="mt-6 pt-5 border-t border-white/[0.06]">
                                        <div className="mb-5">
                                            <p className="text-white/40 text-sm uppercase tracking-wider">Base Price</p>
                                            <p className="font-display text-2xl font-bold text-white/50">{formatPrice(currentPlayer.basePrice)}</p>
                                        </div>

                                        {/* Bid buttons */}
                                        <div>
                                            <p className="text-white/40 text-sm mb-3 flex items-center gap-2">
                                                <Gavel size={16} />
                                                {myTeamData && <TeamLogo team={myTeamData} size={20} />}
                                                <span className="font-bold">YOUR BID ({myTeam})</span>
                                                <span className="ml-auto text-white/30">{avail} slots left</span>
                                            </p>
                                            <div className="flex flex-wrap gap-4">
                                                {bidAmounts.map(amount => (
                                                    <button
                                                        key={amount}
                                                        onClick={() => placeBid(amount)}
                                                        disabled={!canBid}
                                                        className="font-display font-bold text-xl px-10 py-5 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                                        style={{
                                                            background: myTeamData ? `linear-gradient(135deg, ${myTeamData.primaryColor}35, ${myTeamData.secondaryColor || myTeamData.primaryColor}20)` : 'rgba(255,255,255,0.05)',
                                                            borderColor: myTeamData ? `${myTeamData.primaryColor}70` : 'rgba(255,255,255,0.1)',
                                                            color: myTeamData?.primaryColor || '#fff',
                                                            boxShadow: canBid ? `0 6px 25px ${myTeamData?.primaryColor}25` : 'none'
                                                        }}
                                                    >
                                                        {formatPrice(amount)}
                                                    </button>
                                                ))}
                                            </div>
                                            {highestBidder === myTeam && (
                                                <p className="text-green-400 text-base mt-3 flex items-center gap-2"><TrendingUp size={16} /> You have the highest bid!</p>
                                            )}
                                            {avail <= 0 && <p className="text-red-400 text-base mt-3 flex items-center gap-2"><Lock size={16} /> Squad full (25/25)</p>}
                                        </div>
                                    </div>

                                    {/* Bottom: Current Bid + Bid History */}
                                    <div className="mt-auto pt-8 flex gap-6 items-end">
                                        {/* Left: Current Bid with big logo */}
                                        <div className="flex-1 flex items-center gap-6">
                                            {highestBidder && (
                                                <motion.div key={highestBidder} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                                    <TeamLogo team={teams.find(t => t.shortName === highestBidder) || {}} size={96} />
                                                </motion.div>
                                            )}
                                            <div>
                                                <p className="text-white/40 text-sm uppercase tracking-wider">Current Bid</p>
                                                <motion.p key={highestBid} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-display text-6xl lg:text-7xl font-black gradient-text leading-none py-2">{formatPrice(highestBid)}</motion.p>
                                                {highestBidder && (
                                                    <p className="text-xl font-bold" style={{ color: teams.find(t => t.shortName === highestBidder)?.primaryColor }}>
                                                        {teams.find(t => t.shortName === highestBidder)?.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Bid History in the main area */}
                                        <div className="w-80 flex-shrink-0 overflow-y-auto rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '200px' }}>
                                            <h3 className="font-display text-xs font-bold text-white/30 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                                <TrendingUp size={12} /> BID HISTORY
                                            </h3>
                                            {bidHistory.length === 0 ? (
                                                <p className="text-white/15 text-sm">Waiting for bids...</p>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {[...bidHistory].reverse().slice(0, 10).map((bid, i) => {
                                                        const t = teams.find(tm => tm.shortName === bid.team);
                                                        return (
                                                            <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                                                className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg"
                                                                style={{ background: `${t?.primaryColor || '#fff'}10` }}>
                                                                <span className="flex items-center gap-1.5 font-medium" style={{ color: t?.primaryColor }}>
                                                                    <TeamLogo team={t || {}} size={16} /> {bid.team} {bid.isBot ? '🤖' : ''}
                                                                </span>
                                                                <span className="font-display font-bold text-white text-xs">{formatPrice(bid.amount)}</span>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Right Sidebar */}
                <div className="w-[420px] flex-shrink-0 flex flex-col overflow-hidden"
                    style={{
                        borderLeft: myTeamData ? `3px solid ${myTeamData.primaryColor}35` : '1px solid rgba(255,255,255,0.05)',
                        background: myTeamData ? `linear-gradient(180deg, ${myTeamData.primaryColor}08 0%, transparent 30%)` : 'rgba(0,0,0,0.2)'
                    }}>
                    {/* Team header */}
                    {myTeamData && (
                        <div className="p-4 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${myTeamData.primaryColor}15, transparent)`, borderBottom: `1px solid ${myTeamData.primaryColor}15` }}>
                            <div className="flex items-center gap-3 mb-3">
                                <TeamLogo team={myTeamData} size={40} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-display font-bold text-base" style={{ color: myTeamData.primaryColor }}>{myTeamData.name}</p>
                                    <p className="text-white/40 text-xs">{used}/{slots} slots • {avail} remaining</p>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-white/40">Purse</span>
                                <span className="font-display font-bold text-lg text-ipl-gold">{formatPrice(myTeamData.purse)}</span>
                            </div>
                            <div className="purse-bar">
                                <div className="purse-bar-fill" style={{ width: `${(myTeamData.purse / 12500) * 100}%`, background: `linear-gradient(90deg, ${myTeamData.primaryColor}, ${myTeamData.secondaryColor || myTeamData.primaryColor})` }} />
                            </div>
                        </div>
                    )}

                    {/* My Squad */}
                    <div className="flex-1 overflow-y-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setShowSquad(!showSquad)} className="w-full px-4 py-2.5 flex items-center justify-between text-sm font-bold text-white/50 hover:bg-white/5 transition-all">
                            <span className="flex items-center gap-2"><Users size={14} className="text-ipl-gold" /> MY SQUAD ({used})</span>
                            {showSquad ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showSquad && (
                            <div className="px-4 pb-3 overflow-y-auto">
                                {Object.entries(mySquad).map(([role, players]) => {
                                    if (players.length === 0) return null;
                                    const rInfo = categoryColors[role];
                                    return (
                                        <div key={role} className="mb-3">
                                            <p className="text-[10px] font-bold uppercase mb-1.5" style={{ color: rInfo.color }}>
                                                {rInfo.label.split(' ')[0]} {role === 'ALL-ROUNDER' ? 'AR' : role === 'WICKETKEEPER' ? 'WK' : role + 'S'} ({players.length})
                                            </p>
                                            {players.map((p, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg mb-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    {p.country && <CountryFlag country={p.country} size={16} />}
                                                    <span className="text-white truncate flex-1 font-medium">
                                                        {p.retained && <Shield size={10} className="inline text-ipl-gold mr-1" style={{ verticalAlign: 'middle' }} />}
                                                        {p.name}
                                                    </span>
                                                    {p.retained ? (
                                                        <span className="text-ipl-gold/60 text-[10px] font-bold bg-ipl-gold/10 px-2 py-0.5 rounded">RTN</span>
                                                    ) : (
                                                        <span className="font-display text-ipl-gold font-bold text-xs">{formatPrice(p.soldPrice)}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                                {used === 0 && <p className="text-white/15 text-xs text-center py-2">No players yet</p>}
                            </div>
                        )}
                    </div>

                    {/* All Teams */}
                    <div className="p-4 flex-shrink-0 max-h-48 overflow-y-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 className="font-display text-xs font-bold text-white/30 mb-2 uppercase tracking-wider">All Teams</h3>
                        {teams.map(t => (
                            <div key={t.shortName} className="flex items-center gap-2 text-xs mb-1 py-0.5">
                                <TeamLogo team={t} size={18} />
                                <span className="font-bold w-12" style={{ color: t.primaryColor }}>{t.shortName}</span>
                                <span className="text-white/30 flex-1">{t.players.length}/{slots}</span>
                                <span className="font-display font-medium text-white/60">{formatPrice(t.purse)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
