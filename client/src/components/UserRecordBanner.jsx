import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Flame, Target, Star, TrendingUp, Shield, Sparkles, RefreshCw } from 'lucide-react';

export function UserRecordBanner({ onWeekSelect, activeWeek = 1, refreshTrigger = 0 }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, refreshTrigger]);

  async function loadStats() {
    try {
      const res = await api.getMyStats({ year: 2026 });
      if (res && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load user stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const pending = stats?.pending || 0;
  const winPct = stats?.winPercentage || 0;
  const totalPoints = stats?.totalPoints || user?.total_points || 0;
  const currentStreak = stats?.currentStreak !== undefined ? stats.currentStreak : (user?.current_streak || 0);
  const bestStreak = stats?.bestStreak !== undefined ? stats.bestStreak : (user?.best_streak || 0);
  const lockAccuracy = stats?.lockStats?.accuracy;
  const lockCorrect = stats?.lockStats?.correct || 0;
  const lockTotal = stats?.lockStats?.total || 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c1017]/90 via-[#111622]/90 to-[#0c1017]/90 border border-white/10 p-4 sm:p-5 shadow-2xl backdrop-blur-xl group">
        {/* Glow ambient background accents */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left Title & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-2xl sm:text-3xl shadow-lg shadow-amber-500/10 font-black text-amber-300">
                🏈
              </div>
              {currentStreak >= 3 && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black ring-2 ring-black animate-pulse">
                  🔥
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  2026 Season Performance
                </span>
                <span className="text-xs text-white/40 hidden sm:inline">|</span>
                <span className="text-xs font-semibold text-white/60 hidden sm:inline">
                  {user.display_name || user.username} (#{user.jersey_number || '7'})
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2 mt-0.5">
                <span>My Official Pick Record</span>
              </h2>
            </div>
          </div>

          {/* Right Athletic Stat Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1 lg:max-w-2xl">
            {/* 1. Overall W-L Record */}
            <div className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-400/40 rounded-xl p-2.5 sm:p-3 transition shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/60 mb-1">
                <span className="flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>RECORD</span>
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                  winPct >= 65 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/70'
                }`}>
                  {winPct}%
                </span>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xl sm:text-2xl font-black text-[#faf6e8] tracking-tight">
                  {wins}-{losses}
                </span>
                {pending > 0 && (
                  <span className="text-[11px] text-white/40 font-medium">
                    ({pending} pending)
                  </span>
                )}
              </div>
            </div>

            {/* 2. Total Confidence Points */}
            <div className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-400/40 rounded-xl p-2.5 sm:p-3 transition shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/60 mb-1">
                <span className="flex items-center space-x-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>TOTAL PTS</span>
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                  CONFIDENCE
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl sm:text-2xl font-black text-amber-300 tracking-tight">
                  {totalPoints}
                </span>
                <span className="text-[10px] text-amber-400/60 font-bold uppercase">
                  PTS
                </span>
              </div>
            </div>

            {/* 3. Active & Best Streak */}
            <div className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-400/40 rounded-xl p-2.5 sm:p-3 transition shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/60 mb-1">
                <span className="flex items-center space-x-1">
                  <Flame className={`w-3.5 h-3.5 ${currentStreak > 0 ? 'text-orange-400 fill-orange-400 animate-bounce' : 'text-white/40'}`} />
                  <span>WIN STREAK</span>
                </span>
                <span className="text-[10px] font-medium text-white/40">
                  BEST: {bestStreak}
                </span>
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                  currentStreak > 0 ? 'text-orange-400' : 'text-white/60'
                }`}>
                  {currentStreak}
                </span>
                <span className="text-[11px] text-white/40 font-medium">
                  {currentStreak === 1 ? 'game' : 'games'}
                </span>
              </div>
            </div>

            {/* 4. 3-Star Lock Accuracy */}
            <div className="bg-black/40 hover:bg-black/60 border border-white/10 hover:border-amber-400/40 rounded-xl p-2.5 sm:p-3 transition shadow-inner">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/60 mb-1">
                <span className="flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>3★ LOCKS</span>
                </span>
                <span className="text-[10px] font-bold text-amber-400/80">
                  {lockTotal > 0 ? `${lockCorrect}/${lockTotal}` : 'LOCKS'}
                </span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                  lockAccuracy !== null ? 'text-emerald-400' : 'text-white/40'
                }`}>
                  {lockAccuracy !== null ? `${lockAccuracy}%` : '—'}
                </span>
                <span className="text-[10px] text-white/40 font-medium">
                  {lockAccuracy !== null ? 'ACCURACY' : 'NO LOCKS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
