import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';
import { Trophy, Users, LayoutGrid, Award, Home } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();
    const { roomCode, phase, connected } = useAuction();

    if (location.pathname === '/') return null;

    const links = [
        { path: '/lobby', icon: Home, label: 'Lobby', show: phase === 'lobby' },
        { path: '/auction', icon: Award, label: 'Auction', show: phase === 'auction' || phase === 'completed' },
        { path: '/teams', icon: Users, label: 'Teams', show: phase !== 'home' },
        { path: '/players', icon: LayoutGrid, label: 'Players', show: phase !== 'home' },
        { path: '/leaderboard', icon: Trophy, label: 'Board', show: phase !== 'home' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ipl-gold to-yellow-600 flex items-center justify-center">
                            <Trophy size={16} className="text-ipl-dark" />
                        </div>
                        <span className="font-display text-sm font-bold gradient-text hidden sm:block">
                            ICL 2026
                        </span>
                    </Link>
                    {roomCode && (
                        <div className="glass px-3 py-1 rounded-lg text-xs font-mono text-ipl-gold" style={{ borderRadius: '8px' }}>
                            Room: {roomCode}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {links.filter(l => l.show).map(({ path, icon: Icon, label }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === path
                                ? 'bg-ipl-gold/20 text-ipl-gold border border-ipl-gold/30'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={16} />
                            <span className="hidden sm:inline">{label}</span>
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs text-white/40">{connected ? 'Live' : 'Offline'}</span>
                </div>
            </div>
        </nav>
    );
}
