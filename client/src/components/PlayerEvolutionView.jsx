import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Interactive3DPlayer } from './Interactive3DPlayer';
import { 
  Zap, Trophy, Flame, Shield, Award, Sparkles, 
  Crown, Star, CheckCircle2, Lock, Edit3, Shirt, RefreshCw, ChevronRight, Check, ChevronDown 
} from 'lucide-react';
import confetti from 'canvas-confetti';

const EVOLUTION_STAGES = [
  {
    stage: 1,
    levelReq: 1,
    name: 'WALK-ON ROOKIE',
    levelLabel: 'LVL 1',
    headerColor: 'text-[#86efac]',
    tagBg: 'bg-[#86efac]/10',
    borderColor: 'border-[#86efac]/30',
    checkColor: 'text-[#86efac]',
    arrowColor: 'text-[#86efac]',
    img: '/evolution/stage_1_walk_on_hd.jpg',
    stars: 1,
    checklist: [
      'Scrawny build',
      'Basic practice jersey',
      'Plain helmet'
    ]
  },
  {
    stage: 2,
    levelReq: 5,
    name: 'VARSITY STARTER',
    levelLabel: 'LVL 5',
    headerColor: 'text-[#4ade80]',
    tagBg: 'bg-[#4ade80]/10',
    borderColor: 'border-[#4ade80]/30',
    checkColor: 'text-[#4ade80]',
    arrowColor: 'text-[#60a5fa]',
    img: '/evolution/stage_2_varsity_starter_hd.jpg',
    stars: 2,
    checklist: [
      'Athletic frame',
      'Shoulder pads',
      'Team gloves',
      'Eye black war paint'
    ]
  },
  {
    stage: 3,
    levelReq: 10,
    name: 'ALL-CONFERENCE',
    levelLabel: 'LVL 10',
    headerColor: 'text-[#60a5fa]',
    tagBg: 'bg-[#60a5fa]/10',
    borderColor: 'border-[#60a5fa]/30',
    checkColor: 'text-[#60a5fa]',
    arrowColor: 'text-[#c084fc]',
    img: '/evolution/stage_3_all_conference_hd.jpg',
    stars: 3,
    checklist: [
      'Muscular build',
      'Dark tinted visor',
      'White turf tape on arms'
    ]
  },
  {
    stage: 4,
    levelReq: 20,
    name: 'ALL-AMERICAN',
    levelLabel: 'LVL 20',
    headerColor: 'text-[#c084fc]',
    tagBg: 'bg-[#c084fc]/10',
    borderColor: 'border-[#c084fc]/30',
    checkColor: 'text-[#c084fc]',
    arrowColor: 'text-[#fbbf24]',
    img: '/evolution/stage_4_all_american_hd.jpg',
    stars: 4,
    checklist: [
      'Buff powerhouse',
      'Gold cleats',
      'Bicep bands',
      'Helmet pride stickers'
    ]
  },
  {
    stage: 5,
    levelReq: 35,
    name: 'HEISMAN CONTENDER',
    levelLabel: 'LVL 35',
    headerColor: 'text-[#fbbf24]',
    tagBg: 'bg-[#fbbf24]/10',
    borderColor: 'border-[#fbbf24]/30',
    checkColor: 'text-[#fbbf24]',
    arrowColor: 'text-[#fde047]',
    img: '/evolution/stage_5_heisman_contender_hd.jpg',
    stars: 5,
    checklist: [
      'Massive build',
      'Golden arm sleeve',
      'Heisman medallion badge'
    ]
  },
  {
    stage: 6,
    levelReq: 50,
    name: 'GOAT / HALL OF FAMER',
    levelLabel: 'LVL 50+',
    headerColor: 'text-[#fde047]',
    tagBg: 'bg-[#fde047]/10',
    borderColor: 'border-[#fde047] ring-1 ring-[#fde047]/50 shadow-amber-500/20',
    checkColor: 'text-[#fde047]',
    img: '/evolution/stage_6_goat_hall_of_fame_hd.jpg',
    stars: 5,
    isGoat: true,
    checklist: [
      'Titan build',
      'Diamond championship ring',
      'Golden crown',
      'Glowing fiery aura!'
    ]
  }
];

const TEAMS_LIST = [
  'Georgia Bulldogs', 'Alabama Crimson Tide', 'Ohio State Buckeyes', 'Texas Longhorns',
  'Michigan Wolverines', 'Oregon Ducks', 'LSU Tigers', 'Tennessee Volunteers',
  'Notre Dame Fighting Irish', 'Clemson Tigers', 'Florida Gators', 'Penn State Nittany Lions',
  'Florida State Seminoles', 'USC Trojans', 'Oklahoma Sooners', 'Colorado Buffaloes'
];

