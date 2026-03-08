import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Users, ArrowRight, Mail, Lock, User, LogIn, UserPlus, Info, X } from 'lucide-react';
import { CountryFlag, TeamLogo } from '../utils/flags';

export default function Landing() {
    const navigate = useNavigate();
    const { createRoom, joinRoom, allTeamsData, phase, error } = useAuction();
    const [step, setStep] = useState('home'); // home | auth | create | join
    const [authMode, setAuthMode] = useState('login'); // login | register
    const [showAbout, setShowAbout] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [joinCode, setJoinCode] = useState('');
    const [authError, setAuthError] = useState('');
    const [user, setUser] = useState(null);

    // Load user from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('ipl_user');
        if (saved) {
            try {
                const u = JSON.parse(saved);
                setUser(u);
                setName(u.name);
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        if (phase === 'lobby') navigate('/lobby');
        if (phase === 'auction') navigate('/auction');
    }, [phase, navigate]);

    const handleAuth = async () => {
        setAuthError('');
        const url = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = authMode === 'login' ? { email, password } : { email, password, name };
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) { setAuthError(data.error || 'Something went wrong'); return; }
            setUser(data.user);
            setName(data.user.name);
            localStorage.setItem('ipl_user', JSON.stringify(data.user));
            setStep('home');
        } catch (e) {
            setAuthError('Server error. Please try again.');
        }
    };

    const handleCreate = () => {
        if (!name.trim() || !selectedTeam) return;
        createRoom(name.trim(), selectedTeam);
    };

    const handleJoin = () => {
        if (!name.trim() || !selectedTeam || !joinCode.trim()) return;
        joinRoom(joinCode.trim().toUpperCase(), name.trim(), selectedTeam);
    };

    const handleLogout = () => {
        setUser(null);
        setName('');
        localStorage.removeItem('ipl_user');
    };

    const selectedTeamData = allTeamsData.find(t => t.shortName === selectedTeam);
    const pageBg = selectedTeamData
        ? `radial-gradient(ellipse at top, ${selectedTeamData.primaryColor}12 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${selectedTeamData.secondaryColor || selectedTeamData.primaryColor}08 0%, transparent 50%)`
        : '';

    return (
        <div className="min-h-screen flex flex-col" style={{ background: pageBg }}>
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.015]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '80px 80px'
                }} />
            </div>

            {/* Top bar */}
            <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ipl-gold to-yellow-600 flex items-center justify-center">
                        <Trophy size={18} className="text-ipl-dark" />
                    </div>
                    <span className="font-display text-sm font-bold gradient-text tracking-wider">CRICKET AUCTION 2026</span>
                </div>
                {user ? (
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowAbout(true)} className="text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                            <Info size={18} />
                        </button>
                        <div className="text-right">
                            <p className="text-white text-sm font-semibold">{user.name}</p>
                            <p className="text-white/30 text-[10px]">{user.email}</p>
                        </div>
                        <button onClick={handleLogout} className="text-white/30 hover:text-white/60 text-xs transition-colors">Logout</button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowAbout(true)} className="text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer">
                            <Info size={18} />
                        </button>
                        <button onClick={() => setStep('auth')} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors border border-white/10 rounded-lg px-4 py-2 hover:bg-white/5 cursor-pointer">
                            <LogIn size={14} /> Sign In
                        </button>
                    </div>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 relative z-10 flex items-center justify-center px-6 py-8">
                <AnimatePresence mode="wait">
                    {step === 'home' && (
                        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="w-full max-w-4xl">
                            {/* Hero */}
                            <div className="text-center mb-10">
                                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black gradient-text mb-2 leading-tight">
                                    CRICKET AUCTION
                                </h1>
                                <p className="text-white/30 max-w-md mx-auto">
                                    350+ real players. 10 franchises. Build your dream squad, bid against AI or friends.
                                </p>
                            </div>

                            {/* Action cards */}
                            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 max-w-2xl mx-auto mb-12">
                                <button onClick={() => setStep('create')}
                                    className="group w-full sm:w-[260px] p-6 rounded-2xl border border-ipl-gold/20 bg-ipl-gold/[0.04] hover:bg-ipl-gold/[0.08] hover:border-ipl-gold/40 transition-all flex flex-col items-center justify-center text-center"
                                >
                                    <Zap size={28} className="text-ipl-gold mb-3" />
                                    <h3 className="font-display font-bold text-white text-lg mb-1">Create Room</h3>
                                    <p className="text-white/30 text-sm">Start a new auction session</p>
                                </button>
                                <button onClick={() => setStep('join')}
                                    className="group w-full sm:w-[260px] p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all flex flex-col items-center justify-center text-center"
                                >
                                    <Users size={28} className="text-white/50 mb-3" />
                                    <h3 className="font-display font-bold text-white text-lg mb-1">Join Room</h3>
                                    <p className="text-white/30 text-sm">Enter a room code to join</p>
                                </button>
                            </div>

                            {/* Teams showcase */}
                            <div className="flex justify-center gap-3 flex-wrap">
                                {allTeamsData.map((team, i) => (
                                    <motion.div
                                        key={team.shortName}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.04 }}
                                        className="w-20 h-20 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center hover:scale-110 transition-transform"
                                    >
                                        <TeamLogo team={team} size={50} />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 'auth' && (
                        <motion.div key="auth" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-sm">
                            <button onClick={() => setStep('home')} className="text-white/30 hover:text-white/60 text-sm mb-6 transition-colors">← Back</button>
                            <div className="p-8 rounded-2xl border border-white/10" style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(20px)' }}>
                                {/* Toggle login/register */}
                                <div className="flex mb-6 rounded-lg overflow-hidden border border-white/10">
                                    <button onClick={() => setAuthMode('login')} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${authMode === 'login' ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white/40 hover:text-white/60'}`}>
                                        Sign In
                                    </button>
                                    <button onClick={() => setAuthMode('register')} className={`flex-1 py-2.5 text-sm font-semibold transition-all ${authMode === 'register' ? 'bg-ipl-gold/20 text-ipl-gold' : 'text-white/40 hover:text-white/60'}`}>
                                        Register
                                    </button>
                                </div>

                                {authError && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{authError}</p>}

                                <div className="space-y-4">
                                    {authMode === 'register' && (
                                        <div>
                                            <label className="text-white/40 text-xs font-medium mb-1.5 block">FULL NAME</label>
                                            <div className="relative">
                                                <User size={16} className="absolute left-3 top-3 text-white/20" />
                                                <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                                                    className="input-glass pl-10" maxLength={30} />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="text-white/40 text-xs font-medium mb-1.5 block">EMAIL</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-3 text-white/20" />
                                            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                                                className="input-glass pl-10" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-white/40 text-xs font-medium mb-1.5 block">PASSWORD</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3 top-3 text-white/20" />
                                            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                                                className="input-glass pl-10" />
                                        </div>
                                    </div>
                                    <button onClick={handleAuth}
                                        className="w-full bg-gradient-to-r from-ipl-gold to-yellow-500 text-ipl-dark font-display font-bold tracking-wider uppercase py-3 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-2">
                                        {authMode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {(step === 'create' || step === 'join') && (
                        <motion.div key="form" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="w-full max-w-2xl"
                        >
                            <button onClick={() => { setStep('home'); setSelectedTeam(null); }} className="text-white/30 hover:text-white/60 text-sm mb-4 transition-colors">← Back</button>

                            <div className="p-8 rounded-2xl border transition-all" style={{
                                background: selectedTeamData ? `linear-gradient(135deg, ${selectedTeamData.primaryColor}08, rgba(15,23,42,0.9))` : 'rgba(15,23,42,0.8)',
                                borderColor: selectedTeamData ? `${selectedTeamData.primaryColor}30` : 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: selectedTeamData ? `0 0 60px ${selectedTeamData.primaryColor}08` : 'none'
                            }}>
                                <h2 className="font-display text-2xl font-bold text-white mb-1">
                                    {step === 'create' ? 'CREATE AUCTION ROOM' : 'JOIN AUCTION ROOM'}
                                </h2>
                                <p className="text-white/30 text-sm mb-6">
                                    {step === 'create' ? 'Pick your franchise and start the auction' : 'Enter the room code shared by the host'}
                                </p>

                                {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Left column: inputs */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-white/40 text-xs font-medium mb-1.5 block">YOUR NAME</label>
                                            <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)}
                                                className="input-glass" maxLength={20} />
                                        </div>

                                        {step === 'join' && (
                                            <div>
                                                <label className="text-white/40 text-xs font-medium mb-1.5 block">ROOM CODE</label>
                                                <input type="text" placeholder="ABC123" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                                    className="input-glass font-mono tracking-[0.3em] text-center text-lg" maxLength={6} />
                                            </div>
                                        )}

                                        <button
                                            onClick={step === 'create' ? handleCreate : handleJoin}
                                            disabled={!name.trim() || !selectedTeam || (step === 'join' && !joinCode.trim())}
                                            className="w-full font-display font-bold tracking-wider uppercase py-4 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                            style={{
                                                background: selectedTeamData ? `linear-gradient(135deg, ${selectedTeamData.primaryColor}, ${selectedTeamData.secondaryColor || selectedTeamData.primaryColor})` : 'linear-gradient(135deg, #d4af37, #b8941f)',
                                                color: selectedTeamData?.shortName === 'GT' ? '#fff' : '#0a0e1a',
                                                boxShadow: selectedTeamData ? `0 4px 20px ${selectedTeamData.primaryColor}40` : '0 4px 20px rgba(212,175,55,0.3)'
                                            }}
                                        >
                                            {step === 'create' ? 'Create Room' : 'Join Room'} <ArrowRight size={20} />
                                        </button>
                                    </div>

                                    {/* Right column: team picker */}
                                    <div>
                                        <label className="text-white/40 text-xs font-medium mb-2 block">PICK YOUR FRANCHISE</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {allTeamsData.map(team => (
                                                <button
                                                    key={team.shortName}
                                                    onClick={() => setSelectedTeam(team.shortName)}
                                                    className={`flex items-center justify-center p-3 rounded-xl transition-all border ${selectedTeam === team.shortName
                                                        ? 'scale-[1.08]'
                                                        : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10'
                                                        }`}
                                                    style={selectedTeam === team.shortName ? {
                                                        borderColor: `${team.primaryColor}60`,
                                                        background: `${team.primaryColor}15`,
                                                        boxShadow: `0 0 15px ${team.primaryColor}20`
                                                    } : {}}
                                                >
                                                    <TeamLogo team={team} size={48} />
                                                </button>
                                            ))}
                                        </div>
                                        {selectedTeamData && (
                                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                                className="mt-4 p-3 rounded-xl border flex items-center gap-3"
                                                style={{ borderColor: `${selectedTeamData.primaryColor}30`, background: `${selectedTeamData.primaryColor}08` }}
                                            >
                                                <TeamLogo team={selectedTeamData} size={36} />
                                                <div>
                                                    <p className="font-display font-bold text-sm" style={{ color: selectedTeamData.primaryColor }}>{selectedTeamData.name}</p>
                                                    <p className="text-white/30 text-[10px]">₹125.00 Cr Purse • 25 Slots</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* About Modal */}
            <AnimatePresence>
                {showAbout && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAbout(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg p-8 rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowAbout(false)}
                                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="font-display text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-ipl-gold to-yellow-500 mb-4">
                                ICL 2026 Mini Auction
                            </h2>
                            <p className="text-white/70 leading-relaxed mb-6">
                                Experience the thrill of a real cricket auction right from your browser.
                                Create a room with your friends, pick your favorite franchise, and bid on a pool of over 350+ real players.
                                Manage your purse limits, squad sizes, and outsmart your opponents to build the ultimate dream team.
                            </p>

                            <div className="pt-6 border-t border-white/10 mt-6 text-center lg:text-left">
                                <p className="text-white/40 text-sm flex flex-col sm:flex-row items-center gap-2 justify-center lg:justify-start">
                                    <span>Built with passion by</span>
                                    <span className="text-ipl-gold font-semibold text-lg drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                                        N. Abhay Kashyap
                                    </span>
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
