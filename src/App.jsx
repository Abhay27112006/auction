import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import AuctionRoom from './pages/AuctionRoom';
import Teams from './pages/Teams';
import PlayerPool from './pages/PlayerPool';
import Leaderboard from './pages/Leaderboard';
import Navbar from './components/Navbar';

function App() {
    return (
        <AuctionProvider>
            <BrowserRouter>
                <div className="min-h-screen stadium-bg">
                    <Navbar />
                    <AnimatePresence mode="wait">
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/lobby" element={<Lobby />} />
                            <Route path="/auction" element={<AuctionRoom />} />
                            <Route path="/teams" element={<Teams />} />
                            <Route path="/players" element={<PlayerPool />} />
                            <Route path="/leaderboard" element={<Leaderboard />} />
                        </Routes>
                    </AnimatePresence>
                </div>
            </BrowserRouter>
        </AuctionProvider>
    );
}

export default App;
