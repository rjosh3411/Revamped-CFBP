import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, Mail, User, ShieldCheck, Trophy, 
  X, Check, AlertCircle, Sparkles, Heart 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const POPULAR_TEAMS = [
  'Georgia Bulldogs',
  'Ohio State Buckeyes',
  'Alabama Crimson Tide',
  'Texas Longhorns',
  'Notre Dame Fighting Irish',
  'Oregon Ducks',
  'Penn State Nittany Lions',
  'Michigan Wolverines',
  'LSU Tigers',
  'Clemson Tigers',
  'Miami Hurricanes',
  'Florida State Seminoles',
  'Tennessee Volunteers',
  'USC Trojans',
  'Oklahoma Sooners',
  'Colorado Buffaloes',
  'Texas A&M Aggies',
  'Ole Miss Rebels',
  'Boise State Broncos',
  'Memphis Tigers'
];

export function AuthModal() {
  const { authModalOpen, authMode, closeAuth, login, register, openAuth } = useAuth();

  const [mode, setMode] = useState(authMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('Georgia Bulldogs');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          username: username || email.split('@')[0],
          displayName: displayName || username || email.split('@')[0],
          favoriteTeam
        });
      }
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeAuth}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Football Glow */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20 mb-3">
            🏈
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wide font-display">
            {mode === 'login' ? 'Welcome Back!' : 'Join CFB Prediction Party'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Sign in to access your weekly picks and prediction parties.'
              : 'Create your account to lock in weekly predictions and save your stats forever.'}
          </p>

          {/* Guaranteed Persistence Badge */}
          <div className="mt-3 inline-flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Permanent Cloud Storage • Never Loses Your Picks</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-300 font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="coach@football.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="GridironKing"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 text-white pl-8 pr-2 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                    />
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Display Name</label>
                  <input
                    type="text"
                    placeholder="Coach Steve"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Favorite School / Team</label>
                <div className="relative">
                  <select
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                    className="w-full bg-slate-950 text-white pl-8 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none font-medium"
                  >
                    {POPULAR_TEAMS.map(team => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                  <Heart className="w-3.5 h-3.5 text-rose-500 absolute left-2.5 top-3" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-slate-300 font-bold mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-amber-400 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Permanent Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
