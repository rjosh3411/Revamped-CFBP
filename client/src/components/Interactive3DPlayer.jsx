import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';

const TEAM_CONFIGS = {
  'georgia': { name: 'Georgia Bulldogs', primary: '#ba0c2f', secondary: '#000000', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png' },
  'alabama': { name: 'Alabama Crimson Tide', primary: '#9e1b32', secondary: '#ffffff', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png' },
  'ohio state': { name: 'Ohio State Buckeyes', primary: '#bb0000', secondary: '#666666', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png' },
  'texas': { name: 'Texas Longhorns', primary: '#bf5700', secondary: '#ffffff', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png' },
  'michigan': { name: 'Michigan Wolverines', primary: '#00274c', secondary: '#ffcb05', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png' },
  'oregon': { name: 'Oregon Ducks', primary: '#154734', secondary: '#fee123', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png' },
  'lsu': { name: 'LSU Tigers', primary: '#461d7c', secondary: '#fdd023', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/99.png' },
  'tennessee': { name: 'Tennessee Volunteers', primary: '#ff8200', secondary: '#ffffff', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png' },
  'notre dame': { name: 'Notre Dame Fighting Irish', primary: '#0c2340', secondary: '#c99700', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/87.png' },
  'clemson': { name: 'Clemson Tigers', primary: '#f56600', secondary: '#522d80', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png' },
  'florida': { name: 'Florida Gators', primary: '#0021a5', secondary: '#fa4616', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/57.png' },
  'penn state': { name: 'Penn State Nittany Lions', primary: '#041e42', secondary: '#ffffff', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/213.png' },
  'florida state': { name: 'Florida State Seminoles', primary: '#782f40', secondary: '#ceb888', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/52.png' },
  'usc': { name: 'USC Trojans', primary: '#990000', secondary: '#ffc72c', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png' },
  'oklahoma': { name: 'Oklahoma Sooners', primary: '#841617', secondary: '#fdf9d8', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/201.png' },
  'colorado': { name: 'Colorado Buffaloes', primary: '#cfb87c', secondary: '#000000', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/38.png' }
};

function getTeamConfig(teamName = '') {
  const clean = (teamName || '').toLowerCase().trim();
  for (const [k, v] of Object.entries(TEAM_CONFIGS)) {
    if (clean.includes(k)) return v;
  }
  return { name: teamName || 'College Football', primary: '#ba0c2f', secondary: '#000000', logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png' };
}

const STAGE_CONFIGS = {
  1: {
    img: '/evolution/stage_1_walk_on_hd.jpg',
    name: 'Walk-On Rookie',
    tierLabel: 'STAGE 1 • LVL 1',
    color: 'text-[#86efac]',
    borderColor: 'border-[#86efac]/40',
    stars: 1,
    glow: 'shadow-emerald-500/10'
  },
  2: {
    img: '/evolution/stage_2_varsity_starter_hd.jpg',
    name: 'Varsity Starter',
    tierLabel: 'STAGE 2 • LVL 5',
    color: 'text-[#4ade80]',
    borderColor: 'border-[#4ade80]/40',
    stars: 2,
    glow: 'shadow-green-500/15'
  },
  3: {
    img: '/evolution/stage_3_all_conference_hd.jpg',
    name: 'All-Conference',
    tierLabel: 'STAGE 3 • LVL 10',
    color: 'text-[#60a5fa]',
    borderColor: 'border-[#60a5fa]/50',
    stars: 3,
    glow: 'shadow-blue-500/20'
  },
  4: {
    img: '/evolution/stage_4_all_american_hd.jpg',
    name: 'All-American',
    tierLabel: 'STAGE 4 • LVL 20',
    color: 'text-[#c084fc]',
    borderColor: 'border-[#c084fc]/50',
    stars: 4,
    glow: 'shadow-purple-500/20'
  },
  5: {
    img: '/evolution/stage_5_heisman_contender_hd.jpg',
    name: 'Heisman Contender',
    tierLabel: 'STAGE 5 • LVL 35',
    color: 'text-[#fbbf24]',
    borderColor: 'border-[#fbbf24]/60',
    stars: 5,
    glow: 'shadow-amber-500/30'
  },
  6: {
    img: '/evolution/stage_6_goat_hall_of_fame_hd.jpg',
    name: 'GOAT / Hall of Famer',
    tierLabel: 'STAGE 6 • LVL 50+',
    color: 'text-[#fde047]',
    borderColor: 'border-[#fde047] ring-2 ring-[#fde047]/60 shadow-amber-500/40',
    stars: 5,
    isGoat: true,
    glow: 'shadow-amber-500/50'
  }
};

const POSE_IMAGES = {
  'flex': '/evolution/pose_flex.jpg',
  'heisman': '/evolution/pose_heisman.jpg',
  'celebrate': '/evolution/pose_celebrate.jpg'
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

export function Interactive3DPlayer({
  level = 1,
  correctPicks = 0,
  favoriteTeam = 'Georgia Bulldogs',
  displayName = 'Coach Reed',
  jerseyNumber = '48',
  previewStage = null,
  activePose = 'idle',
  onPoseChange
}) {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [speechBubble, setSpeechBubble] = useState(null);
  const [hotspotFeedback, setHotspotFeedback] = useState(null);
  const [currentPose, setCurrentPose] = useState(activePose);

  const team = getTeamConfig(favoriteTeam);

  // Sync active pose from parent buttons
  useEffect(() => {
    if (activePose) {
      setCurrentPose(activePose);
    }
  }, [activePose]);

  // Determine stage
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

  // Pick actual active image: Pose image if flexing/heisman/celebrating, else stage HD render
  const activeImageSrc = POSE_IMAGES[currentPose] || stage.img;

  // Handle 3D mouse parallax tracking
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotX = -(y / (rect.height / 2)) * 12; // max 12 deg tilt X
    const rotY = (x / (rect.width / 2)) * 15;  // max 15 deg tilt Y

    setRotation({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  const triggerHype = (quote) => {
    setSpeechBubble(quote || HYPE_QUOTES[Math.floor(Math.random() * HYPE_QUOTES.length)]);
    setTimeout(() => setSpeechBubble(null), 3200);
  };

  const triggerHotspot = (type) => {
    if (type === 'bicep') {
      setCurrentPose('flex');
      onPoseChange && onPoseChange('flex');
      setHotspotFeedback('💪 BICEP POWER: +99 STRENGTH');
      triggerHype("Can't tackle this muscle! 🔥");
    } else if (type === 'helmet') {
      setHotspotFeedback('🪖 DARK VISOR: LOCKED IN VISION');
      triggerHype("Laser focus on game day! 🎯");
    } else if (type === 'cleats') {
      setHotspotFeedback('👟 GOLD CLEATS: +99 SPEED');
      triggerHype("Burner speed on the edge! ⚡");
    } else if (type === 'ring') {
      setCurrentPose('celebrate');
      onPoseChange && onPoseChange('celebrate');
      setHotspotFeedback('👑 GOAT CHAMPIONSHIP BLING');
      triggerHype("National Championship Bling! 🏆");
      try {
        confetti({
          particleCount: 50,
          spread: 80,
          origin: { y: 0.6 },
          colors: [team.primary, team.secondary, '#f59e0b', '#fbbf24', '#ffffff']
        });
      } catch (e) {}
    }

    setTimeout(() => {
      setHotspotFeedback(null);
      setCurrentPose('idle');
      onPoseChange && onPoseChange('idle');
    }, 2800);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[340px] sm:max-w-[380px] h-[520px] sm:h-[560px] flex flex-col items-center justify-center select-none cursor-grab active:cursor-grabbing"
      style={{ perspective: '1200px' }}
    >
      {/* 3D Parallax Canvas Wrapper */}
      <div
        className="w-full h-full relative flex items-center justify-center transition-transform duration-150 ease-out"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovered ? 1.02 : 1})`,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* LAYER 1: Dynamic Team Stadium Lighting & Volumetric Glow (translateZ: -40px) */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ transform: 'translateZ(-40px)' }}
        >
          <div 
            className="w-80 h-80 rounded-full filter blur-3xl opacity-80 animate-pulse"
            style={{ background: `radial-gradient(circle, ${team.primary}40 0%, ${team.secondary}20 50%, transparent 70%)` }}
          ></div>
        </div>

        {/* LAYER 2: Stage 6 Fiery Electric Lightning Aura (translateZ: -15px) */}
        {stageNumber >= 5 && (
          <div
            className="absolute inset-0 pointer-events-none flex items-center justify-center"
            style={{ transform: 'translateZ(-15px)' }}
          >
            <div className="w-full h-full border-2 border-amber-400/40 rounded-3xl animate-pulse opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/30 via-orange-500/20 to-transparent filter blur-2xl animate-pulse"></div>
          </div>
        )}

        {/* LAYER 3: Main Photorealistic Character (translateZ: 0px) */}
        <div
          className={`w-full h-full rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-2xl relative bg-[#090c10] ${stage.borderColor} ${stage.glow} ${
            currentPose !== 'idle' ? 'scale-[1.03] ring-4 ring-amber-400/70' : ''
          }`}
          style={{ transform: 'translateZ(0px)', transformStyle: 'preserve-3d' }}
        >
          {/* Photorealistic Character Pose/Stage Image */}
          <img
            key={activeImageSrc}
            src={activeImageSrc}
            alt={stage.name}
            className="w-full h-full object-cover block filter contrast-105 saturate-105 animate-in fade-in zoom-in-95 duration-200"
          />

          {/* Dynamic Team Uniform Tint Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20 mix-blend-color"
            style={{ backgroundColor: team.primary }}
          ></div>

          {/* Stadium Dark Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none"></div>

          {/* LAYER 4A: Official College Team Helmet Decal Emblem Overlay (translateZ: 35px) */}
          <div
            className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-10"
            style={{ transform: 'translateZ(35px)' }}
          >
            <img
              src={team.logo}
              alt={team.name}
              className="w-8 h-8 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] opacity-90"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* LAYER 4B: Authentic Collegiate Tackle-Twill Stitched Jersey Number on Chest (translateZ: 40px) */}
          <div
            className="absolute top-[32%] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none z-10 select-none"
            style={{ transform: 'translateZ(40px)' }}
          >
            <span
              className="font-black tracking-tight leading-none text-4xl sm:text-5xl font-mono athletic-title drop-shadow-[0_6px_10px_rgba(0,0,0,0.95)]"
              style={{
                color: stageNumber >= 4 ? '#fbbf24' : (team.secondary === '#ffffff' ? '#ffffff' : '#f8fafc'),
                textShadow: `0 0 12px ${team.primary}80, 2px 2px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000`
              }}
            >
              {jerseyNumber || '48'}
            </span>
          </div>

          {/* LAYER 4C: Top Right Custom Locker Badge (translateZ: 30px) */}
          <div
            className="absolute top-4 right-4 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/25 text-center shadow-2xl flex items-center space-x-1.5"
            style={{ transform: 'translateZ(30px)' }}
          >
            <img src={team.logo} alt="" className="w-4 h-4 object-contain" />
            <div className="text-sm font-black text-amber-400 font-mono leading-none">
              #{jerseyNumber || '48'}
            </div>
          </div>

          {/* LAYER 4D: Bottom Player Info & Active Pose Pill (translateZ: 30px) */}
          <div
            className="absolute bottom-4 left-4 right-4 bg-black/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 flex items-center justify-between shadow-2xl"
            style={{ transform: 'translateZ(30px)' }}
          >
            <div className="flex items-center space-x-2 truncate">
              <img src={team.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
              <div className="truncate">
                <div className="text-xs font-black text-white font-sans truncate tracking-wide">
                  {displayName}
                </div>
                <div className="text-[10px] text-amber-400 font-bold truncate">
                  {team.name}
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className={`text-xs font-black font-mono ${stage.color}`}>
                {currentPose === 'flex' ? '💪 FLEXING' : currentPose === 'heisman' ? '🏆 HEISMAN' : currentPose === 'celebrate' ? '🎉 WINNING' : `LVL ${level}`}
              </span>
              <div className="text-[9px] text-[#86efac] font-bold">
                {correctPicks} Wins
              </div>
            </div>
          </div>

          {/* Interactive Clickable Hotspots */}
          {/* 1. Helmet / Visor Hotspot */}
          <div
            onClick={() => triggerHotspot('helmet')}
            className="absolute top-8 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full cursor-pointer hover:bg-white/10 transition z-20"
            title="Tap to glint Dark Chrome Visor"
          ></div>

          {/* 2. Bicep / Muscle Hotspot */}
          <div
            onClick={() => triggerHotspot('bicep')}
            className="absolute top-44 left-4 w-24 h-28 rounded-full cursor-pointer hover:bg-white/10 transition z-20"
            title="Tap to Flex Biceps"
          ></div>
          <div
            onClick={() => triggerHotspot('bicep')}
            className="absolute top-44 right-4 w-24 h-28 rounded-full cursor-pointer hover:bg-white/10 transition z-20"
            title="Tap to Flex Biceps"
          ></div>

          {/* 3. Cleats Hotspot */}
          <div
            onClick={() => triggerHotspot('cleats')}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 h-20 rounded-2xl cursor-pointer hover:bg-white/10 transition z-20"
            title="Tap Gold Cleats"
          ></div>

          {/* 4. Championship Ring Hotspot (Stage 6) */}
          {stageNumber >= 6 && (
            <div
              onClick={() => triggerHotspot('ring')}
              className="absolute top-36 left-16 w-16 h-16 rounded-full cursor-pointer hover:ring-2 hover:ring-amber-400 transition z-20 animate-pulse"
              title="Tap Diamond Championship Ring"
            ></div>
          )}
        </div>

        {/* LAYER 5: Hotspot Feedback Badge (translateZ: 60px) */}
        {hotspotFeedback && (
          <div
            className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-black/95 text-amber-400 font-mono font-black text-xs px-4 py-1.5 rounded-full border border-amber-400 shadow-2xl animate-in zoom-in-95 pointer-events-none text-center"
            style={{ transform: 'translateZ(60px)' }}
          >
            {hotspotFeedback}
          </div>
        )}

        {/* LAYER 6: College Hype Speech Bubble (translateZ: 80px) */}
        {speechBubble && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 bg-[#faf6e8] text-black font-black px-4 py-2 rounded-2xl text-xs shadow-2xl border-2 border-black max-w-xs text-center font-sans animate-in zoom-in-95"
            style={{ transform: 'translateZ(80px)' }}
          >
            <span>{speechBubble}</span>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#faf6e8]"></div>
          </div>
        )}
      </div>

      {/* 3D Tilt Instruction Badge */}
      <div className="mt-3 text-center">
        <div className="inline-flex items-center space-x-2 bg-black/80 border border-white/10 px-4 py-1 rounded-full shadow-lg">
          <span className="text-xs">🎮</span>
          <span className="text-[10px] font-bold uppercase text-[#faf6e8] font-mono tracking-wider">
            3D PARALLAX • TILT MOUSE & TAP GEAR
          </span>
        </div>
      </div>
    </div>
  );
}
