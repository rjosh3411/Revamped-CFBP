import React, { useState } from 'react';
import confetti from 'canvas-confetti';

const STAGE_CONFIGS = {
  1: {
    img: '/evolution/stage_1_walk_on.jpg',
    name: 'Walk-On Rookie',
    level: 1,
    tagColor: 'text-[#86efac]',
    borderColor: 'border-[#86efac]/40',
    stars: 1,
    glow: 'shadow-emerald-500/10'
  },
  2: {
    img: '/evolution/stage_2_varsity_starter.jpg',
    name: 'Varsity Starter',
    level: 5,
    tagColor: 'text-[#4ade80]',
    borderColor: 'border-[#4ade80]/40',
    stars: 2,
    glow: 'shadow-green-500/15'
  },
  3: {
    img: '/evolution/stage_3_all_conference.jpg',
    name: 'All-Conference',
    level: 10,
    tagColor: 'text-[#60a5fa]',
    borderColor: 'border-[#60a5fa]/50',
    stars: 3,
    glow: 'shadow-blue-500/20'
  },
  4: {
    img: '/evolution/stage_4_all_american.jpg',
    name: 'All-American',
    level: 20,
    tagColor: 'text-[#c084fc]',
    borderColor: 'border-[#c084fc]/50',
    stars: 4,
    glow: 'shadow-purple-500/20'
  },
  5: {
    img: '/evolution/stage_5_heisman_contender.jpg',
    name: 'Heisman Contender',
    level: 35,
    tagColor: 'text-[#fbbf24]',
    borderColor: 'border-[#fbbf24]/60',
    stars: 5,
    glow: 'shadow-amber-500/30'
  },
  6: {
    img: '/evolution/stage_6_goat_hall_of_fame.jpg',
    name: 'GOAT / Hall of Famer',
    level: 50,
    tagColor: 'text-[#fde047]',
    borderColor: 'border-[#fde047] ring-2 ring-[#fde047]/60',
    stars: 5,
    isGoat: true,
    glow: 'shadow-amber-500/50'
  }
};

const HYPE_QUOTES = [
  "Locked in for Saturday! 🏈",
  "Unstoppable! Feed me the ball! 🔥",
  "Saturdays are for the Dawgs! 🐾",
  "Heisman season loading... 🏆",
  "Put me in Coach, I got this! 💥",
  "100% on the board! Let's go! ⚡",
  "No fly zone out here! 🚫",
  "Game day ready! Who's next?! 😤"
];

export function CartoonPlayerAvatar({
  level = 1,
  correctPicks = 0,
  favoriteTeam = 'Georgia Bulldogs',
  displayName = 'Player',
  jerseyNumber = '7',
  previewStage = null,
  onPoseChange
}) {
  const [speechBubble, setSpeechBubble] = useState(null);
  const [isFlexing, setIsFlexing] = useState(false);

  // Determine stage based on level or preview
  let stageNumber = 1;
  if (previewStage) {
    stageNumber = previewStage;
  } else if (level >= 50) {
    stageNumber = 6;
  } else if (level >= 35) {
    stageNumber = 5;
  } else if (level >= 20) {
    stageNumber = 4;
  } else if (level >= 10) {
    stageNumber = 3;
  } else if (level >= 5) {
    stageNumber = 2;
  }

  const stage = STAGE_CONFIGS[stageNumber] || STAGE_CONFIGS[1];

  const handleAvatarClick = () => {
    setIsFlexing(true);
    const quote = HYPE_QUOTES[Math.floor(Math.random() * HYPE_QUOTES.length)];
    setSpeechBubble(quote);

    try {
      confetti({
        particleCount: 35,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#86efac', '#60a5fa']
      });
    } catch (e) {}

    setTimeout(() => {
      setIsFlexing(false);
    }, 2500);

    setTimeout(() => {
      setSpeechBubble(null);
    }, 3500);
  };

  return (
    <div className="relative flex flex-col items-center select-none cursor-pointer group" onClick={handleAvatarClick}>
      {/* Speech Bubble */}
      {speechBubble && (
        <div className="absolute -top-12 z-30 bg-[#faf6e8] text-black font-extrabold px-4 py-2 rounded-2xl text-xs shadow-2xl animate-in zoom-in-95 duration-150 border-2 border-black max-w-xs text-center font-sans">
          <span>{speechBubble}</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#faf6e8]"></div>
        </div>
      )}

      {/* Fiery Glowing Aura for Stage 6 / Stage 5 */}
      {stageNumber >= 5 && (
        <div className="absolute inset-0 -top-4 rounded-3xl bg-gradient-to-t from-amber-500/25 via-orange-500/15 to-transparent filter blur-xl animate-pulse pointer-events-none"></div>
      )}

      {/* Main Cropped Card Visual */}
      <div 
        className={`w-56 sm:w-64 rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl relative ${stage.borderColor} ${stage.glow} ${
          isFlexing ? 'scale-105 ring-4 ring-amber-400/60' : 'group-hover:scale-102'
        }`}
      >
        <img
          src={stage.img}
          alt={stage.name}
          className="w-full h-auto object-cover block"
        />

        {/* Dynamic User Customization Overlay Badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-center shadow-lg">
          <div className="text-[9px] uppercase font-bold text-[#9a978a] leading-none">NO.</div>
          <div className="text-sm font-black text-amber-400 font-mono leading-tight">
            #{jerseyNumber || '7'}
          </div>
        </div>

        {/* Favorite Team Pill Overlay */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 flex items-center justify-between text-[11px] font-bold shadow-lg">
          <span className="text-white truncate font-sans">{displayName}</span>
          <span className="text-amber-400 font-mono text-[10px]">LVL {level}</span>
        </div>
      </div>

      {/* Tap Instruction */}
      <p className="text-[10px] text-[#9a978a] mt-3 font-medium group-hover:text-amber-400 transition flex items-center space-x-1">
        <span>👆 Tap to flex & celebrate!</span>
      </p>
    </div>
  );
}
