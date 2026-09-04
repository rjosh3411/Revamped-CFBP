import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LiveScoreboardRibbon } from './components/LiveScoreboardRibbon';
import { MakePicksView } from './components/MakePicksView';
import { BuddyComparison } from './components/BuddyComparison';
import { StandingsView } from './components/StandingsView';
import { PartyHub } from './components/PartyHub';
import { AuthModal } from './components/AuthModal';
import { 
  Trophy, CheckCircle2, AlertCircle, RefreshCw, 
  Flame, Sparkles, Shield, Users, ArrowRight, Zap 
} from 'lucide-react';

export function App() {
  const { user, refreshUser } = useAuth();

  // Navigation & Filtering (4 core tabs: 'picks', 'compare', 'standings', 'parties')
  const [activeTab, setActiveTab] = useState('picks');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [parties, setParties] = useState([]);
  const [selectedPartyCode, setSelectedPartyCode] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadParties();
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  async function loadParties() {
    if (!user) return;
    try {
      const data = await api.getMyParties();
      setParties(data.parties || []);
      if (data.parties && data.parties.length > 0 && !selectedPartyCode) {
        setSelectedPartyCode(data.parties[0].invite_code);
      }
    } catch (err) {
      console.error('Failed to load parties:', err);
    }
  }

  const handlePartyCreated = (newParty) => {
    setParties(prev => [newParty, ...prev]);
    setSelectedPartyCode(newParty.invite_code);
    showToast(`🎉 Prediction party "${newParty.name}" created! Code: ${newParty.invite_code}`);
  };

  const handlePartyJoined = (joinedParty) => {
    setParties(prev => [joinedParty, ...prev]);
    setSelectedPartyCode(joinedParty.invite_code);
    showToast(`🙌 Successfully joined ${joinedParty.name}!`);
  };

  const handlePartyLeft = (partyId) => {
    setParties(prev => {
      const remaining = prev.filter(p => p.id !== partyId);
      if (remaining.length > 0) {
        setSelectedPartyCode(remaining[0].invite_code);
      } else {
        setSelectedPartyCode('');
      }
      return remaining;
    });
    showToast('🚪 You have left the prediction party.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-[#faf6e8] font-sans pb-24 lg:pb-12 relative overflow-x-hidden">
      {/* Background Mascot Watermarks */}
      <div className="mascot-watermark mascot-watermark-left">
        <img src="https://a.espncdn.com/i/teamlogos/ncaa/500/61.png" alt="" className="w-full h-full object-contain opacity-20" />
      </div>
      <div className="mascot-watermark mascot-watermark-right">
        <img src="https://a.espncdn.com/i/teamlogos/ncaa/500/194.png" alt="" className="w-full h-full object-contain opacity-20" />
      </div>

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        parties={parties}
        selectedPartyCode={selectedPartyCode}
        onSelectPartyCode={(code) => setSelectedPartyCode(code)}
      />

      {/* Live Scoreboard Ribbon */}
      <LiveScoreboardRibbon
        onSelectGame={(g) => {
          setActiveTab('picks');
        }}
      />

      {/* Floating Notification Toast */}
      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center space-x-2 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 ${
          toast.type === 'error'
            ? 'bg-red-950/95 text-red-200 border-red-800'
            : 'bg-[#0e1218]/95 text-amber-400 border-amber-500/50 shadow-amber-500/10'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1 w-full relative z-10">
        {/* TAB 1: MAKE PICKS (Verified Team Schedules) */}
        {activeTab === 'picks' && (
          <MakePicksView />
        )}

        {/* TAB 2: BUD COMPARISON (Agreed vs Disagreed Pick Matrix) */}
        {activeTab === 'compare' && (
          <BuddyComparison
            parties={parties}
            currentWeek={currentWeek}
            currentYear={2026}
          />
        )}

        {/* TAB 3: STANDINGS & NATIONAL POLLS */}
        {activeTab === 'standings' && (
          <StandingsView />
        )}

        {/* TAB 4: PARTY HUB (Prediction Parties, Leaderboard, Trash Talk & Leave Party) */}
        {activeTab === 'parties' && (
          <PartyHub
            parties={parties}
            onPartyCreated={handlePartyCreated}
            onPartyJoined={handlePartyJoined}
            onPartyLeft={handlePartyLeft}
            onSelectPartyForComparison={() => setActiveTab('compare')}
          />
        )}
      </main>

      {/* Persistent Auth Modal */}
      <AuthModal />
    </div>
  );
}
