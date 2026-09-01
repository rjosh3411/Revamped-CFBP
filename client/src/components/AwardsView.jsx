import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, Award, Crown, Star, CheckCircle2, 
  Sparkles, Shield, User, ChevronRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export function AwardsView({ parties }) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [cfpChampion, setCfpChampion] = useState('Georgia');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAwards();
  }, []);

  async function loadAwards() {
    setLoading(true);
    try {
      const data = await api.getHeisman();
      setCandidates(data?.candidates || []);
      if (data?.myPick?.heisman_winner_id) {
        setSelectedCandidateId(data.myPick.heisman_winner_id);
      }
      if (data?.myPick?.cfp_champion_name) {
        setCfpChampion(data.myPick.cfp_champion_name);
      }
    } catch (err) {
      console.error('Failed to load awards:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectHeisman = async (candidate) => {
    setSelectedCandidateId(candidate.id);
    setSaving(true);
    try {
      await api.saveHeismanPick({
        seasonYear: 2026,
        heismanWinnerId: candidate.id,
        cfpChampionName: cfpChampion
      });
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#faf6e8', '#86efac']
        });
      } catch (e) {}
    } catch (err) {
      console.error('Failed to save Heisman pick:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectChampion = async (champ) => {
    setCfpChampion(champ);
    try {
      await api.saveHeismanPick({
        seasonYear: 2026,
        heismanWinnerId: selectedCandidateId,
        cfpChampionName: champ
      });
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Trophy className="w-4 h-4" />
          <span>2026 Season Postseason & Trophy Picks</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#faf6e8] athletic-title uppercase tracking-wide">
          Heisman & CFP Predictions
        </h1>
        <p className="text-xs text-[#dcd8c8] max-w-xl">
          Lock in your predictions for the 2026 Heisman Trophy winner and College Football Playoff National Champion.
        </p>
      </div>

      {/* Heisman Trophy Candidates Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-extrabold text-white uppercase athletic-title">
              2026 Heisman Trophy Candidates
            </h2>
          </div>
          {selectedCandidateId && (
            <div className="text-xs text-[#86efac] font-bold flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>Prediction Saved</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#9a978a]">
            <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            Loading Heisman candidates...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {candidates.map((c) => {
              const isSelected = selectedCandidateId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectHeisman(c)}
                  className={`cursor-pointer bg-[#0e1218] rounded-2xl p-4 border transition-all duration-200 shadow-xl relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 bg-[#141b24] scale-102 shadow-amber-500/10'
                      : 'border-white/5 hover:border-white/20 hover:bg-[#12161f]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <img
                      src={c.logoUrl}
                      alt={c.school}
                      className="w-12 h-12 object-contain drop-shadow"
                    />

                    {isSelected ? (
                      <span className="text-[10px] bg-amber-500 text-black font-black px-2 py-0.5 rounded-full shadow">
                        YOUR PICK 🏆
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#9a978a] bg-black/60 px-2 py-0.5 rounded-full border border-white/5 font-mono">
                        {c.position}
                      </span>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="text-base font-extrabold text-white athletic-title leading-tight">
                      {c.name}
                    </div>
                    <div className="text-xs text-[#dcd8c8] font-semibold mt-0.5">
                      {c.school} • {c.position}
                    </div>
                  </div>

                  <button
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-black uppercase transition ${
                      isSelected
                        ? 'bg-amber-500 text-black'
                        : 'bg-black/60 text-[#faf6e8] border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {isSelected ? '✓ Picked for Heisman' : 'Pick as Winner'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CFP National Champion Selector */}
      <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Crown className="w-4 h-4" />
          <span>12-Team Playoff</span>
        </div>
        <h2 className="text-xl font-extrabold text-white athletic-title uppercase mb-4">
          Predicted National Champion
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { name: 'Ohio State', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
            { name: 'Oregon', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png' },
            { name: 'Georgia', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png' },
            { name: 'Notre Dame', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png' },
            { name: 'Texas', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png' },
            { name: 'Alabama', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png' }
          ].map(team => {
            const isChamp = cfpChampion === team.name;
            return (
              <button
                key={team.name}
                onClick={() => handleSelectChampion(team.name)}
                className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-between ${
                  isChamp
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/40 text-white font-bold'
                    : 'bg-black/60 border-white/10 hover:border-white/20 text-[#dcd8c8]'
                }`}
              >
                <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain mb-2" />
                <span className="text-xs font-bold">{team.name}</span>
                {isChamp && (
                  <span className="text-[9px] text-amber-400 font-extrabold mt-1">
                    👑 TITLE PICK
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
