import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, Mail, User, ShieldCheck, Trophy, 
  X, Check, AlertCircle, Sparkles, Heart, ChevronDown 
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
  const { user, authModalOpen, authMode, closeAuth, login, register, openAuth } = useAuth();

  const [mode, setMode] = useState(authMode || 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('Georgia Bulldogs');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (authMode) setMode(authMode);
  }, [authMode]);

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
        {/* Close Button (only accessible if user is already logged in) */}
        {user && (
          <button
            onClick={closeAuth}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header with Flying Football & Easy Blue Square Badge */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 border border-sky-300/30 mb-3 overflow-visible">
            <span className="animate-football-flyin text-3xl select-none">🏈</span>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-wider font-display drop-shadow">
            {mode === 'login' ? "Pick'em" : "Pick'em Account"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Sign in to access your weekly picks and prediction parties.'
              : 'Create your account to lock in weekly predictions and save your stats forever.'}
          </p>

          {/* Guaranteed Persistence Badge */}
          <div className="mt-3 inline-flex items-center space-x-1.5 bg-sky-950/60 border border-sky-500/40 text-sky-300 text-[11px] font-semibold px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Permanent Cloud Storage • Never Loses Your Picks</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl mb-5 border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              mode === 'register'
                ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-slate-950 shadow-md font-black'
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
                className="w-full bg-slate-950 text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 focus:outline-none"
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
                      className="w-full bg-slate-950 text-white pl-8 pr-2 py-2.5 rounded-xl border border-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 focus:outline-none"
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
                    className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold text-xs uppercase tracking-wider mb-1.5">Favorite School / Team</label>
                <div className="relative group">
                  <Heart className="w-3.5 h-3.5 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 z-10" />
                  <select
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                    className="w-full appearance-none bg-slate-950 text-white pl-9 pr-9 py-2.5 rounded-xl border border-slate-800 hover:border-amber-400/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-medium transition cursor-pointer"
                  >
                    {POPULAR_TEAMS.map(team => (
                      <option key={team} value={team} className="bg-slate-900 text-white py-1">{team}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-80 group-hover:opacity-100 transition" />
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
                className="w-full bg-slate-950 text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Permanent Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
