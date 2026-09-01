import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, Users, Flame, RefreshCw, LogIn, UserPlus, 
  ChevronDown, Shield, Sparkles, CheckCircle2, Award, Calendar 
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, onSync, isSyncing, parties, selectedPartyCode, onSelectPartyCode }) {
  const { user, openAuth, logout, switchDemo, demoUsers } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'picks', label: 'Make Picks', icon: Trophy },
    { id: 'compare', label: 'Bud Comparison', icon: Users },
    { id: 'standings', label: 'Standings & Polls', icon: Award },
    { id: 'parties', label: 'Party Hub', icon: Sparkles }
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#090c10]/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Party Selector */}
            <div className="flex items-center space-x-3">
              <div 
                className="flex items-center space-x-2.5 cursor-pointer"
                onClick={() => setActiveTab('picks')}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
                  🏈
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl text-[#faf6e8] script-title leading-tight m-0">
                    CFB Predictions
                  </h1>
                </div>
              </div>

              {/* Active Party Pill / Selector */}
              {parties && parties.length > 0 && (
                <div className="hidden sm:flex items-center ml-2">
                  <select
                    value={selectedPartyCode || parties[0]?.invite_code}
                    onChange={(e) => onSelectPartyCode && onSelectPartyCode(e.target.value)}
                    className="bg-black/60 text-[#faf6e8] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {parties.map(p => (
                      <option key={p.id} value={p.invite_code} className="bg-[#0e1218] text-white">
                        🎉 PARTY: {p.invite_code} ({p.name.slice(0, 16)}...)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center space-x-1 bg-black/60 p-1 rounded-2xl border border-white/10">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase transition ${
                      isActive
                        ? 'bg-[#faf6e8] text-black shadow-md font-black'
                        : 'text-[#dcd8c8] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-amber-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Action buttons */}
            <div className="flex items-center space-x-2.5">
              {/* ESPN Live Sync Button */}
              <button
                onClick={onSync}
                disabled={isSyncing}
                title="Sync live scores, rankings & auto-grade picks from ESPN"
                className="flex items-center space-x-1.5 bg-black/60 hover:bg-black text-[#dcd8c8] px-3 py-1.5 rounded-xl text-xs font-bold border border-white/10 shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync ESPN'}</span>
              </button>

              {/* User Profile / Quick Switcher */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 bg-[#0e1218] hover:bg-[#151b24] p-1.5 pr-2.5 rounded-full border border-white/10 shadow transition"
                  >
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.display_name} 
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-400/80"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                        {user.display_name.charAt(0)}
                      </div>
                    )}

                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-white truncate max-w-[100px]">
                        {user.display_name}
                      </div>
                      <div className="text-[10px] text-amber-400 font-bold">
                        {user.total_points || 0} pts
                      </div>
                    </div>

                    <ChevronDown className="w-3 h-3 text-[#9a978a]" />
                  </button>

                  {profileDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-[#0e1218] border border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in duration-150"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="pb-3 border-b border-white/10">
                        <div className="font-bold text-sm text-white">{user.display_name}</div>
                        <div className="text-xs text-[#9a978a]">{user.email}</div>
                        <div className="mt-1 text-xs text-amber-400">
                          Favorite: <span className="text-white">{user.favorite_team}</span>
                        </div>
                      </div>


                      <div className="pt-2 flex flex-col space-y-1">
                        <button
                          onClick={() => openAuth('register')}
                          className="w-full text-left px-2 py-1 text-xs text-slate-300 font-bold hover:underline"
                        >
                          + Create New Account
                        </button>
                        <button
                          onClick={logout}
                          className="w-full text-left px-2 py-1 text-xs text-red-400 hover:bg-red-950/30 rounded-lg transition"
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openAuth('login')}
                    className="text-xs font-bold text-[#faf6e8] px-3 py-1.5 rounded-xl border border-white/10"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar (Mobile / Compact View) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090c10]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around py-2 px-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-1.5 rounded-xl text-[9px] font-extrabold uppercase tracking-wider transition ${
                isActive ? 'text-amber-400 font-black scale-105' : 'text-[#9a978a] hover:text-[#faf6e8]'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