export function PlayerEvolutionView() {
  const { user, updateProfile } = useAuth();

  const [selectedStagePreview, setSelectedStagePreview] = useState(null);
  const [activePose, setActivePose] = useState('idle');
  const [jerseyNum, setJerseyNum] = useState(user?.jersey_number || '48');
  const [favoriteSchool, setFavoriteSchool] = useState(user?.favorite_team || 'Georgia Bulldogs');
  const [isSaving, setIsSaving] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user?.jersey_number) setJerseyNum(user.jersey_number);
    if (user?.favorite_team) setFavoriteSchool(user.favorite_team);
  }, [user]);

  // Calculate Level and XP based on correct picks
  const correctPicks = user?.correct_picks || 0;
  const currentLevel = Math.max(1, Math.floor(correctPicks / 2) + 1);
  const currentXP = correctPicks * 100;
  const xpProgress = Math.min(100, Math.round(((currentXP % 200) / 200) * 100));

  // Determine current active stage number
  let activeStageNumber = 1;
  if (currentLevel >= 50) activeStageNumber = 6;
  else if (currentLevel >= 35) activeStageNumber = 5;
  else if (currentLevel >= 20) activeStageNumber = 4;
  else if (currentLevel >= 10) activeStageNumber = 3;
  else if (currentLevel >= 5) activeStageNumber = 2;

  const activeStage = EVOLUTION_STAGES.find(s => s.stage === activeStageNumber) || EVOLUTION_STAGES[0];
  const inspectedStage = selectedStagePreview ? EVOLUTION_STAGES.find(s => s.stage === selectedStagePreview) : activeStage;

  const handleSaveCustomization = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        jerseyNumber: jerseyNum.trim(),
        favoriteTeam: favoriteSchool
      });
      setCustomizerOpen(false);
      try {
        confetti({ particleCount: 35, spread: 70, origin: { y: 0.6 } });
      } catch (err) {}
    } catch (err) {
      console.error('Failed to update player gear:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerPose = (poseName) => {
    setActivePose(poseName);
    if (poseName === 'celebrate') {
      try {
        confetti({
          particleCount: 55,
          spread: 85,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#86efac', '#60a5fa', '#c084fc']
        });
      } catch (e) {}
    }
    setTimeout(() => setActivePose('idle'), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4 fill-amber-400" />
              <span>3D Parallax Pick'em Avatar & Progression</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#faf6e8] athletic-title uppercase tracking-wide">
              Player Evolution HQ
            </h1>
            <p className="text-xs text-[#dcd8c8] max-w-2xl mt-0.5">
              Every correct college football prediction earns you <span className="text-amber-400 font-bold">+100 XP</span>. Level up to bulk your player's muscles, upgrade uniforms, and unlock legendary collegiate gear!
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setCustomizerOpen(!customizerOpen)}
              className="flex items-center space-x-2 bg-black/60 hover:bg-black text-[#faf6e8] px-4 py-2.5 rounded-2xl text-xs font-bold border border-white/10 shadow transition"
            >
              <Shirt className="w-4 h-4 text-amber-400" />
              <span>{customizerOpen ? 'Close Locker' : 'Customize Locker'}</span>
            </button>
          </div>
        </div>

        {/* Locker Customizer Drawer */}
        {customizerOpen && (
          <form onSubmit={handleSaveCustomization} className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in slide-in-from-top-2">
            <div>
              <label className="block text-[#9a978a] font-bold uppercase text-[10px] mb-1">Jersey Number</label>
              <input
                type="text"
                maxLength={2}
                value={jerseyNum}
                onChange={(e) => setJerseyNum(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="48"
                className="w-full bg-black text-white px-3 py-2 rounded-xl border border-white/10 focus:border-amber-400 focus:outline-none font-mono font-bold text-center text-sm"
              />
            </div>

            <div>
              <label className="block text-[#9a978a] font-bold uppercase text-[10px] mb-1">Favorite School</label>
              <div className="relative group">
                <select
                  value={favoriteSchool}
                  onChange={(e) => setFavoriteSchool(e.target.value)}
                  className="w-full appearance-none bg-black text-white text-xs pl-3 pr-8 py-2 rounded-xl border border-white/10 hover:border-amber-400/50 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none font-bold transition cursor-pointer"
                >
                  {TEAMS_LIST.map(t => (
                    <option key={t} value={t} className="bg-[#0e1218]">{t}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-80 group-hover:opacity-100 transition" />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase rounded-xl transition"
              >
                {isSaving ? 'Saving...' : 'Save Gear'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Main Focus Center: 3D Parallax Interactive Player & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: 3D Parallax Character Stage */}
        <div className="lg:col-span-6 bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between relative overflow-hidden">
          <div className="text-center mb-2">
            <span className="text-[10px] font-black uppercase text-amber-400 font-mono tracking-wider">
              INTERACTIVE 3D PARALLAX STAGE
            </span>
            <h3 className="text-xl font-black text-white athletic-title uppercase">
              {inspectedStage.name}
            </h3>
          </div>

          {/* 3D Parallax Athletic Character with Dynamic Poses & Customization */}
          <Interactive3DPlayer
            level={currentLevel}
            correctPicks={correctPicks}
            favoriteTeam={favoriteSchool}
            displayName={user?.display_name || 'Coach Reed'}
            jerseyNumber={jerseyNum}
            previewStage={selectedStagePreview}
            activePose={activePose}
            onPoseChange={(p) => setActivePose(p)}
          />

          {/* Pose Action Buttons */}
          <div className="mt-4 w-full grid grid-cols-3 gap-2">
            <button
              onClick={() => triggerPose('flex')}
              className={`py-2.5 px-2 border rounded-xl text-[11px] font-black uppercase tracking-wider transition flex flex-col items-center justify-center space-y-1 shadow ${
                activePose === 'flex'
                  ? 'bg-amber-500 text-black border-amber-400 font-black scale-105'
                  : 'bg-black/60 hover:bg-[#151b24] text-[#faf6e8] border-white/10 hover:border-amber-400/50'
              }`}
            >
              <span>💪</span>
              <span>Muscle Flex</span>
            </button>

            <button
              onClick={() => triggerPose('heisman')}
              className={`py-2.5 px-2 border rounded-xl text-[11px] font-black uppercase tracking-wider transition flex flex-col items-center justify-center space-y-1 shadow ${
                activePose === 'heisman'
                  ? 'bg-amber-500 text-black border-amber-400 font-black scale-105'
                  : 'bg-black/60 hover:bg-[#151b24] text-[#faf6e8] border-white/10 hover:border-amber-400/50'
              }`}
            >
              <span>🏆</span>
              <span>Heisman Pose</span>
            </button>

            <button
              onClick={() => triggerPose('celebrate')}
              className={`py-2.5 px-2 border rounded-xl text-[11px] font-black uppercase tracking-wider transition flex flex-col items-center justify-center space-y-1 shadow ${
                activePose === 'celebrate'
                  ? 'bg-amber-500 text-black border-amber-400 font-black scale-105'
                  : 'bg-black/60 hover:bg-[#151b24] text-[#faf6e8] border-white/10 hover:border-amber-400/50'
              }`}
            >
              <span>🎉</span>
              <span>Celebrate</span>
            </button>
          </div>
        </div>

        {/* Right 6 Cols: Level, XP Bar & Tier Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          {/* Level & XP Card */}
          <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#9a978a] tracking-wider font-mono">
                  LEVELING & XP PROGRESSION
                </span>
                <div className="text-3xl font-black text-white font-mono flex items-center space-x-2">
                  <span className="text-amber-400">LVL {currentLevel}</span>
                  <span className="text-xs text-[#9a978a] font-sans font-bold">
                    ({currentXP.toLocaleString()} Total XP)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-[#86efac] font-mono">
                  +{correctPicks * 100} XP Earned
                </span>
                <div className="text-[10px] text-[#9a978a]">
                  +100 XP per correct pick
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-[#dcd8c8] font-mono">
                <span>Progress to Level {currentLevel + 1}</span>
                <span>{xpProgress}% ({200 - (currentXP % 200)} XP needed)</span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-3.5 p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-md shadow-amber-500/20"
                  style={{ width: `${Math.max(5, xpProgress)}%` }}
                ></div>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
              <div className="bg-black/60 p-3 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] font-bold uppercase text-[#9a978a]">Correct Picks</div>
                <div className="text-xl font-black text-[#86efac] font-mono mt-0.5">{correctPicks}</div>
              </div>

              <div className="bg-black/60 p-3 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] font-bold uppercase text-[#9a978a]">Total Points</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{user?.total_points || 0}</div>
              </div>

              <div className="bg-black/60 p-3 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] font-bold uppercase text-[#9a978a]">Win Streak</div>
                <div className="text-xl font-black text-orange-400 font-mono mt-0.5 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-orange-400 mr-1" />
                  {user?.current_streak || 0}W
                </div>
              </div>

              <div className="bg-black/60 p-3 rounded-2xl border border-white/5 text-center">
                <div className="text-[10px] font-bold uppercase text-[#9a978a]">Win %</div>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  {user?.total_picks > 0 ? Math.round((user.correct_picks / user.total_picks) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Inspected Stage Gear Details */}
          <div className="bg-[#0e1218] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-white athletic-title uppercase flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Tier Gear & Perks Breakdown</span>
              </h3>
              <span className={`text-xs font-black font-mono ${inspectedStage.headerColor}`}>
                {inspectedStage.name} ({inspectedStage.levelLabel})
              </span>
            </div>

            <div className="space-y-2">
              {inspectedStage.checklist.map((c, i) => (
                <div key={i} className="flex items-center space-x-2.5 p-2.5 bg-black/40 rounded-xl border border-white/5">
                  <CheckCircle2 className={`w-4 h-4 ${inspectedStage.checkColor} flex-shrink-0`} />
                  <span className="text-xs text-white font-bold">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
